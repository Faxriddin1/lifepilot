from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .filters import TaskFilter
from .models import Project, Task
from .serializers import (
    ProjectSerializer,
    TaskBulkUpdateSerializer,
    TaskCreateSerializer,
    TaskSerializer,
    TaskUpdateSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD операции с проектами пользователя."""
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает проекты текущего пользователя с аннотацией количества задач."""
        return (
            Project.objects
            .filter(user=self.request.user)
            .annotate(
                task_count_annotated=Count('tasks'),
                completed_task_count_annotated=Count(
                    'tasks', filter=Q(tasks__status=Task.Status.DONE)
                ),
            )
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD операции с задачами. Поддерживает фильтрацию, сортировку и массовое обновление."""
    permission_classes = [IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ['title']
    ordering_fields = ['position', 'created_at', 'deadline', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        """Возвращает задачи пользователя с подгрузкой проекта и подзадач."""
        return (
            Task.objects
            .filter(user=self.request.user)
            .select_related('project', 'parent_task')
            .prefetch_related('subtasks')
        )

    def get_serializer_class(self):
        """Выбирает сериализатор в зависимости от действия (создание/обновление/массовое)."""
        if self.action == 'create':
            return TaskCreateSerializer
        if self.action in ('update', 'partial_update'):
            return TaskUpdateSerializer
        if self.action == 'bulk_update':
            return TaskBulkUpdateSerializer
        return TaskSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['patch'], url_path='bulk-update')
    def bulk_update(self, request):
        """Массовое обновление статуса, приоритета или проекта для нескольких задач."""
        serializer = TaskBulkUpdateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)

        ids = serializer.validated_data.pop('ids')
        update_fields = {k: v for k, v in serializer.validated_data.items() if v is not None}

        if not update_fields:
            return Response(
                {'detail': 'No fields to update.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = (
            Task.objects
            .filter(user=request.user, id__in=ids)
            .update(**update_fields)
        )
        return Response({'updated': updated})
