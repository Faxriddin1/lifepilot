import io
import subprocess
import tempfile

import structlog

logger = structlog.get_logger()

LANGUAGE_MAP = {
    "ru": "ru-RU",
    "en": "en-US",
    "uz": "uz-UZ",
    "uz-cyr": "uz-UZ",
}


class SpeechService:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google.cloud import speech_v2
            self._client = speech_v2.SpeechAsyncClient()
        return self._client

    async def transcribe(self, audio_bytes: bytes, locale: str) -> str:
        from google.cloud import speech_v2
        from config import settings

        client = self._get_client()
        language = LANGUAGE_MAP.get(locale, "ru-RU")

        recognizer = f"projects/{settings.GOOGLE_PROJECT_ID}/locations/global/recognizers/_"

        config = speech_v2.RecognitionConfig(
            auto_decoding_config=speech_v2.AutoDetectDecodingConfig(),
            language_codes=[language, "ru-RU", "en-US"],
            model="long",
        )

        request = speech_v2.RecognizeRequest(
            recognizer=recognizer,
            config=config,
            content=audio_bytes,
        )

        try:
            response = await client.recognize(request=request)
            if response.results:
                return response.results[0].alternatives[0].transcript
            return ""
        except Exception as e:
            logger.error("speech_error", error=str(e))
            return ""


async def convert_ogg_to_wav(ogg_data: bytes) -> bytes:
    """Convert OGG/OGA audio to WAV using ffmpeg."""
    with tempfile.NamedTemporaryFile(suffix=".ogg", delete=True) as ogg_file:
        ogg_file.write(ogg_data)
        ogg_file.flush()

        wav_path = ogg_file.name.replace(".ogg", ".wav")

        try:
            proc = subprocess.run(
                [
                    "ffmpeg", "-y", "-i", ogg_file.name,
                    "-ar", "16000", "-ac", "1", "-f", "wav", wav_path,
                ],
                capture_output=True,
                timeout=30,
            )
            if proc.returncode != 0:
                logger.error("ffmpeg_error", stderr=proc.stderr.decode()[:200])
                return b""

            with open(wav_path, "rb") as f:
                return f.read()
        except subprocess.TimeoutExpired:
            logger.error("ffmpeg_timeout")
            return b""
        finally:
            import os
            if os.path.exists(wav_path):
                os.unlink(wav_path)
