from django.contrib import admin

from .models import DailyLog, FocusSession, Habit, HabitLog


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'session_type', 'status', 'duration', 'start_time', 'end_time')
    list_filter = ('session_type', 'status')
    search_fields = ('user__email',)
    raw_id_fields = ('user', 'task')
    ordering = ('-start_time',)


@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'frequency', 'target_count', 'is_active', 'created_at')
    list_filter = ('frequency', 'is_active')
    search_fields = ('name', 'user__email')


@admin.register(HabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ('habit', 'date', 'count')
    list_filter = ('date',)
    raw_id_fields = ('habit',)
    ordering = ('-date',)


@admin.register(DailyLog)
class DailyLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'date', 'mood', 'energy_level', 'created_at')
    list_filter = ('mood', 'date')
    search_fields = ('user__email',)
    ordering = ('-date',)
