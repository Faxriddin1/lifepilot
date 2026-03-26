import json
import uuid

from aiogram import F, Router
from aiogram.enums import ChatAction
from aiogram.types import Message

from keyboards.confirm import confirm_action_keyboard
from models.user import TelegramUser
from services.ai_parser import AIParser
from services.vision import VisionService
from utils.formatting import format_money

router = Router()
vision_service = VisionService()
ai_parser = AIParser()


def format_receipt_confirmation(receipt: dict, currency: str, locale: str = "ru") -> str:
    store = receipt.get("store_name", "")
    total = receipt.get("total_amount", 0)
    items = receipt.get("items", [])
    category = receipt.get("suggested_category", "")
    date = receipt.get("date", "")

    lines = ["📷 *Чек распознан:*\n"]
    if store:
        lines.append(f"🏪 {store}")
    if date:
        lines.append(f"📅 {date}")
    lines.append("")

    for item in items[:10]:
        lines.append(f"  • {item['name']}: {format_money(item['amount'], currency)}")

    lines.append(f"\n💰 *Итого: {format_money(total, currency)}*")
    lines.append(f"📁 Категория: {category}")
    lines.append(f"\nЗаписать как расход?")

    return "\n".join(lines)


@router.message(F.photo)
async def handle_photo(
    message: Message,
    lifepilot_user: TelegramUser = None,
    api_token: str = None,
    redis=None,
    t=None,
    **kwargs,
):
    if not lifepilot_user or not api_token:
        return

    await message.bot.send_chat_action(chat_id=message.chat.id, action=ChatAction.TYPING)

    # Download photo (best quality)
    photo = message.photo[-1]
    file = await message.bot.get_file(photo.file_id)
    bio = await message.bot.download_file(file.file_path)
    image_bytes = bio.read()

    # OCR
    ocr_text = await vision_service.extract_text(image_bytes)
    if not ocr_text:
        # If has caption, process as text
        if message.caption:
            from handlers.text import handle_text
            message.text = message.caption
            await handle_text(message, lifepilot_user=lifepilot_user, api_token=api_token, redis=redis, t=t, **kwargs)
            return
        await message.answer(t("photo_ocr_failed") if t else "📷 Не удалось распознать текст на фото.")
        return

    # Get user context for AI
    from handlers.text import get_user_context
    user_context = await get_user_context(lifepilot_user, api_token, redis)

    # Add caption as context
    if message.caption:
        user_context["additional_context"] = message.caption

    # Parse receipt
    receipt = await ai_parser.parse_receipt(ocr_text, user_context)

    if not receipt.get("is_receipt"):
        if message.caption:
            message.text = message.caption
            from handlers.text import handle_text
            await handle_text(message, lifepilot_user=lifepilot_user, api_token=api_token, redis=redis, t=t, **kwargs)
            return
        await message.answer(t("photo_not_receipt") if t else "📷 Не похоже на чек.")
        return

    # Show receipt and ask confirmation
    text = format_receipt_confirmation(receipt, lifepilot_user.currency, lifepilot_user.locale)

    action_id = str(uuid.uuid4())[:8]
    if redis:
        await redis.setex(
            f"bot:action:{action_id}",
            300,
            json.dumps({
                "intent": "finance_expense",
                "data": {
                    "amount": receipt.get("total_amount", 0),
                    "category": receipt.get("suggested_category", "Other"),
                    "description": receipt.get("store_name", "Чек"),
                    "date": receipt.get("date"),
                },
                "confirmation_message": text,
            }, ensure_ascii=False),
        )

    await message.answer(text, reply_markup=confirm_action_keyboard(action_id, lifepilot_user.locale))
