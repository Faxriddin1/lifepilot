"""
Business logic for Learning module.
Includes: plan creation, task completion, streak system, AI adaptation helpers.
"""

import logging
from datetime import date, timedelta

from django.db import models
from django.db.models import Avg
from django.utils import timezone

from .models import (
    AdaptationLog,
    GoalStatus,
    LearningGoal,
    LearningModule,
    LearningProgress,
    LearningTask,
    ModuleStatus,
    TaskStatus,
)

logger = logging.getLogger("learning")


class LearningService:

    # ------------------------------------------------------------------
    # Plan creation
    # ------------------------------------------------------------------

    @staticmethod
    def create_modules_from_plan(goal: LearningGoal, plan_data: dict):
        """
        Create LearningModule and LearningTask records from AI-generated JSON.
        Called ONLY after user confirmation.
        """
        goal.modules.all().delete()

        modules_data = plan_data.get("modules", [])
        for m_idx, m_data in enumerate(modules_data, start=1):
            # AI may return order as: order, module_index, module_number, module_id
            order = (
                m_data.get("order")
                or m_data.get("module_index")
                or m_data.get("module_number")
                or m_data.get("module_id")
                or m_idx
            )
            # Ensure order is int
            if isinstance(order, str):
                try:
                    order = int(order)
                except ValueError:
                    order = m_idx

            module = LearningModule.objects.create(
                goal=goal,
                title=m_data.get("title", f"Module {order}"),
                description=m_data.get("description", ""),
                order=order,
                deadline=m_data.get("deadline"),
                status=ModuleStatus.AVAILABLE if order == 1 else ModuleStatus.LOCKED,
            )

            tasks_data = m_data.get("tasks", [])
            for idx, t_data in enumerate(tasks_data, start=1):
                task_type = t_data.get("type", "article")
                valid_types = {c[0] for c in LearningTask.task_type.field.choices}
                if task_type not in valid_types:
                    task_type = "article"

                # AI may return resource as: resource_query, search_queries, search_query
                resource_query = (
                    t_data.get("resource_query", "")
                    or t_data.get("search_query", "")
                )
                # search_queries may be a list
                sq = t_data.get("search_queries")
                if sq and isinstance(sq, list) and not resource_query:
                    resource_query = sq[0] if sq else ""
                elif sq and isinstance(sq, str) and not resource_query:
                    resource_query = sq

                # AI may return minutes as: estimated_minutes, duration_minutes, minutes
                estimated_minutes = (
                    t_data.get("estimated_minutes")
                    or t_data.get("duration_minutes")
                    or t_data.get("minutes")
                    or 30
                )

                LearningTask.objects.create(
                    module=module,
                    title=t_data.get("title", f"Task {idx}"),
                    description=t_data.get("description", t_data.get("deliverable", "")),
                    task_type=task_type,
                    resource_query=resource_query,
                    resource_url=t_data.get("resolved_url", ""),
                    estimated_minutes=int(estimated_minutes),
                    order=idx,
                    due_date=t_data.get("due_date"),
                )

    # ------------------------------------------------------------------
    # Task completion
    # ------------------------------------------------------------------

    @staticmethod
    def on_task_completed(task: LearningTask):
        """
        Called when user marks a task as completed.
        1. Update module progress
        2. Unlock next module if needed
        3. Check goal completion
        4. Update streak
        5. Update daily progress
        6. Check ahead_of_schedule trigger
        """
        module = task.module
        goal = module.goal

        # 1. Module progress
        total = module.tasks.count()
        done = module.tasks.filter(
            status__in=[TaskStatus.COMPLETED, TaskStatus.SKIPPED]
        ).count()

        module_just_completed = False

        if done >= total:
            module.status = ModuleStatus.COMPLETED
            module.save(update_fields=["status"])
            module_just_completed = True

            # 2. Unlock next module
            next_module = (
                LearningModule.objects.filter(
                    goal=goal, order=module.order + 1, status=ModuleStatus.LOCKED
                ).first()
            )
            if next_module:
                next_module.status = ModuleStatus.AVAILABLE
                next_module.save(update_fields=["status"])

        elif module.status in (ModuleStatus.AVAILABLE, ModuleStatus.LOCKED):
            if module.status != ModuleStatus.LOCKED:
                module.status = ModuleStatus.IN_PROGRESS
                module.save(update_fields=["status"])

        # 3. Check goal completion
        all_done = not goal.modules.exclude(status=ModuleStatus.COMPLETED).exists()
        if all_done:
            goal.status = GoalStatus.COMPLETED
            goal.save(update_fields=["status", "updated_at"])

        # 4. Update streak
        LearningService.update_streak(goal)

        # 5. Daily progress
        today = date.today()
        progress, _ = LearningProgress.objects.get_or_create(
            user=goal.user, goal=goal, date=today,
            defaults={"streak_day": goal.current_streak},
        )
        progress.tasks_completed += 1
        progress.minutes_spent += task.estimated_minutes
        progress.streak_day = goal.current_streak
        progress.save(update_fields=["tasks_completed", "minutes_spent", "streak_day"])

        # 6. Check ahead_of_schedule
        if module_just_completed and module.deadline:
            days_ahead = (module.deadline - today).days
            if days_ahead >= 3:
                from .tasks import run_ai_adaptation
                run_ai_adaptation.delay(
                    str(goal.id),
                    "ahead_of_schedule",
                    {"completed_module": module.title, "days_ahead": days_ahead},
                )

    @staticmethod
    def on_task_skipped(task: LearningTask):
        """
        Called when user skips a task.
        Updates module progress but does NOT count as activity (no streak/progress).
        """
        module = task.module
        goal = module.goal

        total = module.tasks.count()
        done = module.tasks.filter(
            status__in=[TaskStatus.COMPLETED, TaskStatus.SKIPPED]
        ).count()

        if done >= total:
            module.status = ModuleStatus.COMPLETED
            module.save(update_fields=["status"])

            next_module = (
                LearningModule.objects.filter(
                    goal=goal, order=module.order + 1, status=ModuleStatus.LOCKED
                ).first()
            )
            if next_module:
                next_module.status = ModuleStatus.AVAILABLE
                next_module.save(update_fields=["status"])

        # Check goal completion
        all_done = not goal.modules.exclude(status=ModuleStatus.COMPLETED).exists()
        if all_done:
            goal.status = GoalStatus.COMPLETED
            goal.save(update_fields=["status", "updated_at"])

    # ------------------------------------------------------------------
    # Streak system (Duolingo-style)
    # ------------------------------------------------------------------

    @staticmethod
    def update_streak(goal: LearningGoal):
        """
        Update streak on task completion.
        Rules:
        - Same day → no change
        - Yesterday → streak += 1
        - 2 days ago + freeze > 0 → freeze -= 1, streak += 1
        - Otherwise → streak = 1
        """
        today = date.today()
        last = goal.last_activity_date

        if last == today:
            return  # Already counted

        if last == today - timedelta(days=1):
            goal.current_streak += 1
        elif last is None:
            goal.current_streak = 1
        elif last == today - timedelta(days=2) and goal.streak_freezes > 0:
            goal.streak_freezes -= 1
            goal.current_streak += 1
        else:
            goal.current_streak = 1

        if goal.current_streak > goal.longest_streak:
            goal.longest_streak = goal.current_streak

        goal.last_activity_date = today
        goal.save(update_fields=[
            "current_streak", "longest_streak",
            "streak_freezes", "last_activity_date", "updated_at",
        ])

    # ------------------------------------------------------------------
    # Today tasks
    # ------------------------------------------------------------------

    @staticmethod
    def get_today_tasks(goal: LearningGoal):
        """Return tasks for today (due today or next available)."""
        today = date.today()
        today_tasks = LearningTask.objects.filter(
            module__goal=goal,
            due_date=today,
            status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS],
        )
        if today_tasks.exists():
            return today_tasks

        return LearningTask.objects.filter(
            module__goal=goal,
            module__status__in=[ModuleStatus.AVAILABLE, ModuleStatus.IN_PROGRESS],
            status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS],
        ).order_by("module__order", "order")[:3]

    # ------------------------------------------------------------------
    # Deadline shifting (pause/resume)
    # ------------------------------------------------------------------

    @staticmethod
    def shift_deadlines_on_resume(goal: LearningGoal, paused_days: int):
        """Shift all future due_dates by paused_days when resuming."""
        today = date.today()
        delta = timedelta(days=paused_days)

        LearningModule.objects.filter(
            goal=goal, deadline__gte=today,
        ).update(deadline=models.F("deadline") + delta)

        LearningTask.objects.filter(
            module__goal=goal, due_date__gte=today,
        ).update(due_date=models.F("due_date") + delta)

        if goal.target_date and goal.target_date >= today:
            goal.target_date += delta
            goal.save(update_fields=["target_date", "updated_at"])

    # ------------------------------------------------------------------
    # AI Adaptation helpers
    # ------------------------------------------------------------------

    @staticmethod
    def build_plan_snapshot(goal: LearningGoal) -> dict:
        """Build current plan state for AI adaptation."""
        modules = []
        for module in goal.modules.prefetch_related("tasks").order_by("order"):
            tasks = []
            for task in module.tasks.order_by("order"):
                tasks.append({
                    "task_id": str(task.id),
                    "title": task.title,
                    "type": task.task_type,
                    "status": task.status,
                    "estimated_minutes": task.estimated_minutes,
                    "due_date": str(task.due_date) if task.due_date else None,
                    "user_rating": task.user_rating,
                    "resource_query": task.resource_query,
                })
            modules.append({
                "module_index": module.order,
                "title": module.title,
                "status": module.status,
                "deadline": str(module.deadline) if module.deadline else None,
                "tasks": tasks,
            })
        return {
            "goal_title": goal.title,
            "difficulty_level": goal.difficulty_level,
            "target_date": str(goal.target_date) if goal.target_date else None,
            "modules": modules,
        }

    @staticmethod
    def build_progress_summary(goal: LearningGoal) -> dict:
        """Build progress aggregates for AI adaptation."""
        total = LearningTask.objects.filter(module__goal=goal).count()
        completed = LearningTask.objects.filter(module__goal=goal, status=TaskStatus.COMPLETED).count()
        skipped = LearningTask.objects.filter(module__goal=goal, status=TaskStatus.SKIPPED).count()
        overdue = LearningTask.objects.filter(
            module__goal=goal,
            status__in=[TaskStatus.TODO, TaskStatus.IN_PROGRESS],
            due_date__lt=date.today(),
        ).count()
        avg_rating = LearningTask.objects.filter(
            module__goal=goal, user_rating__isnull=False,
        ).aggregate(avg=Avg("user_rating"))["avg"]

        return {
            "total_tasks": total,
            "completed": completed,
            "skipped": skipped,
            "remaining": total - completed - skipped,
            "overdue": overdue,
            "avg_rating": round(avg_rating, 1) if avg_rating else None,
            "current_streak": goal.current_streak,
            "completion_percent": round(completed / max(total, 1) * 100, 1),
        }

    @staticmethod
    def apply_adaptation_changes(goal: LearningGoal, adaptation):
        """Apply PlanChange list from AI adaptation to DB models."""
        for change in adaptation.changes:
            try:
                action = change.action
                if action == "add_task":
                    LearningService._apply_add_task(goal, change)
                elif action == "remove_task":
                    LearningService._apply_remove_task(goal, change)
                elif action == "modify_task":
                    LearningService._apply_modify_task(goal, change)
                elif action == "add_module":
                    LearningService._apply_add_module(goal, change)
                elif action == "remove_module":
                    LearningService._apply_remove_module(goal, change)
                elif action == "reorder_module":
                    pass  # Complex reorder — skip for now
                elif action == "adjust_difficulty":
                    pass  # Metadata only — logged in AdaptationLog
                else:
                    logger.warning("Unknown adaptation action: %s", action)
            except Exception as e:
                logger.warning("Failed to apply change %s: %s", change.action, e)

    @staticmethod
    def _apply_add_task(goal, change):
        """Add a new task to a module."""
        module = LearningModule.objects.filter(goal=goal, title=change.target).first()
        if not module:
            return
        last_order = module.tasks.order_by("-order").values_list("order", flat=True).first() or 0
        LearningTask.objects.create(
            module=module,
            title=change.details,
            description=change.reason,
            task_type="practice",
            estimated_minutes=20,
            order=last_order + 1,
            status=TaskStatus.TODO,
        )

    @staticmethod
    def _apply_remove_task(goal, change):
        """Remove a task — ONLY if status is todo."""
        LearningTask.objects.filter(
            module__goal=goal,
            title=change.target,
            status=TaskStatus.TODO,
        ).delete()

    @staticmethod
    def _apply_modify_task(goal, change):
        """Modify task description or estimated_minutes."""
        task = LearningTask.objects.filter(
            module__goal=goal, title=change.target,
        ).first()
        if task and task.status in (TaskStatus.TODO, TaskStatus.IN_PROGRESS):
            task.description = change.details
            task.save(update_fields=["description"])

    @staticmethod
    def _apply_add_module(goal, change):
        """Add a new module at the end."""
        last_order = goal.modules.order_by("-order").values_list("order", flat=True).first() or 0
        LearningModule.objects.create(
            goal=goal,
            title=change.target,
            description=change.details,
            order=last_order + 1,
            status=ModuleStatus.LOCKED,
        )

    @staticmethod
    def _apply_remove_module(goal, change):
        """Remove module — only if not started (all tasks todo)."""
        module = LearningModule.objects.filter(goal=goal, title=change.target).first()
        if module and module.status in (ModuleStatus.LOCKED, ModuleStatus.AVAILABLE):
            if not module.tasks.exclude(status=TaskStatus.TODO).exists():
                module.delete()
