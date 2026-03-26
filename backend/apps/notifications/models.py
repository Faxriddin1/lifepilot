import uuid
from datetime import time

from django.conf import settings
from django.db import models


class Notification(models.Model):
    """A single notification sent to a user via one channel."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=50, db_index=True)
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict)
    channel = models.CharField(max_length=20)
    status = models.CharField(max_length=20, default="pending")
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status", "created_at"]),
            models.Index(fields=["user", "type", "created_at"]),
        ]
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"[{self.channel}] {self.type} -> {self.user_id} ({self.status})"


class NotificationPreference(models.Model):
    """Per-user notification preference settings."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )

    # Type-level toggles
    morning_digest = models.BooleanField(default=True)
    streak_risk = models.BooleanField(default=True)
    weekly_review = models.BooleanField(default=True)
    deadline_reminder = models.BooleanField(default=True)
    plan_ready = models.BooleanField(default=True)

    # Quiet hours (inclusive: start -> end means do-not-disturb window)
    quiet_hours_start = models.TimeField(default=time(22, 0))
    quiet_hours_end = models.TimeField(default=time(8, 0))

    # Channel toggles
    telegram_enabled = models.BooleanField(default=True)
    web_enabled = models.BooleanField(default=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Notification Preference"
        verbose_name_plural = "Notification Preferences"

    def __str__(self):
        return f"Preferences for {self.user_id}"
