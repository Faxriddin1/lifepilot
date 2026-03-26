"""Voice message handler — STT via Gemini → text → intent parsing."""

import logging
import os
import subprocess
import tempfile
import base64

from aiogram import F, Router
from aiogram.types import Message
from asgiref.sync import sync_to_async

logger = logging.getLogger("bot")
router = Router()


def _transcribe_with_gemini(audio_bytes: bytes, locale: str = "ru") -> str:
    """Transcribe audio using Gemini's multimodal capabilities."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

    lang_map = {"ru": "Russian", "en": "English", "uz": "Uzbek"}
    language = lang_map.get(locale, "Russian")

    prompt_text = (
        "Transcribe this audio message exactly as spoken, word by word. "
        "The speaker may use Russian, Uzbek, English, or mix of these languages. "
        "RULES:\n"
        "1. Do NOT translate — write exactly what was said in the original language\n"
        "2. If Uzbek (Latin): write in Latin script (ishga borish kerak)\n"
        "3. If Uzbek (Cyrillic): write in Cyrillic (ишга бориш керак)\n"
        "4. If Russian: write in Russian (нужно поехать на работу)\n"
        "5. If mixed languages — write each word in its original language\n"
        "6. Uzbek words like: kerak, qilish, borish, olish, vazifa, ish — keep as Uzbek\n"
        "Return ONLY the transcribed text, nothing else."
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=[
            types.Content(parts=[
                types.Part.from_bytes(data=audio_bytes, mime_type="audio/ogg"),
                types.Part.from_text(text=prompt_text),
            ]),
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=500,
        ),
    )

    return response.text.strip() if response.text else ""


@router.message(F.voice)
async def handle_voice(message: Message, user=None, authenticated: bool = False, **kwargs):
    if not authenticated or not user:
        return

    locale = getattr(user, "locale", "ru") or "ru"
    await message.answer("🎤 Распознаю...")

    try:
        # Download voice file
        file = await message.bot.get_file(message.voice.file_id)
        file_bytes = await message.bot.download_file(file.file_path)
        audio_data = file_bytes.read()

        # Transcribe with Gemini (no ffmpeg needed — Gemini accepts OGG)
        text = await sync_to_async(_transcribe_with_gemini)(audio_data, locale)

        if not text:
            await message.answer("🎤 Не удалось распознать. Попробуйте ещё раз или напишите текстом.")
            return

        await message.answer(f"🎤 Распознано: <i>{text}</i>")

        # Forward to text handler
        from apps.bot.handlers.messages import handle_text

        # Temporarily set text on message for the handler
        original_text = message.text
        object.__setattr__(message, 'text', text)
        try:
            await handle_text(message, user=user, authenticated=True)
        finally:
            object.__setattr__(message, 'text', original_text)

    except Exception as e:
        logger.error("Voice handler error: %s", e, exc_info=True)
        await message.answer("⚠️ Ошибка обработки голоса. Попробуйте текстом.")
