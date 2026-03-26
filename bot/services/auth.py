from datetime import datetime, timedelta

from cryptography.fernet import Fernet
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import async_sessionmaker

from config import settings
from models.user import TelegramUser
from services.lifepilot_api import LifePilotAPI

_fernet = None


def get_fernet() -> Fernet:
    global _fernet
    if _fernet is None:
        _fernet = Fernet(settings.ENCRYPTION_KEY.encode())
    return _fernet


def encrypt_token(token: str) -> str:
    return get_fernet().encrypt(token.encode()).decode()


def decrypt_token(encrypted: str) -> str:
    return get_fernet().decrypt(encrypted.encode()).decode()


async def get_valid_token(user: TelegramUser, session_factory: async_sessionmaker) -> str:
    """Get a valid access token, auto-refreshing if needed."""
    access = decrypt_token(user.access_token)

    # If token expires within 2 minutes, refresh
    if user.token_expires_at and user.token_expires_at < datetime.utcnow() + timedelta(minutes=2):
        refresh = decrypt_token(user.refresh_token)
        api = LifePilotAPI()
        new_tokens = await api.refresh_token(refresh)

        if not new_tokens:
            raise Exception("Token refresh failed")

        async with session_factory() as session:
            await session.execute(
                update(TelegramUser)
                .where(TelegramUser.telegram_id == user.telegram_id)
                .values(
                    access_token=encrypt_token(new_tokens["access"]),
                    refresh_token=encrypt_token(new_tokens["refresh"]),
                    token_expires_at=datetime.utcnow() + timedelta(minutes=28),
                )
            )
            await session.commit()

        return new_tokens["access"]

    return access


async def link_account(
    telegram_id: int,
    email: str,
    password: str,
    session_factory: async_sessionmaker,
) -> dict | None:
    """Login to LifePilot and save credentials."""
    api = LifePilotAPI()
    result = await api.login(email, password)

    if not result:
        return None

    user_data = result["user"]
    tokens = result["tokens"]

    async with session_factory() as session:
        # Check if user exists
        existing = await session.execute(
            select(TelegramUser).where(TelegramUser.telegram_id == telegram_id)
        )
        tg_user = existing.scalar_one_or_none()

        if tg_user:
            tg_user.lifepilot_user_id = user_data["id"]
            tg_user.access_token = encrypt_token(tokens["access"])
            tg_user.refresh_token = encrypt_token(tokens["refresh"])
            tg_user.token_expires_at = datetime.utcnow() + timedelta(minutes=28)
            tg_user.locale = user_data.get("locale", "ru")
            tg_user.currency = user_data.get("base_currency", "UZS")
            tg_user.timezone = user_data.get("timezone", "Asia/Tashkent")
            tg_user.is_active = True
        else:
            tg_user = TelegramUser(
                telegram_id=telegram_id,
                lifepilot_user_id=user_data["id"],
                access_token=encrypt_token(tokens["access"]),
                refresh_token=encrypt_token(tokens["refresh"]),
                token_expires_at=datetime.utcnow() + timedelta(minutes=28),
                locale=user_data.get("locale", "ru"),
                currency=user_data.get("base_currency", "UZS"),
                timezone=user_data.get("timezone", "Asia/Tashkent"),
            )
            session.add(tg_user)

        await session.commit()

    return user_data


async def link_account_by_code(
    telegram_id: int,
    code: str,
    session_factory: async_sessionmaker,
) -> dict | None:
    """Verify a 6-digit code from LifePilot Settings and link account."""
    api = LifePilotAPI()

    # Call backend to verify code and get tokens
    result = await api.verify_telegram_code(code, telegram_id)

    if not result:
        return None

    user_data = result["user"]
    tokens = result["tokens"]

    async with session_factory() as session:
        existing = await session.execute(
            select(TelegramUser).where(TelegramUser.telegram_id == telegram_id)
        )
        tg_user = existing.scalar_one_or_none()

        if tg_user:
            tg_user.lifepilot_user_id = user_data["id"]
            tg_user.access_token = encrypt_token(tokens["access"])
            tg_user.refresh_token = encrypt_token(tokens["refresh"])
            tg_user.token_expires_at = datetime.utcnow() + timedelta(minutes=28)
            tg_user.locale = user_data.get("locale", "ru")
            tg_user.currency = user_data.get("base_currency", "UZS")
            tg_user.timezone = user_data.get("timezone", "Asia/Tashkent")
            tg_user.is_active = True
        else:
            tg_user = TelegramUser(
                telegram_id=telegram_id,
                lifepilot_user_id=user_data["id"],
                access_token=encrypt_token(tokens["access"]),
                refresh_token=encrypt_token(tokens["refresh"]),
                token_expires_at=datetime.utcnow() + timedelta(minutes=28),
                locale=user_data.get("locale", "ru"),
                currency=user_data.get("base_currency", "UZS"),
                timezone=user_data.get("timezone", "Asia/Tashkent"),
            )
            session.add(tg_user)

        await session.commit()

    return user_data
