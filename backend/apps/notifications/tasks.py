"""
Celery tasks for the Notifications module.

Scheduled tasks
---------------
- send_morning_digests      every 30 min  → delivers at 08:00 user-local time
- send_streak_risk_alerts   every 30 min  → delivers at 20:00 user-local time
- send_deadline_reminders   daily 07:00 UTC → finds tasks due tomorrow

On-demand tasks
---------------
- send_plan_ready_notification(goal_id)
- send_weekly_review_notification(goal_id, adaptation_summary=None)
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone as dt_timezone

import pytz
from celery import shared_task
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.notifications.services import NotificationService

logger = logging.getLogger("notifications")

User = get_user_model()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _local_hour(user) -> int:
    """Return the current hour (0-23) in the user's timezone."""
    tz_name = getattr(user, "timezone", "UTC") or "UTC"
    try:
        tz = pytz.timezone(tz_name)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    now_local = datetime.now(tz=dt_timezone.utc).astimezone(tz)
    return now_local.hour


def _today_in_tz(user) -> date:
    """Return today's date in the user's local timezone."""
    tz_name = getattr(user, "timezone", "UTC") or "UTC"
    try:
        tz = pytz.timezone(tz_name)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    return datetime.now(tz=dt_timezone.utc).astimezone(tz).date()


# ---------------------------------------------------------------------------
# Scheduled: Morning Digest
# ---------------------------------------------------------------------------

@shared_task
def send_morning_digests() -> None:
    """Send morning digests to users for whom it is currently 08:00 local time.

    The task runs every 30 minutes via Celery Beat.  We accept users whose
    local hour is exactly 8 (i.e. between 08:00 and 08:29 local).
    """
    from apps.notifications.generators.morning_digest import generate_morning_digest

    users = User.objects.filter(is_active=True).only(
        "id", "timezone", "notification_preferences"
    )

    sent = 0
    for user in users:
        try:
            if _local_hour(user) != 8:
                continue

            # Check if already sent today
            from apps.notifications.models import Notification
            already_sent = Notification.objects.filter(
                user=user,
                type="morning_digest",
                created_at__date=timezone.now().date(),
            ).exists()
            if already_sent:
                continue

            result = generate_morning_digest(user)
            if result is None:
                continue

            title, body, data = result
            NotificationService.send(
                user=user,
                notification_type="morning_digest",
                title=title,
                body=body,
                data=data,
            )
            sent += 1
        except Exception as exc:
            logger.error("Morning digest failed for user %s: %s", user.id, exc)

    if sent:
        logger.info("Morning digests sent to %d user(s).", sent)


# ---------------------------------------------------------------------------
# Scheduled: Streak Risk Alerts
# ---------------------------------------------------------------------------

@shared_task
def send_streak_risk_alerts() -> None:
    """Send streak-risk warnings to users at 20:00 local time.

    Targets users who have active learning goals with streak > 0 and
    have not logged any activity today.  Runs every 30 minutes via Beat.
    """
    from apps.learning.models import LearningGoal
    from apps.notifications.generators.streak_risk import generate_streak_risk

    today_utc = timezone.now().date()

    # Pre-filter: goals that are active and have a non-zero streak
    at_risk_goals = (
        LearningGoal.objects.filter(
            status="active",
            current_streak__gt=0,
        )
        .exclude(last_activity_date=today_utc)
        .select_related("user")
    )

    sent = 0
    for goal in at_risk_goals:
        user = goal.user
        try:
            if not user.is_active:
                continue
            if _local_hour(user) != 20:
                continue

            # Double-check using user's local date in case of timezone edge cases
            today_local = _today_in_tz(user)
            if goal.last_activity_date == today_local:
                continue

            # Check if already sent today for this goal
            from apps.notifications.models import Notification
            already_sent = Notification.objects.filter(
                user=user,
                type="streak_risk",
                created_at__date=timezone.now().date(),
            ).exists()
            if already_sent:
                continue

            result = generate_streak_risk(goal)
            if result is None:
                continue

            title, body, data = result
            NotificationService.send(
                user=user,
                notification_type="streak_risk",
                title=title,
                body=body,
                data=data,
            )
            sent += 1
        except Exception as exc:
            logger.error(
                "Streak risk alert failed for goal %s / user %s: %s",
                goal.id, user.id, exc,
            )

    if sent:
        logger.info("Streak risk alerts sent to %d goal(s).", sent)


# ---------------------------------------------------------------------------
# Scheduled: Deadline Reminders
# ---------------------------------------------------------------------------

@shared_task
def send_deadline_reminders() -> None:
    """Find tasks/learning-tasks due tomorrow and send deadline reminders.

    Runs once a day at 07:00 UTC via Celery Beat.
    """
    from apps.learning.models import LearningTask
    from apps.notifications.generators.deadline import generate_deadline_reminder
    from apps.tasks.models import Task

    now = timezone.now()
    tomorrow = (now + timedelta(days=1)).date()
    sent = 0

    # -------------------------------------------------- regular Tasks
    tasks_due = Task.objects.filter(
        deadline__date=tomorrow,
        status__in=[Task.Status.INBOX, Task.Status.IN_PROGRESS],
    ).select_related("user")

    for task in tasks_due:
        try:
            deadline_dt = task.deadline
            hours_left = (deadline_dt - now).total_seconds() / 3600
            title, body, data = generate_deadline_reminder(task, hours_left)
            NotificationService.send(
                user=task.user,
                notification_type="deadline_reminder",
                title=title,
                body=body,
                data=data,
            )
            sent += 1
        except Exception as exc:
            logger.error("Deadline reminder failed for task %s: %s", task.id, exc)

    # -------------------------------------------- LearningTask (due_date)
    learning_tasks_due = LearningTask.objects.filter(
        due_date=tomorrow,
        status__in=["todo", "in_progress"],
    ).select_related("module__goal__user")

    for ltask in learning_tasks_due:
        try:
            user = ltask.module.goal.user
            # due_date is a DateField — treat deadline as end-of-day tomorrow
            deadline_dt = datetime(
                tomorrow.year, tomorrow.month, tomorrow.day,
                23, 59, 59,
                tzinfo=dt_timezone.utc,
            )
            hours_left = (deadline_dt - now).total_seconds() / 3600
            title, body, data = generate_deadline_reminder(ltask, hours_left)
            NotificationService.send(
                user=user,
                notification_type="deadline_reminder",
                title=title,
                body=body,
                data=data,
            )
            sent += 1
        except Exception as exc:
            logger.error(
                "Deadline reminder failed for learning task %s: %s", ltask.id, exc
            )

    if sent:
        logger.info("Deadline reminders sent for %d item(s).", sent)


# ---------------------------------------------------------------------------
# On-demand: Plan Ready
# ---------------------------------------------------------------------------

@shared_task
def send_plan_ready_notification(goal_id: str) -> None:
    """Send a "plan ready" notification after AI plan generation completes.

    Called from learning tasks once `ai_generated_plan` has been saved.
    """
    from apps.learning.models import LearningGoal
    from apps.notifications.generators.plan_ready import generate_plan_ready

    try:
        goal = LearningGoal.objects.select_related("user").get(id=goal_id)
    except LearningGoal.DoesNotExist:
        logger.warning("send_plan_ready_notification: goal %s not found.", goal_id)
        return

    try:
        title, body, data = generate_plan_ready(goal)
        NotificationService.send(
            user=goal.user,
            notification_type="plan_ready",
            title=title,
            body=body,
            data=data,
        )
        logger.info("Plan-ready notification sent for goal %s.", goal_id)
    except Exception as exc:
        logger.error(
            "send_plan_ready_notification failed for goal %s: %s", goal_id, exc
        )


# ---------------------------------------------------------------------------
# On-demand: Weekly Review
# ---------------------------------------------------------------------------

@shared_task
def send_weekly_review_notification(
    goal_id: str, adaptation_summary: str | None = None
) -> None:
    """Send a weekly review notification for a learning goal.

    Parameters
    ----------
    goal_id:
        UUID string of the LearningGoal.
    adaptation_summary:
        Optional plain-text summary of AI-driven plan changes to include
        in the notification body.
    """
    from apps.learning.models import LearningGoal
    from apps.notifications.generators.weekly_review import generate_weekly_review

    try:
        goal = LearningGoal.objects.select_related("user").get(id=goal_id)
    except LearningGoal.DoesNotExist:
        logger.warning("send_weekly_review_notification: goal %s not found.", goal_id)
        return

    try:
        title, body, data = generate_weekly_review(goal, adaptation_summary)
        NotificationService.send(
            user=goal.user,
            notification_type="weekly_review",
            title=title,
            body=body,
            data=data,
        )
        logger.info("Weekly review notification sent for goal %s.", goal_id)
    except Exception as exc:
        logger.error(
            "send_weekly_review_notification failed for goal %s: %s", goal_id, exc
        )
