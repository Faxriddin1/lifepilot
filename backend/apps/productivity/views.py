from datetime import timedelta

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import DailyLog, FocusSession, Habit, HabitLog
from .serializers import (
    DailyLogSerializer,
    FocusSessionSerializer,
    FocusSessionStartSerializer,
    HabitLogSerializer,
    HabitSerializer,
)


class FocusSessionViewSet(viewsets.ModelViewSet):
    """CRUD операции с фокус-сессиями. Поддерживает запуск, остановку и историю."""
    serializer_class = FocusSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает фокус-сессии пользователя с подгрузкой связанной задачи."""
        return (
            FocusSession.objects
            .filter(user=self.request.user)
            .select_related('task')
        )

    def get_serializer_class(self):
        """Выбирает сериализатор: стартовый для запуска, основной для остальных действий."""
        if self.action == 'start':
            return FocusSessionStartSerializer
        return FocusSessionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def start(self, request):
        """Запускает новую фокус-сессию, прерывая все активные сессии пользователя."""
        serializer = FocusSessionStartSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # End any existing active sessions
            FocusSession.objects.select_for_update().filter(
                user=request.user, status=FocusSession.Status.ACTIVE
            ).update(
                status=FocusSession.Status.INTERRUPTED,
                end_time=timezone.now(),
            )

            session = FocusSession.objects.create(
                user=request.user,
                task_id=serializer.validated_data.get('task'),
                session_type=serializer.validated_data['session_type'],
                duration=serializer.validated_data['duration'],
                start_time=timezone.now(),
                status=FocusSession.Status.ACTIVE,
            )
        return Response(
            FocusSessionSerializer(session).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """Останавливает активную фокус-сессию и обновляет time_logged связанной задачи."""
        session = self.get_object()
        if session.status != FocusSession.Status.ACTIVE:
            return Response(
                {'detail': 'Session is not active.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        actual_duration = round((now - session.start_time).total_seconds() / 60)

        with transaction.atomic():
            session.end_time = now
            session.duration = actual_duration
            session.status = FocusSession.Status.COMPLETED
            session.save(update_fields=['end_time', 'duration', 'status'])

            # Update task time_logged if linked
            if session.task:
                session.task.time_logged += actual_duration
                session.task.save(update_fields=['time_logged'])

        return Response(FocusSessionSerializer(session).data)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Возвращает завершённые фокус-сессии пользователя с пагинацией."""
        qs = self.get_queryset().filter(
            status=FocusSession.Status.COMPLETED
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = FocusSessionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = FocusSessionSerializer(qs, many=True)
        return Response(serializer.data)


class HabitViewSet(viewsets.ModelViewSet):
    """CRUD операции с привычками пользователя."""
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает привычки текущего пользователя."""
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HabitLogViewSet(viewsets.ModelViewSet):
    """CRUD операции с записями выполнения привычек."""
    serializer_class = HabitLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает записи привычек пользователя с подгрузкой привычки."""
        return (
            HabitLog.objects
            .filter(habit__user=self.request.user)
            .select_related('habit')
        )

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Возвращает записи привычек за сегодня."""
        today = timezone.localdate()
        logs = self.get_queryset().filter(date=today)
        serializer = HabitLogSerializer(logs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='streak/(?P<habit_id>[0-9a-f-]+)')
    def streak(self, request, habit_id=None):
        """Вычисляет текущую серию (streak) последовательных дней выполнения привычки."""
        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response(
                {'detail': 'Habit not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        logs = (
            HabitLog.objects
            .filter(habit=habit)
            .order_by('-date')
            .values_list('date', flat=True)
        )

        streak = 0
        expected_date = timezone.localdate()

        for log_date in logs:
            if log_date == expected_date:
                streak += 1
                expected_date -= timedelta(days=1)
            elif log_date < expected_date:
                break

        return Response({
            'habit_id': str(habit.id),
            'habit_name': habit.name,
            'current_streak': streak,
        })


class DailyLogViewSet(viewsets.ModelViewSet):
    """CRUD операции с дневником. Одна запись на пользователя в день."""
    serializer_class = DailyLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает дневниковые записи текущего пользователя."""
        return DailyLog.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='today')
    def today(self, request):
        """Возвращает запись за сегодня или пустой объект."""
        today = timezone.localdate()
        try:
            log = DailyLog.objects.get(user=request.user, date=today)
            return Response(DailyLogSerializer(log).data)
        except DailyLog.DoesNotExist:
            return Response({
                'date': str(today),
                'done': '',
                'planned': '',
                'notes': '',
                'mood': '',
                'energy_level': 0,
            })
