from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TelegramUser(Base):
    __tablename__ = "bot_telegram_users"

    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    lifepilot_user_id: Mapped[str] = mapped_column(String(36), nullable=True)
    access_token: Mapped[str] = mapped_column(Text, nullable=True)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=True)
    token_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    locale: Mapped[str] = mapped_column(String(10), default="ru")
    currency: Mapped[str] = mapped_column(String(5), default="UZS")
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Tashkent")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_activity: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )
