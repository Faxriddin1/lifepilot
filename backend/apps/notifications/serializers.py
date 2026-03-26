from rest_framework import serializers

from apps.notifications.models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Read-only serializer for a single Notification."""

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "body",
            "data",
            "status",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for reading and updating NotificationPreference."""

    class Meta:
        model = NotificationPreference
        fields = [
            "morning_digest",
            "streak_risk",
            "weekly_review",
            "deadline_reminder",
            "plan_ready",
            "quiet_hours_start",
            "quiet_hours_end",
            "telegram_enabled",
            "web_enabled",
        ]
