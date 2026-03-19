from rest_framework import serializers

from .models import Project, Task


class ProjectSerializer(serializers.ModelSerializer):
    """Сериализатор проекта с вычисляемым количеством задач."""
    task_count = serializers.SerializerMethodField()
    completed_task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'is_archived', 'task_count', 'completed_task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        """Возвращает количество задач из аннотации или через подсчёт."""
        if hasattr(obj, 'task_count_annotated'):
            return obj.task_count_annotated
        return obj.tasks.count()

    def get_completed_task_count(self, obj):
        """Возвращает количество завершённых задач из аннотации или через подсчёт."""
        if hasattr(obj, 'completed_task_count_annotated'):
            return obj.completed_task_count_annotated
        return obj.tasks.filter(status=Task.Status.DONE).count()


class SubtaskSerializer(serializers.ModelSerializer):
    """Облегчённый сериализатор для отображения вложенных подзадач."""
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'status', 'priority', 'deadline',
            'position', 'time_estimate', 'time_logged', 'is_completed',
        ]

    def get_is_completed(self, obj):
        """Возвращает True если задача завершена."""
        return obj.status == Task.Status.DONE


class TaskSerializer(serializers.ModelSerializer):
    """Полный сериализатор задачи для чтения, включая подзадачи и имя проекта."""
    subtasks = SubtaskSerializer(many=True, read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, default=None)

    class Meta:
        model = Task
        fields = [
            'id', 'project', 'project_name', 'parent_task', 'title',
            'description', 'priority', 'status', 'deadline', 'tags',
            'time_estimate', 'time_logged', 'recurrence_rule', 'position',
            'subtasks', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    """Сериализатор создания задачи с валидацией владельца и глубины подзадач."""

    class Meta:
        model = Task
        fields = [
            'project', 'parent_task', 'title', 'description',
            'priority', 'status', 'deadline', 'tags',
            'time_estimate', 'recurrence_rule', 'position',
        ]

    def validate(self, attrs):
        """Проверяет принадлежность родительской задачи и проекта, ограничение глубины подзадач."""
        user = self.context['request'].user

        parent = attrs.get('parent_task')
        if parent:
            if parent.user_id != user.id:
                raise serializers.ValidationError(
                    {'parent_task': 'Parent task does not belong to you.'}
                )
            # Проверка глубины вложенности подзадач
            depth = 1
            current = parent
            while current.parent_task_id is not None:
                depth += 1
                current = current.parent_task
            if depth >= Task.MAX_SUBTASK_DEPTH:
                raise serializers.ValidationError(
                    {'parent_task': f'Subtask depth cannot exceed {Task.MAX_SUBTASK_DEPTH} levels.'}
                )

        project = attrs.get('project')
        if project and project.user_id != user.id:
            raise serializers.ValidationError(
                {'project': 'Project does not belong to you.'}
            )

        return attrs


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Сериализатор обновления задачи с проверкой циклических ссылок."""

    class Meta:
        model = Task
        fields = [
            'project', 'parent_task', 'title', 'description',
            'priority', 'status', 'deadline', 'tags',
            'time_estimate', 'time_logged', 'recurrence_rule', 'position',
        ]

    def validate(self, attrs):
        """Проверяет владельца, циклические ссылки и принадлежность проекта."""
        user = self.context['request'].user

        parent = attrs.get('parent_task')
        if parent:
            if parent.user_id != user.id:
                raise serializers.ValidationError(
                    {'parent_task': 'Parent task does not belong to you.'}
                )
            # Проверка циклических ссылок: parent_task не может быть самой задачей или её потомком
            task = self.instance
            if task:
                if parent.id == task.id:
                    raise serializers.ValidationError(
                        {'parent_task': 'A task cannot be its own parent.'}
                    )
                current = parent
                while current.parent_task_id is not None:
                    if current.parent_task_id == task.id:
                        raise serializers.ValidationError(
                            {'parent_task': 'Circular reference detected: the selected parent is a descendant of this task.'}
                        )
                    current = current.parent_task

        project = attrs.get('project')
        if project and project.user_id != user.id:
            raise serializers.ValidationError(
                {'project': 'Project does not belong to you.'}
            )

        return attrs


class TaskBulkUpdateSerializer(serializers.Serializer):
    """Сериализатор массового обновления задач по списку ID."""
    ids = serializers.ListField(child=serializers.UUIDField())
    status = serializers.ChoiceField(choices=Task.Status.choices, required=False)
    priority = serializers.ChoiceField(choices=Task.Priority.choices, required=False)
    project = serializers.UUIDField(required=False, allow_null=True)

    def validate_ids(self, value):
        """Проверяет, что передан хотя бы один ID задачи."""
        if not value:
            raise serializers.ValidationError('At least one task ID is required.')
        return value

    def validate_project(self, value):
        """Проверяет, что проект принадлежит текущему пользователю."""
        if value is not None:
            user = self.context['request'].user
            if not Project.objects.filter(id=value, user=user).exists():
                raise serializers.ValidationError('Project does not belong to you.')
        return value
