from django.utils import timezone
from rest_framework import serializers

from .models import DailyLog, FocusSession, Habit, HabitLog


class FocusSessionSerializer(serializers.ModelSerializer):
    """Сериализатор фокус-сессии для чтения с названием связанной задачи."""
    task_title = serializers.CharField(source='task.title', read_only=True, allow_null=True)

    class Meta:
        model = FocusSession
        fields = [
            'id', 'task', 'task_title', 'session_type',
            'start_time', 'end_time', 'duration', 'status', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class FocusSessionStartSerializer(serializers.Serializer):
    """Сериализатор запуска фокус-сессии: задача, тип и длительность."""
    task = serializers.UUIDField(required=False, allow_null=True)
    session_type = serializers.ChoiceField(
        choices=FocusSession.SessionType.choices,
        default=FocusSession.SessionType.POMODORO,
    )
    duration = serializers.IntegerField(min_value=1, max_value=480, default=25)

    def validate_task(self, value):
        """Проверяет, что задача существует и принадлежит пользователю."""
        if value:
            from apps.tasks.models import Task
            user = self.context['request'].user
            if not Task.objects.filter(id=value, user=user).exists():
                raise serializers.ValidationError('Task not found.')
        return value


class HabitSerializer(serializers.ModelSerializer):
    """Сериализатор привычки: название, частота, цель и настройки отображения."""

    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'frequency', 'target_count', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class HabitLogSerializer(serializers.ModelSerializer):
    """Сериализатор записи выполнения привычки с проверкой дубликатов."""
    habit_name = serializers.CharField(source='habit.name', read_only=True)

    class Meta:
        model = HabitLog
        fields = ['id', 'habit', 'habit_name', 'date', 'count', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        """Проверяет владельца привычки и уникальность записи на дату."""
        habit = attrs.get('habit')
        date = attrs.get('date')
        user = self.context['request'].user

        if habit and habit.user != user:
            raise serializers.ValidationError({'habit': 'Habit not found.'})

        # Prevent duplicate logs for the same habit/date (on create)
        if not self.instance and habit and date:
            if HabitLog.objects.filter(habit=habit, date=date).exists():
                raise serializers.ValidationError(
                    {'date': 'A log for this habit on this date already exists.'}
                )
        return attrs


class DailyLogSerializer(serializers.ModelSerializer):
    """Сериализатор дневника: итоги дня, планы, заметки, настроение и энергия."""

    class Meta:
        model = DailyLog
        fields = [
            'id', 'date', 'done', 'planned', 'notes',
            'mood', 'energy_level', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_energy_level(self, value):
        """Проверяет что уровень энергии в диапазоне 0-5."""
        if value < 0 or value > 5:
            raise serializers.ValidationError('Уровень энергии должен быть от 0 до 5.')
        return value

    def validate(self, attrs):
        """Проверяет уникальность записи на дату при создании."""
        date = attrs.get('date')
        user = self.context['request'].user

        if not self.instance and date:
            if DailyLog.objects.filter(user=user, date=date).exists():
                raise serializers.ValidationError(
                    {'date': 'Запись за эту дату уже существует.'}
                )
        return attrs
