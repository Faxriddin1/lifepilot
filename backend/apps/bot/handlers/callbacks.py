"""Callback query handlers — confirm/cancel actions."""

import logging

from aiogram import F, Router
from aiogram.types import CallbackQuery
from django.core.cache import cache

logger = logging.getLogger("bot")
router = Router()


@router.callback_query(F.data.startswith("confirm:"))
async def handle_confirm(callback: CallbackQuery, user=None, **kwargs):
    action_id = callback.data.split(":")[1]
    action = cache.get(f"bot:action:{action_id}")

    if not action:
        await callback.message.edit_text("⏰ Время подтверждения истекло.")
        await callback.answer()
        return

    if not user:
        await callback.message.edit_text("⚠️ Не авторизован.")
        await callback.answer()
        return

    # Merge original_text and confirmation into data for executor
    exec_data = dict(action.get("data") or {})
    exec_data["original_text"] = action.get("original_text", "")
    exec_data["confirmation"] = action.get("confirmation", "")

    from apps.bot.handlers.executor import execute_write_intent
    result = await execute_write_intent(action["intent"], exec_data, user)

    cache.delete(f"bot:action:{action_id}")
    await callback.message.edit_text(result)
    await callback.answer()


@router.callback_query(F.data.startswith("cancel:"))
async def handle_cancel(callback: CallbackQuery, **kwargs):
    action_id = callback.data.split(":")[1]
    cache.delete(f"bot:action:{action_id}")
    await callback.message.edit_text("❌ Отменено.")
    await callback.answer()
