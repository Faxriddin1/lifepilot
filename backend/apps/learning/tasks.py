"""
Celery tasks for Learning module.
- generate_learning_plan_task: async plan generation + resource resolve
- check_streaks_daily: daily streak check (00:05 UTC)
- detect_stuck_users: find users stuck >3 days (06:00 UTC)
- weekly_learning_review: weekly AI review (Sunday 20:00 UTC)
- run_ai_adaptation: execute AI adaptation for a goal
"""

import logging
from datetime import timedelta

from celery import shared_task
from django.db.models import Avg
from django.utils import timezone

logger = logging.getLogger("learning")


# ------------------------------------------------------------------
# Plan generation (Этап 3)
# ------------------------------------------------------------------

@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def generate_learning_plan_task(self, goal_id: str, user_id: str):
    """Async plan generation: AI → resolve resources → save."""
    from django.contrib.auth import get_user_model

    from apps.ai_core.services import AIService
    from apps.learning.models import LearningGoal
    from apps.learning.resource_resolver import resolve_resource

    User = get_user_model()

    try:
        goal = LearningGoal.objects.get(id=goal_id)
        user = User.objects.get(id=user_id)
    except (LearningGoal.DoesNotExist, User.DoesNotExist) as e:
        logger.error("Goal or User not found: %s", e)
        return

    if goal.status != "generating":
        logger.warning("Goal %s status='%s', expected 'generating'. Skipping.", goal_id, goal.status)
        return

    try:
        user_context = {
            "locale": getattr(user, "locale", "en") or "en",
            "timezone": getattr(user, "timezone", "UTC") or "UTC",
            "now": timezone.now().isoformat(),
            "currency": getattr(user, "currency", "USD") or "USD",
            "minutes_per_day": goal.minutes_per_day,
            "days_per_week": goal.days_per_week,
            "level": goal.difficulty_level,
            "target_date": goal.target_date.isoformat() if goal.target_date else "",
        }

        goal_text = goal.title
        if goal.description:
            goal_text += f"\n{goal.description}"

        logger.info("Generating plan for goal '%s' (id=%s)", goal.title, goal_id)
        plan = AIService.generate_learning_plan(
            goal_text=goal_text, user_context=user_context, user=user, channel="celery",
        )
        plan_data = plan.model_dump()

        locale = getattr(user, "locale", "en") or "en"
        for module in plan_data.get("modules", []):
            for task in module.get("tasks", []):
                query = task.get("resource_query", "")
                if query:
                    resolved = resolve_resource(query, task.get("type", "video"), locale)
                    task["resolved_url"] = resolved["url"]
                    task["resolved_title"] = resolved["title"]
                    task["resolved_source"] = resolved["source"]
                    task["resolved_thumbnail"] = resolved.get("thumbnail")

        goal.ai_generated_plan = plan_data
        goal.status = "preview"
        goal.save(update_fields=["ai_generated_plan", "status", "updated_at"])
        logger.info("Plan generated for goal '%s' (id=%s)", goal.title, goal_id)

        # Notify user that plan is ready
        from apps.notifications.tasks import send_plan_ready_notification
        send_plan_ready_notification.delay(str(goal.id))

    except Exception as e:
        logger.error("Plan generation failed for goal %s: %s", goal_id, e, exc_info=True)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
        goal.status = "draft"
        goal.save(update_fields=["status", "updated_at"])
        logger.error("All retries exhausted for goal %s. Reset to draft.", goal_id)


# ------------------------------------------------------------------
# Daily streak check (Celery Beat — 00:05 UTC)
# ------------------------------------------------------------------

@shared_task
def check_streaks_daily():
    """
    Check all active goals: if no activity yesterday and streak > 0,
    use a freeze or reset streak.
    """
    from apps.learning.models import LearningGoal

    yesterday = (timezone.now() - timedelta(days=1)).date()
    two_days_ago = yesterday - timedelta(days=1)

    goals_at_risk = LearningGoal.objects.filter(
        status="active",
        current_streak__gt=0,
    ).exclude(
        last_activity_date__gte=yesterday,  # Activity yesterday or today → OK
    )

    reset_count = 0
    freeze_count = 0

    for goal in goals_at_risk:
        if goal.last_activity_date == two_days_ago and goal.streak_freezes > 0:
            # Missed exactly 1 day, has freeze
            goal.streak_freezes -= 1
            goal.save(update_fields=["streak_freezes", "updated_at"])
            freeze_count += 1
        else:
            # Missed >1 day or no freeze
            goal.current_streak = 0
            goal.save(update_fields=["current_streak", "updated_at"])
            reset_count += 1

    if reset_count or freeze_count:
        logger.info("Streak check: %d reset, %d frozen", reset_count, freeze_count)


# ------------------------------------------------------------------
# Detect stuck users (Celery Beat — 06:00 UTC)
# ------------------------------------------------------------------

@shared_task
def detect_stuck_users():
    """Find tasks overdue >3 days → trigger AI adaptation."""
    from apps.learning.models import LearningTask

    three_days_ago = (timezone.now() - timedelta(days=3)).date()

    stuck_tasks = LearningTask.objects.filter(
        module__goal__status="active",
        status__in=["todo", "in_progress"],
        due_date__lte=three_days_ago,
    ).select_related("module__goal")

    goals_stuck = {}
    for task in stuck_tasks:
        goal = task.module.goal
        if goal.id not in goals_stuck:
            goals_stuck[goal.id] = {"goal": goal, "stuck_tasks": []}
        goals_stuck[goal.id]["stuck_tasks"].append({
            "task_id": str(task.id),
            "title": task.title,
            "due_date": str(task.due_date),
            "days_overdue": (timezone.now().date() - task.due_date).days,
        })

    for goal_data in goals_stuck.values():
        run_ai_adaptation.delay(
            str(goal_data["goal"].id),
            "user_stuck",
            {"stuck_tasks": goal_data["stuck_tasks"]},
        )

    if goals_stuck:
        logger.info("Detected %d goals with stuck users", len(goals_stuck))


# ------------------------------------------------------------------
# Weekly AI review (Celery Beat — Sunday 20:00 UTC)
# ------------------------------------------------------------------

@shared_task
def weekly_learning_review():
    """Weekly AI review of all active goals."""
    from apps.learning.models import LearningGoal, LearningProgress, LearningTask

    week_ago = timezone.now().date() - timedelta(days=7)
    active_goals = LearningGoal.objects.filter(status="active")

    for goal in active_goals:
        weekly_progress = LearningProgress.objects.filter(goal=goal, date__gte=week_ago)

        tasks_planned = LearningTask.objects.filter(
            module__goal=goal, due_date__gte=week_ago, due_date__lte=timezone.now().date(),
        ).count()
        tasks_completed = LearningTask.objects.filter(
            module__goal=goal, status="completed", completed_at__date__gte=week_ago,
        ).count()
        tasks_skipped = LearningTask.objects.filter(
            module__goal=goal, status="skipped", due_date__gte=week_ago, due_date__lte=timezone.now().date(),
        ).count()
        avg_rating = LearningTask.objects.filter(
            module__goal=goal, user_rating__isnull=False, completed_at__date__gte=week_ago,
        ).aggregate(avg=Avg("user_rating"))["avg"]

        total_minutes = sum(p.minutes_spent for p in weekly_progress)

        progress_summary = {
            "period": "weekly",
            "tasks_planned": tasks_planned,
            "tasks_completed": tasks_completed,
            "tasks_skipped": tasks_skipped,
            "minutes_spent": total_minutes,
            "active_days": weekly_progress.count(),
            "avg_rating": round(avg_rating, 1) if avg_rating else None,
            "current_streak": goal.current_streak,
            "completion_rate": round(tasks_completed / max(tasks_planned, 1) * 100, 1),
        }

        run_ai_adaptation.delay(str(goal.id), "weekly_review", progress_summary)

        # Send weekly review notification
        from apps.notifications.tasks import send_weekly_review_notification
        send_weekly_review_notification.delay(str(goal.id))

    if active_goals.exists():
        logger.info("Weekly review queued for %d active goals", active_goals.count())


# ------------------------------------------------------------------
# AI Adaptation (triggered by various sources)
# ------------------------------------------------------------------

@shared_task(bind=True, max_retries=1, default_retry_delay=60)
def run_ai_adaptation(self, goal_id: str, trigger: str, extra_context: dict = None):
    """
    Call AIService.adapt_learning_plan() and apply changes to DB.
    """
    from apps.ai_core.services import AIService
    from apps.learning.models import AdaptationLog, LearningGoal
    from apps.learning.services import LearningService

    try:
        goal = LearningGoal.objects.get(id=goal_id)
    except LearningGoal.DoesNotExist:
        return

    if goal.status != "active":
        return

    user = goal.user

    plan_snapshot = LearningService.build_plan_snapshot(goal)
    progress_summary = LearningService.build_progress_summary(goal)
    if extra_context:
        progress_summary.update(extra_context)

    user_context = {
        "locale": getattr(user, "locale", "en") or "en",
        "timezone": getattr(user, "timezone", "UTC") or "UTC",
        "now": timezone.now().isoformat(),
    }

    try:
        adaptation = AIService.adapt_learning_plan(
            plan_snapshot=plan_snapshot,
            progress_summary=progress_summary,
            trigger=trigger,
            user_context=user_context,
            user=user,
            channel="celery",
        )

        LearningService.apply_adaptation_changes(goal, adaptation)

        AdaptationLog.objects.create(
            goal=goal,
            trigger=trigger,
            changes_json=adaptation.model_dump(),
            reason=adaptation.summary,
        )

        logger.info("AI adaptation applied for goal %s (trigger=%s)", goal_id, trigger)

    except Exception as e:
        logger.error("AI adaptation failed for goal %s: %s", goal_id, e, exc_info=True)
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e)
