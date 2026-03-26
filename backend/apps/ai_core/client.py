"""
GeminiClient — singleton wrapper for Google Gemini API.
Uses google-genai SDK: `from google import genai` and `from google.genai import types`.
"""

import logging
import os
import time
import threading

from google import genai
from google.genai import types

from .exceptions import (
    AIRateLimitError,
    AITimeoutError,
    AIUnavailableError,
    AIServiceError,
)

logger = logging.getLogger("ai_core")


def _clean_schema_for_gemini(schema_class):
    """
    Convert a Pydantic model class to a JSON Schema dict and strip
    'additionalProperties' which Gemini API doesn't support.
    """
    if hasattr(schema_class, 'model_json_schema'):
        schema = schema_class.model_json_schema()
        _strip_additional_properties(schema)
        return schema
    return schema_class


def _strip_additional_properties(obj):
    """Recursively remove 'additionalProperties' from a JSON Schema dict."""
    if isinstance(obj, dict):
        obj.pop('additionalProperties', None)
        obj.pop('$defs', None)
        # Resolve $ref by inlining (Gemini doesn't support $ref either)
        for key, value in list(obj.items()):
            if isinstance(value, dict):
                _strip_additional_properties(value)
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, dict):
                        _strip_additional_properties(item)

_client_lock = threading.Lock()
_client_instance = None


def get_gemini_client() -> "GeminiClient":
    """Get or create the singleton GeminiClient."""
    global _client_instance
    if _client_instance is None:
        with _client_lock:
            if _client_instance is None:
                _client_instance = GeminiClient()
    return _client_instance


class GeminiClient:
    """Singleton wrapper around google-genai SDK."""

    def __init__(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise AIServiceError("GEMINI_API_KEY environment variable is not set")
        self._client = genai.Client(api_key=api_key)

    def generate(
        self,
        *,
        model: str,
        contents: str,
        system_instruction: str,
        temperature: float,
        max_output_tokens: int,
        response_schema: type | None = None,
        json_mode: bool = False,
    ) -> dict:
        """
        Call Gemini API with retry on 429/500/503.

        Returns: {"text": str, "usage": {"prompt_tokens": int, "output_tokens": int, "cached_tokens": int}, "latency_ms": int}
        """
        config_kwargs = {
            "temperature": temperature,
            "max_output_tokens": max_output_tokens,
        }

        if json_mode:
            config_kwargs["response_mime_type"] = "application/json"
            # NOTE: response_schema is NOT passed to Gemini because Pydantic v2
            # generates JSON Schema with $defs/$ref/additionalProperties which
            # Gemini API doesn't support. Instead, we rely on the system prompt
            # to produce valid JSON and validate with Pydantic after receiving.
            # The response_schema parameter is kept in the signature for future use.

        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            **config_kwargs,
        )

        last_error = None
        for attempt in range(3):  # initial + 2 retries
            start = time.monotonic()
            try:
                response = self._client.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config,
                )
                latency_ms = int((time.monotonic() - start) * 1000)

                usage = getattr(response, "usage_metadata", None)
                prompt_tokens = getattr(usage, "prompt_token_count", 0) or 0
                output_tokens = getattr(usage, "candidates_token_count", 0) or 0
                cached_tokens = getattr(usage, "cached_content_token_count", 0) or 0

                text = response.text or ""

                return {
                    "text": text,
                    "usage": {
                        "prompt_tokens": prompt_tokens,
                        "output_tokens": output_tokens,
                        "cached_tokens": cached_tokens,
                    },
                    "latency_ms": latency_ms,
                }
            except Exception as e:
                latency_ms = int((time.monotonic() - start) * 1000)
                last_error = e
                error_str = str(e).lower()

                # Classify error
                if "429" in error_str or "rate" in error_str:
                    if attempt < 2:
                        wait = (2 ** attempt) * 1  # 1s, 2s
                        logger.warning("Gemini 429, retry in %ds (attempt %d)", wait, attempt + 1)
                        time.sleep(wait)
                        continue
                    raise AIRateLimitError(f"Rate limit exceeded after {attempt + 1} attempts") from e
                elif "500" in error_str or "503" in error_str or "unavailable" in error_str:
                    if attempt < 2:
                        wait = (2 ** attempt) * 1
                        logger.warning("Gemini 5xx, retry in %ds (attempt %d)", wait, attempt + 1)
                        time.sleep(wait)
                        continue
                    raise AIUnavailableError(f"Service unavailable after {attempt + 1} attempts") from e
                elif "timeout" in error_str:
                    raise AITimeoutError(f"Request timed out: {e}") from e
                else:
                    raise AIServiceError(f"Gemini API error: {e}") from e

        raise AIServiceError(f"All retries exhausted: {last_error}")
