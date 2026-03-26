"""
Generator for Plan Ready notifications.

Sent after an AI learning plan has been generated for a LearningGoal.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("notifications")


def generate_plan_ready(goal) -> tuple[str, str, dict]:
    """Build a "plan ready" notification for *goal*.

    Counts the number of modules contained in the AI-generated plan JSON
    so the user knows how much content awaits them.

    Returns (title, body, data).
    """
    plan = goal.ai_generated_plan or {}
    modules = plan.get("modules", [])
    module_count = len(modules)

    if module_count:
        module_text = (
            f"Your plan has {module_count} module{'s' if module_count != 1 else ''} "
            "ready to explore."
        )
    else:
        module_text = "Your personalised plan is ready to explore."

    title = f"🎉 Your learning plan is ready: {goal.title}"
    body = (
        f"We've built a personalised learning plan for \"{goal.title}\". "
        f"{module_text} Open the app to review it and start learning!"
    )

    data: dict = {
        "type": "plan_ready",
        "goal_id": str(goal.id),
        "module_count": module_count,
    }

    return title, body, data
