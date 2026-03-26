import asyncio
import logging

import structlog
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from config import settings
from handlers import start, text, voice, photo, callbacks
from middleware.auth import AuthMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.locale import LocaleMiddleware
from middleware.logging import LoggingMiddleware
from models.user import Base

# Configure structured logging
structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer() if True else structlog.processors.JSONRenderer(),
    ],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()


async def on_startup(bot: Bot, engine, redis: Redis):
    """Initialize database tables and log startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Bot started", bot_id=(await bot.get_me()).id)


async def on_shutdown(bot: Bot, engine, redis: Redis):
    """Cleanup on shutdown."""
    await engine.dispose()
    await redis.aclose()
    logger.info("Bot stopped")


async def main():
    # Initialize bot
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.MARKDOWN),
    )

    # Database
    engine = create_async_engine(settings.DATABASE_URL, pool_size=10, max_overflow=5)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    # Redis
    redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    # Dispatcher
    dp = Dispatcher()

    # Register middleware (order matters)
    dp.message.middleware(LoggingMiddleware())
    dp.message.middleware(RateLimitMiddleware(redis))
    dp.message.middleware(AuthMiddleware(session_factory))
    dp.message.middleware(LocaleMiddleware())

    dp.callback_query.middleware(LoggingMiddleware())
    dp.callback_query.middleware(AuthMiddleware(session_factory))
    dp.callback_query.middleware(LocaleMiddleware())

    # Flood control handler
    from aiogram.types import ErrorEvent
    from aiogram.exceptions import TelegramRetryAfter

    @dp.error()
    async def on_error(event: ErrorEvent):
        if isinstance(event.exception, TelegramRetryAfter):
            retry = event.exception.retry_after
            logger.warning("flood_control", retry_after=retry)
            await asyncio.sleep(retry)
            return True
        logger.error("unhandled_error", error=str(event.exception))
        return False

    # Register routers
    dp.include_router(start.router)
    dp.include_router(callbacks.router)
    dp.include_router(voice.router)
    dp.include_router(photo.router)
    dp.include_router(text.router)  # Must be last (catch-all)

    # Pass shared objects via dispatcher
    dp["session_factory"] = session_factory
    dp["redis"] = redis
    dp["engine"] = engine

    # Startup/shutdown
    await on_startup(bot, engine, redis)

    try:
        logger.info("Starting polling...")
        await dp.start_polling(
            bot,
            session_factory=session_factory,
            redis=redis,
        )
    finally:
        await on_shutdown(bot, engine, redis)


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    asyncio.run(main())
