from django.contrib import admin

from .models import Project, Task


class TaskInline(admin.TabularInline):
    model = Task
    fk_name = 'project'
    extra = 0
    fields = ('title', 'status', 'priority', 'deadline', 'position')
    readonly_fields = ('created_at',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_archived', 'created_at')
    list_filter = ('is_archived',)
    search_fields = ('name', 'user__email')
    inlines = [TaskInline]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'status', 'priority', 'project', 'deadline', 'created_at')
    list_filter = ('status', 'priority')
    search_fields = ('title', 'user__email')
    raw_id_fields = ('user', 'project', 'parent_task')
    ordering = ('-created_at',)
