import uuid

from django.conf import settings
from django.db import models


class DifficultyLevel(models.TextChoices):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class GoalStatus(models.TextChoices):
    DRAFT = "draft"
    GENERATING = "generating"
    PREVIEW = "preview"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ModuleStatus(models.TextChoices):
    LOCKED = "locked"
    AVAILABLE = "available"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TaskType(models.TextChoices):
    VIDEO = "video"
    ARTICLE = "article"
    PRACTICE = "practice"
    QUIZ = "quiz"
    PROJECT = "project"


class TaskStatus(models.TextChoices):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class LearningGoal(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_goals",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    difficulty_level = models.CharField(
        max_length=20,
        choices=DifficultyLevel.choices,
        default=DifficultyLevel.BEGINNER,
    )
    target_date = models.DateField()
    minutes_per_day = models.PositiveIntegerField(default=60)
    days_per_week = models.PositiveIntegerField(default=5)
    status = models.CharField(
        max_length=20,
        choices=GoalStatus.choices,
        default=GoalStatus.DRAFT,
    )
    ai_generated_plan = models.JSONField(null=True, blank=True)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    streak_freezes = models.PositiveIntegerField(default=1)
    last_activity_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class LearningModule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(
        LearningGoal,
        on_delete=models.CASCADE,
        related_name="modules",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=ModuleStatus.choices,
        default=ModuleStatus.LOCKED,
    )
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]
        unique_together = ["goal", "order"]

    def __str__(self):
        return f"[{self.order}] {self.title}"


class LearningTask(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(
        LearningModule,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    task_type = models.CharField(max_length=20, choices=TaskType.choices)
    resource_url = models.URLField(max_length=1000, blank=True, default="")
    resource_query = models.CharField(max_length=500, blank=True, default="")
    estimated_minutes = models.PositiveIntegerField()
    order = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )
    due_date = models.DateField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    user_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    user_notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order"]
        indexes = [
            models.Index(fields=["module", "status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.status})"


class LearningProgress(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="learning_progress",
    )
    goal = models.ForeignKey(
        LearningGoal,
        on_delete=models.CASCADE,
        related_name="progress_logs",
    )
    date = models.DateField()
    tasks_completed = models.PositiveIntegerField(default=0)
    minutes_spent = models.PositiveIntegerField(default=0)
    streak_day = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date"]
        unique_together = ["user", "goal", "date"]

    def __str__(self):
        return f"{self.date} — {self.tasks_completed} tasks, {self.minutes_spent} min"


class AdaptationLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(
        LearningGoal,
        on_delete=models.CASCADE,
        related_name="adaptations",
    )
    trigger = models.CharField(max_length=30)
    changes_json = models.JSONField()
    reason = models.TextField()
    ai_call_log = models.ForeignKey(
        "ai_core.AICallLog",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.trigger} — {self.created_at:%Y-%m-%d}"


class TutorMessage(models.Model):
    """Conversation history with AI tutor for a learning goal."""

    class Role(models.TextChoices):
        USER = "user"
        ASSISTANT = "assistant"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    goal = models.ForeignKey(LearningGoal, on_delete=models.CASCADE, related_name="tutor_messages")
    task = models.ForeignKey(
        LearningTask, on_delete=models.SET_NULL,
        null=True, blank=True, related_name="tutor_messages",
    )
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()
    module_title = models.CharField(max_length=255, blank=True, default="")
    topic = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["goal", "created_at"]),
        ]

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"
