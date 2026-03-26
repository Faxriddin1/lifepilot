"""
Aiogram 3.x Bot + Dispatcher initialization.
Bot instance is created per-request to avoid event loop conflicts with gunicorn.
"""

import logging
import os

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import Update

logger = logging.getLogger("bot")

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")

# Dispatcher is stateless — can be shared
dp = Dispatcher()

# Register middleware
from apps.bot.middleware.auth import AuthMiddleware
dp.message.middleware(AuthMiddleware())
dp.callback_query.middleware(AuthMiddleware())

# Register handlers (order matters — specific before catch-all)
from apps.bot.handlers import start, callbacks, learning, voice, photo, messages, settings
dp.include_router(start.router)
dp.include_router(settings.router)
dp.include_router(callbacks.router)
dp.include_router(learning.router)
dp.include_router(voice.router)
dp.include_router(photo.router)
dp.include_router(messages.router)


def _create_bot() -> Bot | None:
    """Create a fresh Bot instance (with its own aiohttp session)."""
    if not BOT_TOKEN:
        return None
    return Bot(
        token=BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )


# Keep a module-level reference for imports (management commands, etc.)
bot = _create_bot()


async def process_update(update_data: dict):
    """
    Process a raw Telegram update.
    Creates a fresh Bot instance per call to avoid stale aiohttp sessions.
    """
    fresh_bot = _create_bot()
    if not fresh_bot:
        logger.warning("Bot not initialized (BOT_TOKEN missing)")
        return

    try:
        update = Update.model_validate(update_data, context={"bot": fresh_bot})
        await dp.feed_update(fresh_bot, update)
    finally:
        # Close the session to free resources
        await fresh_bot.session.close()
