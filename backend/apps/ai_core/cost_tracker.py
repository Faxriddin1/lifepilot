"""
Cost calculation and AICallLog creation.
"""

import logging

from .constants import PRICING
from .models import AICallLog

logger = logging.getLogger("ai_core")


def log_ai_call(
    *,
    user,
    method: str,
    channel: str,
    prompt_version: str,
    model_name: str,
    temperature: float,
    prompt_tokens: int,
    output_tokens: int,
    cached_tokens: int,
    latency_ms: int,
    success: bool,
    error_message: str = "",
) -> AICallLog:
    """Calculate cost and create an AICallLog entry."""
    pricing = PRICING.get(model_name, {"input": 0.0, "output": 0.0})
    billable_input = max(0, prompt_tokens - cached_tokens)
    cost_usd = (billable_input * pricing["input"] / 1_000_000) + (
        output_tokens * pricing["output"] / 1_000_000
    )

    log_entry = AICallLog.objects.create(
        user=user,
        method=method,
        channel=channel,
        prompt_version=prompt_version,
        model_name=model_name,
        temperature=temperature,
        prompt_tokens=prompt_tokens,
        output_tokens=output_tokens,
        cached_tokens=cached_tokens,
        cost_usd=round(cost_usd, 8),
        latency_ms=latency_ms,
        success=success,
        error_message=error_message,
    )

    level = logging.INFO if success else logging.WARNING
    logger.log(
        level,
        "AI call: %s | %s | %s | tokens=%d→%d | $%.6f | %dms",
        method,
        model_name,
        "OK" if success else f"FAIL: {error_message[:80]}",
        prompt_tokens,
        output_tokens,
        cost_usd,
        latency_ms,
    )

    return log_entry
