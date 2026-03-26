from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

from i18n import get_translator


class LocaleMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        user = data.get("lifepilot_user")
        locale = user.locale if user else "ru"
        data["t"] = get_translator(locale)
        data["locale"] = locale
        return await handler(event, data)
