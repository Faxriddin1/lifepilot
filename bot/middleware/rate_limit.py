from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import Message, TelegramObject
from redis.asyncio import Redis

from config import settings


class RateLimitMiddleware(BaseMiddleware):
    def __init__(self, redis: Redis):
        self.redis = redis

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        if not isinstance(event, Message) or not event.from_user:
            return await handler(event, data)

        user_id = event.from_user.id

        # Message rate limit
        msg_key = f"rate:msg:{user_id}"
        count = await self.redis.incr(msg_key)
        if count == 1:
            await self.redis.expire(msg_key, settings.RATE_LIMIT_PERIOD)

        if count > settings.RATE_LIMIT_MESSAGES:
            await event.answer("⏳ Слишком много сообщений. Подождите минуту.")
            return

        # AI call rate limit (hourly)
        ai_key = f"rate:ai:{user_id}"
        ai_count = int(await self.redis.get(ai_key) or 0)
        if ai_count >= settings.RATE_LIMIT_AI_CALLS:
            await event.answer("🤖 Лимит AI-запросов исчерпан. Попробуйте через час.")
            return

        # Daily AI limit (200/day)
        daily_key = f"rate:ai_daily:{user_id}"
        daily_count = int(await self.redis.get(daily_key) or 0)
        if daily_count >= 200:
            await event.answer("🤖 Дневной лимит AI-запросов исчерпан. Попробуйте завтра.")
            return

        data["redis"] = self.redis
        return await handler(event, data)


async def increment_ai_usage(redis: Redis, user_id: int):
    """Call this after each Gemini API call."""
    # Hourly
    ai_key = f"rate:ai:{user_id}"
    count = await redis.incr(ai_key)
    if count == 1:
        await redis.expire(ai_key, 3600)

    # Daily
    daily_key = f"rate:ai_daily:{user_id}"
    daily = await redis.incr(daily_key)
    if daily == 1:
        await redis.expire(daily_key, 86400)
