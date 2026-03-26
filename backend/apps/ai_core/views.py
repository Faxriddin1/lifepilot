"""
AI Core views — user-facing endpoints for AI feedback.
"""

from __future__ import annotations

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import AICallLog
from .services import LANGFUSE_ENABLED, langfuse_client


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_ai_feedback(request):
    """
    Record user feedback for an AI call.

    Request body (JSON):
        trace_id  (str)   — AICallLog UUID to attach the rating to
        score     (float) — quality score, 0.0–1.0  (default 0.5)
        comment   (str)   — optional free-text comment

    Response:
        {"status": "feedback_recorded"}
    """
    trace_id = request.data.get("trace_id")
    score = float(request.data.get("score", 0.5))
    comment = request.data.get("comment", "")

    # Persist rating in AICallLog
    if trace_id:
        # Convert 0.0–1.0 score to 1–5 integer rating
        rating = max(1, min(5, round(score * 5)))
        AICallLog.objects.filter(id=trace_id, user=request.user).update(
            user_rating=rating
        )

        # Forward to Langfuse if enabled
        if LANGFUSE_ENABLED and langfuse_client is not None:
            try:
                langfuse_client.score(
                    trace_id=str(trace_id),
                    name="user_feedback",
                    value=score,
                    comment=comment or None,
                )
            except Exception:
                # Non-critical — do not surface Langfuse errors to the user
                pass

    return Response({"status": "feedback_recorded"})
