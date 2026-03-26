"""
Generator for Deadline Reminder notifications.

Works for both apps.tasks.models.Task and
apps.learning.models.LearningTask instances, determined at runtime
by checking for characteristic fields.
"""

from __future__ import annotations

import logging

logger = logging.getLogger("notifications")


def generate_deadline_reminder(
    task_or_goal, hours_left: float
) -> tuple[str, str, dict]:
    """Build a deadline reminder notification.

    Parameters
    ----------
    task_or_goal:
        Either a ``Task`` (apps.tasks) or a ``LearningTask``
        (apps.learning) instance.
    hours_left:
        Approximate hours remaining until the deadline.

    Returns
    -------
    (title, body, data)
    """
    # ------------------------------------------------- detect object type
    # Task has a `status` field with INBOX/IN_PROGRESS etc. and a `deadline`
    # DateTimeField.  LearningTask has `due_date` (DateField) and no `deadline`.
    is_learning_task = hasattr(task_or_goal, "due_date") and not hasattr(
        task_or_goal, "deadline"
    )

    obj_title: str = getattr(task_or_goal, "title", str(task_or_goal))

    if is_learning_task:
        obj_type = "learning_task"
        obj_id = str(task_or_goal.id)
        extra: dict = {"goal_id": str(task_or_goal.module.goal_id)}
    else:
        obj_type = "task"
        obj_id = str(task_or_goal.id)
        extra = {}

    # -------------------------------------------------- urgency formatting
    if hours_left <= 2:
        urgency_emoji = "🚨"
        time_label = f"{int(hours_left * 60)} minutes" if hours_left < 1 else f"{hours_left:.0f} hour{'s' if hours_left != 1 else ''}"
        title = f"{urgency_emoji} Due very soon: {obj_title}"
        body = (
            f"Only {time_label} left to complete \"{obj_title}\". "
            "Finish it now before it's too late!"
        )
    elif hours_left <= 24:
        urgency_emoji = "⏰"
        title = f"{urgency_emoji} Due today: {obj_title}"
        body = (
            f"\"{obj_title}\" is due in about {hours_left:.0f} hour{'s' if hours_left != 1 else ''}. "
            "Make sure to complete it today."
        )
    else:
        urgency_emoji = "📅"
        days_left = hours_left / 24
        title = f"{urgency_emoji} Upcoming deadline: {obj_title}"
        body = (
            f"\"{obj_title}\" is due in {days_left:.0f} day{'s' if days_left != 1 else ''}. "
            "Plan ahead to finish on time."
        )

    data: dict = {
        "type": "deadline_reminder",
        "obj_type": obj_type,
        "obj_id": obj_id,
        "hours_left": round(hours_left, 1),
        **extra,
    }

    return title, body, data
