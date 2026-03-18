import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Project(models.Model):
    """Проект пользователя.

    Группирует задачи. Поддерживает архивирование, цвет и иконку.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='projects',
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    color = models.CharField(max_length=7, default='#6366F1')  # HEX-цвет проекта
    icon = models.CharField(max_length=50, blank=True, default='')
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Мета-настройки модели проекта."""
        ordering = ['-created_at']
        verbose_name = 'project'
        verbose_name_plural = 'projects'

    def __str__(self):
        return self.name


class Task(models.Model):
    """Задача пользователя.

    Поддерживает подзадачи до 3 уровней вложенности, привязку к проекту,
    приоритеты, статусы и дедлайны.
    """

    class Priority(models.TextChoices):
        """Приоритет задачи: от P1 (критический) до P4 (низкий)."""
        P1 = 'P1', 'Critical'
        P2 = 'P2', 'High'
        P3 = 'P3', 'Medium'
        P4 = 'P4', 'Low'

    class Status(models.TextChoices):
        """Статус жизненного цикла задачи."""
        INBOX = 'inbox', 'Inbox'
        IN_PROGRESS = 'in_progress', 'In Progress'
        REVIEW = 'review', 'Review'
        DONE = 'done', 'Done'
        ARCHIVED = 'archived', 'Archived'

    MAX_SUBTASK_DEPTH = 3  # Максимальная глубина вложенности подзадач

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
    )
    parent_task = models.ForeignKey(  # Родительская задача для вложенности
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subtasks',
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    priority = models.CharField(
        max_length=2, choices=Priority.choices, default=Priority.P3
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.INBOX
    )
    deadline = models.DateTimeField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)  # Список тегов задачи
    time_estimate = models.PositiveIntegerField(
        null=True, blank=True, help_text='Estimated time in minutes'
    )
    time_logged = models.PositiveIntegerField(
        default=0, help_text='Logged time in minutes'
    )
    recurrence_rule = models.JSONField(null=True, blank=True)  # Правило повторения (iCal-подобное)
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Мета-настройки модели задачи."""
        ordering = ['position', '-created_at']
        verbose_name = 'task'
        verbose_name_plural = 'tasks'

    def __str__(self):
        return self.title

    def get_depth(self):
        """Вернуть глубину вложенности задачи (0 для корневых задач)."""
        depth = 0
        current = self
        while current.parent_task_id is not None:
            depth += 1
            current = current.parent_task
        return depth

    def validate_subtask_depth(self):
        """Проверить, что глубина подзадачи не превышает MAX_SUBTASK_DEPTH."""
        if self.parent_task and self.get_depth() >= self.MAX_SUBTASK_DEPTH:
            raise ValidationError(
                f'Subtask depth cannot exceed {self.MAX_SUBTASK_DEPTH} levels.'
            )

    def clean(self):
        """Валидация модели перед сохранением."""
        super().clean()
        self.validate_subtask_depth()

    def save(self, *args, **kwargs):
        """Сохранить задачу с проверкой глубины вложенности."""
        self.validate_subtask_depth()
        super().save(*args, **kwargs)
