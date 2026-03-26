from django.db.models import Count, Q
from rest_framework import serializers

from .models import (
    AdaptationLog,
    DifficultyLevel,
    LearningGoal,
    LearningModule,
    LearningProgress,
    LearningTask,
    TutorMessage,
    TaskStatus,
)


class LearningTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningTask
        fields = [
            "id", "title", "description", "task_type", "resource_url",
            "resource_query", "estimated_minutes", "order", "status",
            "due_date", "completed_at", "user_rating", "user_notes", "created_at",
        ]
        read_only_fields = ["id", "created_at", "completed_at"]


class LearningTaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningTask
        fields = ["status", "user_rating", "user_notes"]


class LearningModuleSerializer(serializers.ModelSerializer):
    tasks = LearningTaskSerializer(many=True, read_only=True)
    completed_tasks_count = serializers.SerializerMethodField()
    total_tasks_count = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = LearningModule
        fields = [
            "id", "title", "description", "order", "status", "deadline",
            "created_at", "tasks", "completed_tasks_count", "total_tasks_count",
            "progress_percent",
        ]

    def get_completed_tasks_count(self, obj):
        return obj.tasks.filter(status=TaskStatus.COMPLETED).count()

    def get_total_tasks_count(self, obj):
        return obj.tasks.count()

    def get_progress_percent(self, obj):
        total = obj.tasks.count()
        if total == 0:
            return 0
        completed = obj.tasks.filter(
            status__in=[TaskStatus.COMPLETED, TaskStatus.SKIPPED]
        ).count()
        return round(completed / total * 100)


class LearningGoalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningGoal
        fields = [
            "id", "title", "description", "difficulty_level",
            "target_date", "minutes_per_day", "days_per_week",
        ]
        read_only_fields = ["id"]

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class LearningGoalSerializer(serializers.ModelSerializer):
    modules_count = serializers.IntegerField(read_only=True, default=0)
    completed_modules_count = serializers.IntegerField(read_only=True, default=0)
    total_tasks = serializers.IntegerField(read_only=True, default=0)
    completed_tasks = serializers.IntegerField(read_only=True, default=0)
    progress_percent = serializers.SerializerMethodField()

    class Meta:
        model = LearningGoal
        fields = [
            "id", "title", "description", "difficulty_level",
            "target_date", "minutes_per_day", "days_per_week",
            "status", "ai_generated_plan",
            "current_streak", "longest_streak", "streak_freezes",
            "last_activity_date", "created_at", "updated_at",
            "modules_count", "completed_modules_count",
            "total_tasks", "completed_tasks", "progress_percent",
        ]

    def get_progress_percent(self, obj):
        total = getattr(obj, "total_tasks", 0) or 0
        completed = getattr(obj, "completed_tasks", 0) or 0
        if total == 0:
            return 0
        return round(completed / total * 100)


class LearningGoalDetailSerializer(LearningGoalSerializer):
    modules = LearningModuleSerializer(many=True, read_only=True)

    class Meta(LearningGoalSerializer.Meta):
        fields = LearningGoalSerializer.Meta.fields + ["modules"]


class PlanPreviewSerializer(serializers.Serializer):
    """Read-only serializer for AI-generated plan preview."""
    plan = serializers.JSONField(read_only=True)
    goal_id = serializers.UUIDField(read_only=True)
    status = serializers.CharField(read_only=True)


class PlanConfirmSerializer(serializers.Serializer):
    """Serializer for confirming (and optionally editing) a plan."""
    plan_json = serializers.JSONField(required=False)


class LearningProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningProgress
        fields = [
            "id", "date", "tasks_completed", "minutes_spent",
            "streak_day", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class TaskRatingSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    notes = serializers.CharField(required=False, default="", allow_blank=True)


class TutorMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TutorMessage
        fields = ["id", "role", "content", "module_title", "topic", "task", "created_at"]
        read_only_fields = ["id", "role", "module_title", "topic", "created_at"]


class TutorAskSerializer(serializers.Serializer):
    question = serializers.CharField(max_length=2000)
    task_id = serializers.UUIDField(required=False, allow_null=True)
