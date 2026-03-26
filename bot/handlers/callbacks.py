import json

import structlog
from aiogram import F, Router
from aiogram.types import CallbackQuery

from handlers.text import execute_intent, invalidate_context_cache, MUTATING_INTENTS
from models.user import TelegramUser
from services.ai_parser import ParsedIntent

logger = structlog.get_logger()
router = Router()


@router.callback_query(F.data.startswith("confirm:"))
async def handle_confirm(
    callback: CallbackQuery,
    lifepilot_user: TelegramUser = None,
    api_token: str = None,
    redis=None,
    t=None,
    **kwargs,
):
    action_id = callback.data.split(":")[1]

    if not redis:
        await callback.answer("Ошибка", show_alert=True)
        return

    # Get pending action
    raw = await redis.get(f"bot:action:{action_id}")
    if not raw:
        await callback.answer("Действие устарело", show_alert=True)
        try:
            await callback.message.edit_text("⏳ Действие устарело. Попробуйте заново.")
        except Exception:
            pass
        return

    action = json.loads(raw)
    logger.info("confirm_action", intent=action["intent"], data=action["data"])

    parsed = ParsedIntent(
        intent=action["intent"],
        data=action["data"],
    )

    # Execute
    result = await execute_intent(parsed, api_token, lifepilot_user)
    logger.info("execute_result", intent=parsed.intent, result=result[:100] if result else None)

    # Cleanup
    await redis.delete(f"bot:action:{action_id}")

    # Invalidate cache after mutation
    if parsed.intent in MUTATING_INTENTS and lifepilot_user:
        await invalidate_context_cache(lifepilot_user, redis)

    try:
        await callback.message.edit_text(result or "✅ Готово!", parse_mode=None)
    except Exception as e:
        logger.error("edit_text_error", error=str(e))
        try:
            await callback.message.answer(result or "✅ Готово!", parse_mode=None)
        except Exception:
            pass
    await callback.answer()


@router.callback_query(F.data.startswith("cancel:"))
async def handle_cancel(callback: CallbackQuery, redis=None, t=None, **kwargs):
    action_id = callback.data.split(":")[1]

    if redis:
        await redis.delete(f"bot:action:{action_id}")

    await callback.message.edit_text(t("action_cancelled") if t else "❌ Отменено.")
    await callback.answer()
