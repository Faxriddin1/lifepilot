from django.contrib import admin

from apps.notifications.models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Django admin configuration for the Notification model."""

    date_hierarchy = "created_at"
    list_display = ("user", "type", "channel", "status", "title_short", "created_at")
    list_filter = ("type", "channel", "status")
    search_fields = ("title", "body")
    ordering = ("-created_at",)

    def get_readonly_fields(self, request, obj=None):
        """Make all fields read-only in the admin."""
        if obj:
            return [f.name for f in obj._meta.get_fields() if hasattr(f, "name")]
        return self.readonly_fields

    @admin.display(description="Title")
    def title_short(self, obj: Notification) -> str:
        """Truncate long titles in the list view."""
        if len(obj.title) > 60:
            return obj.title[:57] + "..."
        return obj.title


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    """Django admin configuration for the NotificationPreference model."""

    list_display = (
        "user",
        "morning_digest",
        "streak_risk",
        "telegram_enabled",
        "web_enabled",
    )
    search_fields = ("user__email", "user__name")
    ordering = ("user__email",)
