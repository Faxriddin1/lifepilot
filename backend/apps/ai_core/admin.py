from django.contrib import admin

from .models import AICallLog


@admin.register(AICallLog)
class AICallLogAdmin(admin.ModelAdmin):
    list_display = (
        "method",
        "model_name",
        "channel",
        "cost_usd",
        "latency_ms",
        "prompt_tokens",
        "output_tokens",
        "success",
        "created_at",
    )
    list_filter = ("method", "model_name", "channel", "success")
    search_fields = ("method", "error_message")
    readonly_fields = (
        "id",
        "user",
        "method",
        "channel",
        "prompt_version",
        "model_name",
        "temperature",
        "prompt_tokens",
        "output_tokens",
        "cached_tokens",
        "cost_usd",
        "latency_ms",
        "success",
        "error_message",
        "user_rating",
        "created_at",
    )
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
