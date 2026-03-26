"""Simple rate limiting for bot messages."""

from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import Message, TelegramObject
from django.core.cache import cache


class RateLimitMiddleware(BaseMiddleware):
    """Rate limit: 30 messages/minute per user."""

    LIMIT = 30
    WINDOW = 60  # seconds

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        if not isinstance(event, Message) or not event.from_user:
            return await handler(event, data)

        key = f"bot:rl:{event.from_user.id}"
        count = cache.get(key, 0)

        if count >= self.LIMIT:
            await event.answer("⏳ Too many messages. Please wait a minute.")
            return

        cache.set(key, count + 1, self.WINDOW)
        return await handler(event, data)
