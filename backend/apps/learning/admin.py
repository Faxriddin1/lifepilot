from django.contrib import admin

from .models import (
    AdaptationLog,
    LearningGoal,
    LearningModule,
    LearningProgress,
    LearningTask,
    TutorMessage,
)


@admin.register(LearningGoal)
class LearningGoalAdmin(admin.ModelAdmin):
    list_display = ("title", "user", "status", "difficulty_level", "current_streak", "target_date", "created_at")
    list_filter = ("status", "difficulty_level")
    search_fields = ("title",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(LearningModule)
class LearningModuleAdmin(admin.ModelAdmin):
    list_display = ("title", "goal", "order", "status", "deadline")
    list_filter = ("status",)
    readonly_fields = ("id", "created_at")


@admin.register(LearningTask)
class LearningTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "module", "task_type", "status", "estimated_minutes", "due_date")
    list_filter = ("task_type", "status")
    readonly_fields = ("id", "created_at", "completed_at")


@admin.register(LearningProgress)
class LearningProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "goal", "date", "tasks_completed", "minutes_spent", "streak_day")
    readonly_fields = ("id", "created_at")


@admin.register(AdaptationLog)
class AdaptationLogAdmin(admin.ModelAdmin):
    list_display = ("goal", "trigger", "created_at")
    list_filter = ("trigger",)
    readonly_fields = ("id", "created_at")


@admin.register(TutorMessage)
class TutorMessageAdmin(admin.ModelAdmin):
    list_display = ("goal", "role", "topic", "content_short", "created_at")
    list_filter = ("role",)
    search_fields = ("content",)
    readonly_fields = ("id", "goal", "task", "role", "content", "module_title", "topic", "created_at")

    def content_short(self, obj):
        return obj.content[:80] + "..." if len(obj.content) > 80 else obj.content
