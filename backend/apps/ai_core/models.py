"""
AICallLog — audit log for every AI API call.
"""

import uuid

from django.conf import settings
from django.db import models


class AICallLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ai_calls",
    )
    method = models.CharField(max_length=50, db_index=True)
    channel = models.CharField(max_length=20, default="web")  # web / telegram / celery
    prompt_version = models.CharField(max_length=20, default="v1")
    model_name = models.CharField(max_length=50)
    temperature = models.FloatField()
    prompt_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    cached_tokens = models.IntegerField(default=0)
    cost_usd = models.FloatField(default=0.0)
    latency_ms = models.IntegerField(default=0)
    success = models.BooleanField(default=True)
    error_message = models.TextField(blank=True, default="")
    user_rating = models.IntegerField(null=True, blank=True)  # 1-5, filled later
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["method", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]
        verbose_name = "AI Call Log"
        verbose_name_plural = "AI Call Logs"

    def __str__(self):
        return f"{self.method} | {self.model_name} | {'OK' if self.success else 'FAIL'} | {self.created_at:%Y-%m-%d %H:%M}"
