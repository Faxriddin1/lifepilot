from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import async_sessionmaker

from models.user import TelegramUser
from services.auth import get_valid_token


class AuthMiddleware(BaseMiddleware):
    def __init__(self, session_factory: async_sessionmaker):
        self.session_factory = session_factory

    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        # Extract user from event
        if isinstance(event, Message):
            tg_user = event.from_user
        elif isinstance(event, CallbackQuery):
            tg_user = event.from_user
        else:
            return await handler(event, data)

        if not tg_user:
            return await handler(event, data)

        # Allow /start, /help and auth flow without auth
        is_start = isinstance(event, Message) and event.text and event.text.startswith(("/start", "/help"))
        is_auth_callback = isinstance(event, CallbackQuery) and event.data and event.data.startswith("auth:")

        # Check if user is in FSM login flow
        is_login_flow = False
        state = data.get("state")
        if state:
            current_state = await state.get_state()
            if current_state and current_state.startswith("LoginStates:"):
                is_login_flow = True

        if is_start or is_auth_callback or is_login_flow:
            data["lifepilot_user"] = None
            data["api_token"] = None
            data["session_factory"] = self.session_factory
            return await handler(event, data)

        # Check if user is linked
        async with self.session_factory() as session:
            result = await session.execute(
                select(TelegramUser).where(
                    TelegramUser.telegram_id == tg_user.id,
                    TelegramUser.is_active == True,
                )
            )
            user = result.scalar_one_or_none()

        if not user or not user.access_token:
            if isinstance(event, Message):
                await event.answer("Сначала привяжите аккаунт LifePilot: /start")
            elif isinstance(event, CallbackQuery):
                await event.answer("Привяжите аккаунт: /start", show_alert=True)
            return

        # Get valid token (auto-refresh if needed)
        try:
            token = await get_valid_token(user, self.session_factory)
        except Exception:
            if isinstance(event, Message):
                await event.answer("🔑 Сессия истекла. Привяжите аккаунт заново: /start")
            elif isinstance(event, CallbackQuery):
                await event.answer("Сессия истекла. /start", show_alert=True)
            return

        # Update last_activity
        try:
            async with self.session_factory() as session:
                await session.execute(
                    update(TelegramUser)
                    .where(TelegramUser.telegram_id == tg_user.id)
                    .values(last_activity=func.now())
                )
                await session.commit()
        except Exception:
            pass  # Non-critical

        data["lifepilot_user"] = user
        data["api_token"] = token
        data["session_factory"] = self.session_factory

        return await handler(event, data)
