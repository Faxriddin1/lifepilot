"""
Custom exceptions for AI Core service.
"""


class AIServiceError(Exception):
    """Base exception for all AI service errors."""
    pass


class AIRateLimitError(AIServiceError):
    """Raised when Gemini API returns 429 (rate limit exceeded)."""
    pass


class AITimeoutError(AIServiceError):
    """Raised when Gemini API request times out."""
    pass


class AIInvalidResponseError(AIServiceError):
    """Raised when AI response fails Pydantic validation."""
    pass


class AIUnavailableError(AIServiceError):
    """Raised when Gemini API returns 500/503 (service unavailable)."""
    pass
