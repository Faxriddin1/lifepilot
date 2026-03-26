"""
Generator for the Morning Digest notification.

Collects today's tasks, overdue tasks, active learning goal status,
and active habits count to build a personalised morning summary.
"""

from __future__ import annotations

import logging
from datetime import date

logger = logging.getLogger("notifications")


def generate_morning_digest(user) -> tuple[str, str, dict] | None:
    """Build a morning digest notification for *user*.

    Returns (title, body, data) or None when there is nothing to show.
    """
    from apps.learning.models import LearningGoal, LearningTask
    from apps.productivity.models import Habit
    from apps.tasks.models import Task

    today = date.today()

    # ------------------------------------------------------------------ tasks
    active_statuses = [Task.Status.INBOX, Task.Status.IN_PROGRESS]

    tasks_today = list(
        Task.objects.filter(
            user=user,
            status__in=active_statuses,
            deadline__date=today,
        ).values("id", "title", "priority")
    )

    tasks_overdue = list(
        Task.objects.filter(
            user=user,
            status__in=active_statuses,
            deadline__date__lt=today,
        ).values("id", "title", "priority")
    )

    # --------------------------------------------------------- learning goal
    active_goal = (
        LearningGoal.objects.filter(user=user, status="active")
        .order_by("-created_at")
        .first()
    )

    learning_today_count = 0
    current_streak = 0
    goal_title = ""

    if active_goal:
        goal_title = active_goal.title
        current_streak = active_goal.current_streak
        learning_today_count = LearningTask.objects.filter(
            module__goal=active_goal,
            status__in=["todo", "in_progress"],
            due_date=today,
        ).count()

    # --------------------------------------------------------------- habits
    active_habits_count = Habit.objects.filter(user=user, is_active=True).count()

    # ----------------------------------------- decide whether to send at all
    has_content = bool(
        tasks_today
        or tasks_overdue
        or learning_today_count
        or active_habits_count
    )
    if not has_content:
        return None

    # -------------------------------------------------------------- build body
    lines: list[str] = []

    if tasks_today:
        lines.append(f"📋 Tasks due today: {len(tasks_today)}")
        for t in tasks_today[:3]:
            lines.append(f"  • {t['title']}")
        if len(tasks_today) > 3:
            lines.append(f"  … and {len(tasks_today) - 3} more")

    if tasks_overdue:
        lines.append(f"⚠️ Overdue tasks: {len(tasks_overdue)}")

    if active_goal and learning_today_count:
        streak_text = f" (🔥 streak: {current_streak} day{'s' if current_streak != 1 else ''})" if current_streak else ""
        lines.append(f"📚 Learning — {goal_title}: {learning_today_count} task{'s' if learning_today_count != 1 else ''} today{streak_text}")

    if active_habits_count:
        lines.append(f"✅ Active habits: {active_habits_count}")

    body = "\n".join(lines)

    data: dict = {
        "type": "morning_digest",
        "tasks_today": len(tasks_today),
        "tasks_overdue": len(tasks_overdue),
        "active_habits": active_habits_count,
        "learning_today": learning_today_count,
        "learning_streak": current_streak,
    }
    if active_goal:
        data["goal_id"] = str(active_goal.id)

    return "Good morning! Here's your plan for today", body, data
