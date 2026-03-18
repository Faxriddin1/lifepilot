import uuid

from django.conf import settings
from django.db import models


class FocusSession(models.Model):
    """Сессия фокусировки (таймер продуктивности).

    Поддерживает режимы Pomodoro, Deep Work и пользовательский.
    Может быть привязана к конкретной задаче.
    """

    class SessionType(models.TextChoices):
        """Тип сессии фокусировки."""
        POMODORO = 'pomodoro', 'Pomodoro'
        DEEP_WORK = 'deep_work', 'Deep Work'
        SHORT_BREAK = 'short_break', 'Short Break'
        LONG_BREAK = 'long_break', 'Long Break'
        CUSTOM = 'custom', 'Custom'

    class Status(models.TextChoices):
        """Статус сессии: активна, завершена или прервана."""
        ACTIVE = 'active', 'Active'
        COMPLETED = 'completed', 'Completed'
        INTERRUPTED = 'interrupted', 'Interrupted'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='focus_sessions',
    )
    task = models.ForeignKey(
        'tasks.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='focus_sessions',
    )
    session_type = models.CharField(
        max_length=20, choices=SessionType.choices, default=SessionType.POMODORO
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    duration = models.PositiveIntegerField(
        default=0, help_text='Duration in minutes'
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Мета-настройки модели сессии фокусировки."""
        ordering = ['-start_time']
        verbose_name = 'focus session'
        verbose_name_plural = 'focus sessions'

    def __str__(self):
        return f'{self.session_type} – {self.start_time:%Y-%m-%d %H:%M}'


class Habit(models.Model):
    """Привычка пользователя.

    Отслеживает регулярные действия с ежедневной или еженедельной частотой.
    """

    class Frequency(models.TextChoices):
        """Частота выполнения привычки."""
        DAILY = 'daily', 'Daily'
        WEEKLY = 'weekly', 'Weekly'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='habits',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    color = models.CharField(max_length=7, default='#10B981')
    icon = models.CharField(max_length=50, blank=True, default='')
    frequency = models.CharField(
        max_length=10, choices=Frequency.choices, default=Frequency.DAILY
    )
    target_count = models.PositiveIntegerField(default=1)  # Целевое кол-во выполнений за период
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Мета-настройки модели привычки."""
        ordering = ['-created_at']
        verbose_name = 'habit'
        verbose_name_plural = 'habits'

    def __str__(self):
        return self.name


class HabitLog(models.Model):
    """Запись о выполнении привычки за конкретную дату.

    Уникальная пара (привычка, дата) — одна запись в день.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='logs',
    )
    date = models.DateField()
    count = models.PositiveIntegerField(default=1)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Мета-настройки модели записи привычки."""
        ordering = ['-date']
        unique_together = ['habit', 'date']
        verbose_name = 'habit log'
        verbose_name_plural = 'habit logs'

    def __str__(self):
        return f'{self.habit.name} – {self.date}'


class DailyLog(models.Model):
    """Дневник — ежедневная запись пользователя.

    Содержит итоги дня, планы, заметки и оценку настроения.
    Уникальная пара (пользователь, дата) — одна запись в день.
    """

    class Mood(models.TextChoices):
        """Оценка настроения за день."""
        GREAT = 'great', 'Отлично'
        GOOD = 'good', 'Хорошо'
        OKAY = 'okay', 'Нормально'
        BAD = 'bad', 'Плохо'
        TERRIBLE = 'terrible', 'Ужасно'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='daily_logs',
    )
    date = models.DateField()
    done = models.TextField(blank=True, default='', help_text='Что сделано сегодня')
    planned = models.TextField(blank=True, default='', help_text='Планы на завтра')
    notes = models.TextField(blank=True, default='', help_text='Свободные заметки')
    mood = models.CharField(
        max_length=10, choices=Mood.choices, blank=True, default='',
    )
    energy_level = models.PositiveSmallIntegerField(
        default=0, help_text='Уровень энергии 0-5'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        unique_together = ['user', 'date']
        verbose_name = 'daily log'
        verbose_name_plural = 'daily logs'

    def __str__(self):
        return f'{self.user.email} – {self.date}'
