"""Photo handler — Gemini Vision for receipt OCR and general image understanding."""

import logging
import os
import uuid

from aiogram import F, Router
from aiogram.types import Message
from asgiref.sync import sync_to_async
from django.core.cache import cache

logger = logging.getLogger("bot")
router = Router()


def _analyze_image_with_gemini(image_bytes: bytes, caption: str = "", locale: str = "ru") -> dict:
    """
    Analyze image with Gemini Vision.
    Returns: {"type": "receipt"|"text"|"general", "text": "...", "data": {...}}
    """
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY", ""))

    lang_map = {"ru": "Russian", "en": "English", "uz": "Uzbek"}
    language = lang_map.get(locale, "Russian")

    prompt = f"""Analyze this image. Respond in {language}.

If it's a RECEIPT or INVOICE:
- Extract: merchant name, items with prices, total amount, currency
- Format as JSON: {{"type": "receipt", "merchant": "...", "items": [{{"name": "...", "price": 0}}], "total": 0, "currency": "...", "summary": "..."}}

If it's a SCREENSHOT of text, document, or task list:
- Extract the text content
- Format as JSON: {{"type": "text", "text": "extracted text here", "summary": "brief description"}}

If it's a GENERAL photo:
- Describe what you see
- Format as JSON: {{"type": "general", "description": "what is in the image", "summary": "brief description"}}

{f'User caption: {caption}' if caption else ''}

Return ONLY valid JSON, nothing else."""

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=[
            types.Content(parts=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                types.Part.from_text(text=prompt),
            ]),
        ],
        config=types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=1024,
        ),
    )

    text = response.text.strip() if response.text else ""

    # Parse JSON
    import json
    # Clean markdown code blocks if present
    if text.startswith("```"):
        text = text.split("\n", 1)[-1].rsplit("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"type": "general", "description": text, "summary": text[:100]}


@router.message(F.photo)
async def handle_photo(message: Message, user=None, authenticated: bool = False, **kwargs):
    if not authenticated or not user:
        return

    locale = getattr(user, "locale", "ru") or "ru"
    await message.answer("📸 Анализирую фото...")

    try:
        # Download best quality photo
        photo = message.photo[-1]
        file = await message.bot.get_file(photo.file_id)
        file_bytes = await message.bot.download_file(file.file_path)
        image_data = file_bytes.read()

        caption = message.caption or ""

        # Analyze with Gemini Vision
        result = await sync_to_async(_analyze_image_with_gemini)(image_data, caption, locale)

        img_type = result.get("type", "general")

        if img_type == "receipt":
            # Receipt → offer to record expense
            merchant = result.get("merchant", "")
            total = result.get("total", 0)
            currency = result.get("currency", user.base_currency or "UZS")
            items = result.get("items", [])
            summary = result.get("summary", "")

            text = f"🧾 <b>Чек распознан:</b>\n"
            if merchant:
                text += f"🏪 {merchant}\n"
            if items:
                text += "\n"
                for item in items[:10]:
                    price = item.get("price", "")
                    text += f"  • {item.get('name', '?')}"
                    if price:
                        text += f" — {price}"
                    text += "\n"
            if total:
                formatted_total = f"{total:,.0f}".replace(",", " ") if isinstance(total, (int, float)) else str(total)
                text += f"\n💰 <b>Итого: {formatted_total} {currency}</b>"

            # Save action for confirmation
            if total and isinstance(total, (int, float)) and total > 0:
                action_id = str(uuid.uuid4())[:8]
                cache.set(f"bot:action:{action_id}", {
                    "intent": "finance_expense",
                    "data": {
                        "amount": total,
                        "category": "Shopping" if not merchant else "",
                        "note": f"Чек: {merchant}" if merchant else "Чек",
                        "currency": currency,
                    },
                    "original_text": summary,
                    "confirmation": "",
                }, 300)

                from apps.bot.keyboards.confirm import get_confirm_keyboard
                text += "\n\nЗаписать как расход?"
                await message.answer(text, reply_markup=get_confirm_keyboard(action_id))
            else:
                await message.answer(text)

        elif img_type == "text":
            # Text/document → show extracted text, offer to create task
            extracted = result.get("text", "")
            summary = result.get("summary", "")

            text = f"📄 <b>Текст распознан:</b>\n\n{extracted[:500]}"
            if len(extracted) > 500:
                text += "..."

            if summary:
                text += f"\n\n📝 {summary}"

            await message.answer(text)

            # Also process via intent parser if caption provided
            if caption:
                from apps.bot.handlers.messages import handle_text
                original_text = message.text
                object.__setattr__(message, 'text', caption)
                try:
                    await handle_text(message, user=user, authenticated=True)
                finally:
                    object.__setattr__(message, 'text', original_text)

        else:
            # General photo
            description = result.get("description", result.get("summary", ""))
            text = f"📷 {description}"

            if caption:
                text += f"\n\n💬 Ваш комментарий: {caption}"
                # Process caption as text command
                from apps.bot.handlers.messages import handle_text
                original_text = message.text
                object.__setattr__(message, 'text', caption)
                try:
                    await handle_text(message, user=user, authenticated=True)
                finally:
                    object.__setattr__(message, 'text', original_text)
            else:
                await message.answer(text)

    except Exception as e:
        logger.error("Photo handler error: %s", e, exc_info=True)
        await message.answer("⚠️ Ошибка обработки фото. Попробуйте ещё раз.")
