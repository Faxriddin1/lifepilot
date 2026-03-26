"""
Generator for Streak Risk notifications.

Warns users who are about to lose their learning streak before the
end of the day when they have not yet logged any activity.
"""

from __future__ import annotations

import logging
from datetime import date

logger = logging.getLogger("notifications")


def generate_streak_risk(goal) -> tuple[str, str, dict] | None:
    """Build a streak-risk notification for *goal*.

    Returns (title, body, data) or None when no alert is needed.
    """
    today = date.today()

    # Already active today — no need to warn
    if goal.last_activity_date == today:
        return None

    # No streak to protect
    if goal.current_streak == 0:
        return None

    streak = goal.current_streak
    freezes = goal.streak_freezes

    streak_label = f"{streak} day{'s' if streak != 1 else ''}"

    if freezes > 0:
        # Gentle reminder — a freeze is available as a safety net
        title = "Don't forget your learning today! 📚"
        body = (
            f"Your streak for \"{goal.title}\" is at {streak_label}. "
            f"You still have {freezes} streak freeze{'s' if freezes != 1 else ''} available, "
            "but completing a task today keeps the momentum going!"
        )
    else:
        # Urgent — streak will be lost if nothing is done
        title = "⚠️ Your streak is at risk!"
        body = (
            f"You have a {streak_label} streak for \"{goal.title}\" "
            "and NO freezes left. Complete at least one task today to keep it alive!"
        )

    data: dict = {
        "type": "streak_risk",
        "goal_id": str(goal.id),
        "current_streak": streak,
        "streak_freezes": freezes,
    }

    return title, body, data
