"""
NotificationService — central entry point for sending notifications.

Usage:
    from apps.notifications.services import NotificationService
    notifications = NotificationService.send(
        user=user,
        notification_type="morning_digest",
        title="Good morning!",
        body="Here is your daily summary.",
        data={"tasks_due": 3},
    )
"""

import logging
from datetime import datetime

import pytz
from django.utils import timezone

from apps.notifications.models import Notification, NotificationPreference

logger = logging.getLogger(__name__)

# Maps notification type strings to the corresponding preference field name.
TYPE_PREFERENCE_MAP = {
    "morning_digest": "morning_digest",
    "streak_risk": "streak_risk",
    "weekly_review": "weekly_review",
    "deadline_reminder": "deadline_reminder",
    "plan_ready": "plan_ready",
}


def _is_quiet_hours(prefs: NotificationPreference, user_tz_str: str) -> bool:
    """Return True if the current local time falls within the user's quiet hours.

    Supports overnight windows (e.g. 22:00 -> 08:00).
    """
    try:
        tz = pytz.timezone(user_tz_str)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC

    local_now: datetime = timezone.now().astimezone(tz)
    current_time = local_now.time().replace(second=0, microsecond=0)

    start = prefs.quiet_hours_start
    end = prefs.quiet_hours_end

    if start <= end:
        # Same-day window (e.g. 02:00 -> 06:00)
        return start <= current_time < end
    else:
        # Overnight window (e.g. 22:00 -> 08:00)
        return current_time >= start or current_time < end


class NotificationService:
    """Handles preference checks, quiet-hours gating, and channel dispatching."""

    @staticmethod
    def send(
        user,
        notification_type: str,
        title: str,
        body: str,
        data: dict | None = None,
        force: bool = False,
    ) -> list[Notification]:
        """Create and dispatch notifications for the given user.

        Args:
            user: AUTH_USER_MODEL instance.
            notification_type: Logical type string (e.g. "morning_digest").
            title: Short title shown in the notification.
            body: Full notification body text.
            data: Optional extra payload stored in JSONField.
            force: Skip preference and quiet-hours checks when True.

        Returns:
            List of created Notification objects (one per dispatched channel).
        """
        if data is None:
            data = {}

        # 1. Get or create preferences
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)

        created_notifications: list[Notification] = []

        # 2. Check type-level preference (unless forced)
        if not force:
            pref_field = TYPE_PREFERENCE_MAP.get(notification_type)
            if pref_field and not getattr(prefs, pref_field, True):
                logger.debug(
                    "Notification type %s disabled for user %s — skipping.",
                    notification_type,
                    user.pk,
                )
                return created_notifications

            # 3. Check quiet hours
            if _is_quiet_hours(prefs, getattr(user, "timezone", "UTC")):
                logger.debug(
                    "Quiet hours active for user %s — skipping notification.", user.pk
                )
                return created_notifications

        # 4. Telegram channel
        if prefs.telegram_enabled and getattr(user, "telegram_id", None):
            tg_notification = Notification.objects.create(
                user=user,
                type=notification_type,
                title=title,
                body=body,
                data=data,
                channel="telegram",
                status="pending",
            )
            try:
                from apps.notifications.channels.telegram import (
                    send_telegram_notification,
                )

                send_telegram_notification(tg_notification)
            except Exception as exc:
                logger.exception(
                    "Failed to send Telegram notification %s: %s",
                    tg_notification.pk,
                    exc,
                )
                tg_notification.status = "failed"
                tg_notification.error_message = str(exc)
                tg_notification.save(update_fields=["status", "error_message"])

            created_notifications.append(tg_notification)

        # 5. Web channel — just persist with status="sent"
        if prefs.web_enabled:
            web_notification = Notification.objects.create(
                user=user,
                type=notification_type,
                title=title,
                body=body,
                data=data,
                channel="web",
                status="sent",
                sent_at=timezone.now(),
            )
            created_notifications.append(web_notification)

        return created_notifications
