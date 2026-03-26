"""
Generator for the Weekly Review notification.

Summarises the past 7 days of learning activity for a goal and
optionally includes a description of AI-driven plan adaptations.
"""

from __future__ import annotations

import logging
from datetime import timedelta

logger = logging.getLogger("notifications")


def generate_weekly_review(
    goal, adaptation_summary: str | None = None
) -> tuple[str, str, dict]:
    """Build a weekly-review notification for *goal*.

    Always returns (title, body, data) — never None, because a weekly
    review is always meaningful to send regardless of activity level.
    """
    from django.utils import timezone

    from apps.learning.models import LearningProgress, LearningTask

    week_ago = timezone.now().date() - timedelta(days=7)
    today = timezone.now().date()

    # ------------------------------------------------- aggregate last 7 days
    progress_qs = LearningProgress.objects.filter(
        goal=goal,
        date__gte=week_ago,
        date__lte=today,
    )

    tasks_completed = LearningTask.objects.filter(
        module__goal=goal,
        status="completed",
        completed_at__date__gte=week_ago,
    ).count()

    minutes_spent = sum(p.minutes_spent for p in progress_qs)
    active_days = progress_qs.count()
    current_streak = goal.current_streak

    # ------------------------------------------------------------ build body
    hours = minutes_spent // 60
    mins = minutes_spent % 60
    time_str = (
        f"{hours}h {mins}m" if hours else f"{mins}m"
    ) if minutes_spent else "0m"

    lines: list[str] = [
        f"📊 Weekly summary for \"{goal.title}\":",
        f"  ✅ Tasks completed: {tasks_completed}",
        f"  ⏱️ Time spent: {time_str}",
        f"  📅 Active days: {active_days}/7",
        f"  🔥 Current streak: {current_streak} day{'s' if current_streak != 1 else ''}",
    ]

    if adaptation_summary:
        lines.append("")
        lines.append("🤖 AI plan update:")
        lines.append(f"  {adaptation_summary}")

    body = "\n".join(lines)

    data: dict = {
        "type": "weekly_review",
        "goal_id": str(goal.id),
        "tasks_completed": tasks_completed,
        "minutes_spent": minutes_spent,
        "active_days": active_days,
        "current_streak": current_streak,
        "has_adaptation": bool(adaptation_summary),
    }

    return f"Your weekly learning review is ready 📈", body, data
