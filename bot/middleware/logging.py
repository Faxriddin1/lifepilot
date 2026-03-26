from typing import Any, Awaitable, Callable, Dict

import structlog
from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject

logger = structlog.get_logger()


class LoggingMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        if isinstance(event, Message):
            log_data = {
                "user_id": event.from_user.id if event.from_user else None,
                "chat_id": event.chat.id,
                "content_type": event.content_type,
            }
            if event.text and not event.text.startswith("/"):
                log_data["text_length"] = len(event.text)
            logger.info("message_received", **log_data)
        elif isinstance(event, CallbackQuery):
            logger.info(
                "callback_received",
                user_id=event.from_user.id,
                data=event.data,
            )

        try:
            result = await handler(event, data)
            return result
        except Exception as e:
            logger.error(
                "handler_error",
                error=str(e),
                error_type=type(e).__name__,
                user_id=getattr(event, "from_user", None) and event.from_user.id,
            )
            if isinstance(event, Message):
                await event.answer("⚠️ Произошла ошибка. Попробуйте ещё раз.")
            raise
