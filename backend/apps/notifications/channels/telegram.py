"""
Telegram delivery channel.

Runs the async aiogram send_message call in a synchronous context using asyncio.
"""

import asyncio
import logging

from django.utils import timezone

logger = logging.getLogger(__name__)

# Mapping of notification type to a display icon
TYPE_ICONS: dict[str, str] = {
    "morning_digest": "\U0001f31e",      # sunrise
    "streak_risk": "\u26a0\ufe0f",       # warning
    "weekly_review": "\U0001f4ca",       # bar chart
    "deadline_reminder": "\u23f0",       # alarm clock
    "plan_ready": "\U0001f4cb",          # clipboard
}

DEFAULT_ICON = "\U0001f514"             # bell


def _format_message(notification) -> str:
    """Build the HTML message text for the given notification."""
    icon = TYPE_ICONS.get(notification.type, DEFAULT_ICON)
    return (
        f"{icon} <b>{notification.title}</b>\n\n"
        f"{notification.body}"
    )


def _build_keyboard(notification):
    """Build an InlineKeyboardMarkup based on notification type/data.

    Returns None when no buttons are applicable.
    """
    try:
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
    except ImportError:
        return None

    buttons: list[list[InlineKeyboardButton]] = []
    data: dict = notification.data or {}

    if notification.type == "morning_digest":
        buttons.append(
            [InlineKeyboardButton(text="\U0001f4cb Open Today's Plan", callback_data="open_daily_plan")]
        )
    elif notification.type == "streak_risk":
        habit_id = data.get("habit_id")
        if habit_id:
            buttons.append(
                [InlineKeyboardButton(text="\u2705 Mark Habit Done", callback_data=f"habit_done:{habit_id}")]
            )
    elif notification.type == "weekly_review":
        buttons.append(
            [InlineKeyboardButton(text="\U0001f4ca View Report", callback_data="open_weekly_report")]
        )
    elif notification.type == "deadline_reminder":
        task_id = data.get("task_id")
        if task_id:
            buttons.append(
                [InlineKeyboardButton(text="\U0001f4c5 View Task", callback_data=f"view_task:{task_id}")]
            )
    elif notification.type == "plan_ready":
        buttons.append(
            [InlineKeyboardButton(text="\U0001f680 Open Plan", callback_data="open_plan")]
        )

    if not buttons:
        return None

    return InlineKeyboardMarkup(inline_keyboard=buttons)


async def _async_send(chat_id: int, text: str, reply_markup) -> None:
    """Async helper that performs the actual Telegram API call."""
    from apps.bot.bot import bot as telegram_bot

    if telegram_bot is None:
        raise RuntimeError("Telegram bot is not initialized (BOT_TOKEN missing).")

    await telegram_bot.send_message(
        chat_id=chat_id,
        text=text,
        reply_markup=reply_markup,
    )


def send_telegram_notification(notification) -> bool:
    """Send a Telegram message for the given Notification instance.

    Updates notification.status, notification.sent_at, and
    notification.error_message in-place and persists the changes.

    Args:
        notification: A Notification model instance with channel="telegram".

    Returns:
        True on success, False on failure.
    """
    user = notification.user
    telegram_id: int | None = getattr(user, "telegram_id", None)

    if not telegram_id:
        notification.status = "failed"
        notification.error_message = "User has no telegram_id."
        notification.save(update_fields=["status", "error_message"])
        return False

    text = _format_message(notification)
    keyboard = _build_keyboard(notification)

    try:
        # Run the coroutine in a new event loop (sync context from Django/Celery).
        loop = asyncio.new_event_loop()
        try:
            loop.run_until_complete(_async_send(telegram_id, text, keyboard))
        finally:
            loop.close()

        notification.status = "sent"
        notification.sent_at = timezone.now()
        notification.error_message = ""
        notification.save(update_fields=["status", "sent_at", "error_message"])
        logger.info("Telegram notification %s sent to user %s.", notification.pk, user.pk)
        return True

    except Exception as exc:
        logger.exception(
            "Error sending Telegram notification %s to user %s: %s",
            notification.pk,
            user.pk,
            exc,
        )
        notification.status = "failed"
        notification.error_message = str(exc)
        notification.save(update_fields=["status", "error_message"])
        return False
