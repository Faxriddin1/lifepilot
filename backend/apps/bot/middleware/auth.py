"""Auth middleware — checks Telegram ID → User binding via Redis JWT."""

import logging
from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject
from django.core.cache import cache

logger = logging.getLogger("bot")

SKIP_COMMANDS = {"/start", "/help"}
SKIP_CALLBACK_PREFIXES = {"reg:", "link:"}


class AuthMiddleware(BaseMiddleware):
    """
    Check if Telegram user is linked to a LifePilot account.
    Adds 'user', 'authenticated', 'tokens' to handler data.
    Skips auth for /start and /help.
    If telegram_id found in DB but no JWT in Redis → auto-authenticate.
    """

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        # Get telegram_id and text
        if isinstance(event, Message):
            telegram_id = event.from_user.id if event.from_user else None
            text = event.text or ""
        elif isinstance(event, CallbackQuery):
            telegram_id = event.from_user.id if event.from_user else None
            text = ""
        else:
            return await handler(event, data)

        if not telegram_id:
            return await handler(event, data)

        # Skip auth for /start, /help
        if any(text.startswith(cmd) for cmd in SKIP_COMMANDS):
            data["user"] = None
            data["authenticated"] = False
            return await handler(event, data)

        # Skip auth for registration/linking callbacks
        if isinstance(event, CallbackQuery) and event.data:
            if any(event.data.startswith(prefix) for prefix in SKIP_CALLBACK_PREFIXES):
                data["user"] = None
                data["authenticated"] = False
                return await handler(event, data)

        # Skip auth if user is in registration/linking FSM state
        from aiogram.fsm.context import FSMContext
        fsm_context: FSMContext = data.get("state")
        if fsm_context:
            state = await fsm_context.get_state()
            if state and ("LinkStates" in state or "link" in state.lower() or "reg" in state.lower()):
                data["user"] = None
                data["authenticated"] = False
                return await handler(event, data)

        # Check JWT in Redis
        tokens = cache.get(f"bot:jwt:{telegram_id}")

        if not tokens:
            # Try auto-link: check if telegram_id exists in DB
            from django.contrib.auth import get_user_model
            User = get_user_model()

            try:
                user = await User.objects.aget(telegram_id=telegram_id)
                # Auto-authenticate!
                from asgiref.sync import sync_to_async
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = await sync_to_async(RefreshToken.for_user)(user)
                tokens = {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user_id": str(user.id),
                }
                cache.set(f"bot:jwt:{telegram_id}", tokens, 60 * 60 * 24 * 7)

                data["user"] = user
                data["authenticated"] = True
                data["tokens"] = tokens
                return await handler(event, data)
            except User.DoesNotExist:
                pass

            # Not linked at all
            if isinstance(event, Message):
                await event.answer("⚠️ Аккаунт не привязан. Используйте /start для подключения.")
            return

        # Load Django User
        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = await User.objects.aget(telegram_id=telegram_id)
            data["user"] = user
            data["authenticated"] = True
            data["tokens"] = tokens
        except User.DoesNotExist:
            cache.delete(f"bot:jwt:{telegram_id}")
            if isinstance(event, Message):
                await event.answer("⚠️ Пользователь не найден. Используйте /start для подключения.")
            return

        return await handler(event, data)
