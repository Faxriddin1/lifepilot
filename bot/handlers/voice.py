from aiogram import F, Router
from aiogram.enums import ChatAction
from aiogram.types import Message

from models.user import TelegramUser
from services.speech import SpeechService, convert_ogg_to_wav

router = Router()
speech_service = SpeechService()


@router.message(F.voice | F.audio)
async def handle_voice(
    message: Message,
    lifepilot_user: TelegramUser = None,
    api_token: str = None,
    t=None,
    **kwargs,
):
    if not lifepilot_user or not api_token:
        return

    # Check duration limit (2 minutes)
    duration = None
    if message.voice:
        duration = message.voice.duration
    elif message.audio:
        duration = message.audio.duration
    if duration and duration > 120:
        await message.answer(t("voice_too_long") if t else "🎤 Максимум 2 минуты. Запишите короче.")
        return

    await message.bot.send_chat_action(chat_id=message.chat.id, action=ChatAction.TYPING)

    # Download audio
    file_obj = message.voice or message.audio
    file = await message.bot.get_file(file_obj.file_id)
    bio = await message.bot.download_file(file.file_path)
    audio_bytes = bio.read()

    # Convert ogg to wav
    wav_bytes = await convert_ogg_to_wav(audio_bytes)
    if not wav_bytes:
        await message.answer(t("voice_failed") if t else "🎤 Не удалось обработать аудио.")
        return

    # Transcribe
    text = await speech_service.transcribe(wav_bytes, lifepilot_user.locale)
    if not text:
        await message.answer(t("voice_failed") if t else "🎤 Не удалось распознать речь.")
        return

    # Show transcription
    await message.answer(f"🎤 Распознано: _{text}_")

    # Process as text (import here to avoid circular import)
    from handlers.text import handle_text
    # Create a fake-like message processing by reusing the text handler logic
    from handlers.text import ai_parser, get_user_context, execute_intent, WRITE_INTENTS, split_long_message
    from keyboards.confirm import confirm_action_keyboard
    import json
    import uuid

    user_context = await get_user_context(lifepilot_user, api_token, kwargs.get("redis"))
    parsed = await ai_parser.parse_message(text, user_context)

    if parsed.confidence < 0.7 or parsed.clarification_question:
        await message.answer(parsed.clarification_question or "🤔 Уточните, пожалуйста.")
        return

    if parsed.missing_fields:
        await message.answer(parsed.clarification_question or "🤔 Уточните, пожалуйста.")
        return

    if parsed.intent == "help":
        await message.answer(t("help") if t else "Напишите /help")
        return

    if parsed.intent in WRITE_INTENTS:
        action_id = str(uuid.uuid4())[:8]
        redis = kwargs.get("redis")
        if redis:
            await redis.setex(
                f"bot:action:{action_id}",
                300,
                json.dumps({"intent": parsed.intent, "data": parsed.data, "confirmation_message": parsed.confirmation_message}, ensure_ascii=False),
            )
        await message.answer(
            parsed.confirmation_message or "Выполнить действие?",
            reply_markup=confirm_action_keyboard(action_id, lifepilot_user.locale),
        )
        return

    result = await execute_intent(parsed, api_token, lifepilot_user)
    if result:
        for part in split_long_message(result):
            await message.answer(part)
