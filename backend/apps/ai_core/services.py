"""
AIService — unified AI service layer for LifePilot.
7 public methods + 2 private helpers.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from .cache import get_cached, make_cache_key, set_cached
from .client import get_gemini_client
from .constants import AI_METHOD_CONFIG
from .cost_tracker import log_ai_call
from .exceptions import AIInvalidResponseError, AIServiceError
from .prompt_loader import load_prompt
from .schemas import (
    DailyTasks,
    Insights,
    LearningPlan,
    ParsedIntent,
    PlanAdaptation,
    ReceiptData,
)

logger = logging.getLogger("ai_core")

# ---------------------------------------------------------------------------
# Langfuse integration (optional — activated when LANGFUSE_PUBLIC_KEY is set)
# ---------------------------------------------------------------------------

LANGFUSE_ENABLED = bool(os.environ.get("LANGFUSE_PUBLIC_KEY"))

if LANGFUSE_ENABLED:
    from langfuse import Langfuse
    from langfuse.decorators import observe

    langfuse_client = Langfuse()
else:
    # Provide a no-op observe decorator so the rest of the code is unchanged
    def observe(func=None, **kwargs):  # type: ignore[misc]
        """No-op replacement for langfuse.decorators.observe when Langfuse is disabled."""
        if func is not None:
            return func

        def decorator(f):
            return f

        return decorator

    langfuse_client = None  # type: ignore[assignment]


class AIService:
    """
    Unified AI service for LifePilot.

    All methods accept:
        user: Django User instance (or None for anonymous)
        channel: "web" | "telegram" | "celery"

    Structured methods return Pydantic v2 objects.
    Text methods return plain strings.
    """

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    @observe(name="ai_call_structured")
    def _call_structured(
        method: str,
        contents: str,
        schema: type,
        cache_args: tuple | None,
        user: Any | None,
        channel: str,
    ):
        """
        Call Gemini with JSON mode, validate against Pydantic schema.

        1. Check Redis cache → hit → validate → return
        2. Load prompt → call Gemini (json_mode=True)
        3. Parse → validate → log → cache → return
        """
        config = AI_METHOD_CONFIG[method]

        # 1. Cache check
        if cache_args is not None and config.cache_ttl_seconds > 0:
            cache_key = make_cache_key(method, *cache_args)
            cached = get_cached(cache_key)
            if cached is not None:
                try:
                    return schema.model_validate(cached)
                except Exception:
                    pass  # stale cache, regenerate
        else:
            cache_key = None

        # 2. Load prompt and call Gemini
        system_prompt = load_prompt(config.prompt_file)
        prompt_version = config.prompt_file.split(".")[-2]  # e.g., "v1"

        try:
            result = get_gemini_client().generate(
                model=config.model,
                contents=contents,
                system_instruction=system_prompt,
                temperature=config.temperature,
                max_output_tokens=config.max_output_tokens,
                response_schema=schema,
                json_mode=True,
            )
        except AIServiceError:
            log_ai_call(
                user=user,
                method=method,
                channel=channel,
                prompt_version=prompt_version,
                model_name=config.model,
                temperature=config.temperature,
                prompt_tokens=0,
                output_tokens=0,
                cached_tokens=0,
                latency_ms=0,
                success=False,
                error_message="Gemini API call failed",
            )
            raise

        # 3. Parse and validate
        import json as _json
        try:
            parsed = schema.model_validate_json(result["text"])
        except Exception as e:
            # Fallback: try to parse as raw JSON dict (AI may use different field names)
            try:
                raw_data = _json.loads(result["text"])
                if isinstance(raw_data, dict):
                    # Wrap raw dict in a minimal Pydantic-like object
                    class _RawWrapper:
                        def __init__(self, data):
                            self.__dict__.update(data)
                        def model_dump(self):
                            return data
                    parsed = _RawWrapper(raw_data)
                    parsed.model_dump = lambda: raw_data
                    logger.warning("Pydantic validation failed for %s, using raw JSON fallback", method)
                else:
                    raise
            except Exception:
                log_ai_call(
                    user=user,
                    method=method,
                    channel=channel,
                    prompt_version=prompt_version,
                    model_name=config.model,
                    temperature=config.temperature,
                    prompt_tokens=result["usage"]["prompt_tokens"],
                    output_tokens=result["usage"]["output_tokens"],
                    cached_tokens=result["usage"]["cached_tokens"],
                    latency_ms=result["latency_ms"],
                    success=False,
                    error_message=f"Pydantic validation failed: {e}",
                )
                raise AIInvalidResponseError(f"Response validation failed: {e}") from e

        # 4. Log success
        log_ai_call(
            user=user,
            method=method,
            channel=channel,
            prompt_version=prompt_version,
            model_name=config.model,
            temperature=config.temperature,
            prompt_tokens=result["usage"]["prompt_tokens"],
            output_tokens=result["usage"]["output_tokens"],
            cached_tokens=result["usage"]["cached_tokens"],
            latency_ms=result["latency_ms"],
            success=True,
        )

        # 5. Cache result
        if cache_key is not None and config.cache_ttl_seconds > 0:
            set_cached(cache_key, parsed.model_dump(), config.cache_ttl_seconds)

        return parsed

    @staticmethod
    @observe(name="ai_call_text")
    def _call_text(
        method: str,
        contents: str,
        user: Any | None,
        channel: str,
    ) -> str:
        """
        Call Gemini without JSON mode, return plain text.
        """
        config = AI_METHOD_CONFIG[method]
        system_prompt = load_prompt(config.prompt_file)
        prompt_version = config.prompt_file.split(".")[-2]

        try:
            result = get_gemini_client().generate(
                model=config.model,
                contents=contents,
                system_instruction=system_prompt,
                temperature=config.temperature,
                max_output_tokens=config.max_output_tokens,
                json_mode=False,
            )
        except AIServiceError:
            log_ai_call(
                user=user,
                method=method,
                channel=channel,
                prompt_version=prompt_version,
                model_name=config.model,
                temperature=config.temperature,
                prompt_tokens=0,
                output_tokens=0,
                cached_tokens=0,
                latency_ms=0,
                success=False,
                error_message="Gemini API call failed",
            )
            raise

        log_ai_call(
            user=user,
            method=method,
            channel=channel,
            prompt_version=prompt_version,
            model_name=config.model,
            temperature=config.temperature,
            prompt_tokens=result["usage"]["prompt_tokens"],
            output_tokens=result["usage"]["output_tokens"],
            cached_tokens=result["usage"]["cached_tokens"],
            latency_ms=result["latency_ms"],
            success=True,
        )

        return result["text"].strip()

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    @staticmethod
    def parse_user_intent(
        text: str,
        user_context: dict,
        user=None,
        channel: str = "web",
    ) -> ParsedIntent:
        """Parse natural language into a structured intent."""
        contents = f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\nUSER_MESSAGE:\n{text}"
        return AIService._call_structured(
            method="parse_user_intent",
            contents=contents,
            schema=ParsedIntent,
            cache_args=(text, json.dumps(user_context, sort_keys=True)),
            user=user,
            channel=channel,
        )

    @staticmethod
    def generate_learning_plan(
        goal_text: str,
        user_context: dict,
        user=None,
        channel: str = "web",
    ) -> LearningPlan:
        """
        Generate a learning plan for preview.
        NOTE: Does NOT write to DB — returns Pydantic LearningPlan for user review.
        """
        contents = f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\nLEARNING_GOAL_INPUT:\n{goal_text}"
        return AIService._call_structured(
            method="generate_learning_plan",
            contents=contents,
            schema=LearningPlan,
            cache_args=(goal_text, json.dumps(user_context, sort_keys=True)),
            user=user,
            channel=channel,
        )

    @staticmethod
    def adapt_learning_plan(
        plan_snapshot: dict,
        progress_summary: dict,
        trigger: str,
        user_context: dict,
        user=None,
        channel: str = "web",
    ) -> PlanAdaptation:
        """Adapt an existing learning plan based on progress. Never cached."""
        contents = (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"TRIGGER:\n{trigger}\n\n"
            f"PLAN_SNAPSHOT_JSON:\n{json.dumps(plan_snapshot, ensure_ascii=False)}\n\n"
            f"PROGRESS_SUMMARY_JSON:\n{json.dumps(progress_summary, ensure_ascii=False)}"
        )
        return AIService._call_structured(
            method="adapt_learning_plan",
            contents=contents,
            schema=PlanAdaptation,
            cache_args=None,  # never cache
            user=user,
            channel=channel,
        )

    @staticmethod
    def answer_learning_question(
        question: str,
        context: dict,
        user=None,
        channel: str = "web",
    ) -> str:
        """Socratic tutor — returns plain text, NOT JSON. Includes conversation history."""
        # Build context JSON (without conversation_history to keep it clean)
        ctx_for_prompt = {
            k: v for k, v in context.items() if k != "conversation_history"
        }
        contents = f"LEARNING_CONTEXT_JSON:\n{json.dumps(ctx_for_prompt, ensure_ascii=False)}\n\n"

        # Add conversation history if present
        conversation_history = context.get("conversation_history", [])
        if conversation_history:
            recent = conversation_history[-7:]
            lines = []
            for msg in recent:
                label = "Student" if msg["role"] == "user" else "Tutor"
                lines.append(f"{label}: {msg['content']}")
            contents += f"CONVERSATION_HISTORY:\n" + "\n".join(lines) + "\n\n"

        contents += f"LEARNER_QUESTION:\n{question}"

        return AIService._call_text(
            method="answer_learning_question",
            contents=contents,
            user=user,
            channel=channel,
        )

    @staticmethod
    def generate_daily_tasks(
        plan_snapshot: dict,
        progress: dict,
        available_time_minutes: int,
        user_context: dict,
        user=None,
        channel: str = "web",
    ) -> DailyTasks:
        """Generate 1-3 learning tasks for today."""
        contents = (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"AVAILABLE_TIME_MINUTES:\n{available_time_minutes}\n\n"
            f"PLAN_SNAPSHOT_JSON:\n{json.dumps(plan_snapshot, ensure_ascii=False)}\n\n"
            f"PROGRESS_JSON:\n{json.dumps(progress, ensure_ascii=False)}"
        )
        return AIService._call_structured(
            method="generate_daily_tasks",
            contents=contents,
            schema=DailyTasks,
            cache_args=(
                json.dumps(plan_snapshot, sort_keys=True),
                json.dumps(progress, sort_keys=True),
                available_time_minutes,
            ),
            user=user,
            channel=channel,
        )

    @staticmethod
    def generate_insights(
        aggregates: dict,
        period_days: int,
        user_context: dict,
        user=None,
        channel: str = "web",
    ) -> Insights:
        """Generate 2-3 actionable insights from aggregated data."""
        contents = (
            f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\n"
            f"PERIOD_DAYS:\n{period_days}\n\n"
            f"AGGREGATES_JSON:\n{json.dumps(aggregates, ensure_ascii=False)}"
        )
        return AIService._call_structured(
            method="generate_insights",
            contents=contents,
            schema=Insights,
            cache_args=(json.dumps(aggregates, sort_keys=True), period_days),
            user=user,
            channel=channel,
        )

    @staticmethod
    def parse_receipt(
        ocr_text: str,
        user_context: dict,
        user=None,
        channel: str = "web",
    ) -> ReceiptData:
        """Parse OCR text from a receipt into structured data."""
        contents = f"USER_CONTEXT_JSON:\n{json.dumps(user_context, ensure_ascii=False)}\n\nRECEIPT_OCR_TEXT:\n{ocr_text}"
        return AIService._call_structured(
            method="parse_receipt",
            contents=contents,
            schema=ReceiptData,
            cache_args=(ocr_text,),
            user=user,
            channel=channel,
        )
