from datetime import timedelta

from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import User
from apps.tasks.models import Task, Project
from apps.finance.models import Account, Category, Transaction, Budget, Goal
from apps.productivity.models import FocusSession, Habit, HabitLog, DailyLog

from .permissions import IsAdminUser
from .serializers import (
    AdminUserSerializer, AdminUserUpdateSerializer,
    AdminTaskSerializer, AdminProjectSerializer,
    AdminAccountSerializer, AdminCategorySerializer,
    AdminTransactionSerializer, AdminBudgetSerializer,
    AdminGoalSerializer,
    AdminFocusSessionSerializer, AdminHabitSerializer,
    AdminDailyLogSerializer,
)


# ─── Dashboard ───────────────────────────────────────────────────

class AdminDashboardView(APIView):
    """Сводная статистика системы для админ-панели."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)

        # Users
        total_users = User.objects.count()
        active_users_week = User.objects.filter(last_seen_at__gte=week_ago).count()
        new_users_today = User.objects.filter(date_joined__date=today).count()
        new_users_week = User.objects.filter(date_joined__gte=week_ago).count()
        new_users_month = User.objects.filter(date_joined__gte=month_ago).count()

        # Tasks
        task_stats = Task.objects.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='done')),
            today=Count('id', filter=Q(created_at__date=today)),
        )

        # Projects
        total_projects = Project.objects.count()

        # Finance
        total_transactions = Transaction.objects.count()
        transactions_today = Transaction.objects.filter(date=today).count()
        total_accounts = Account.objects.count()
        total_budgets = Budget.objects.count()
        total_goals = Goal.objects.count()

        total_income = Transaction.objects.filter(
            transaction_type='income'
        ).aggregate(s=Sum('amount'))['s'] or 0
        total_expense = Transaction.objects.filter(
            transaction_type='expense'
        ).aggregate(s=Sum('amount'))['s'] or 0

        # Productivity
        total_focus_sessions = FocusSession.objects.count()
        total_focus_minutes = FocusSession.objects.filter(
            status='completed'
        ).aggregate(s=Sum('duration'))['s'] or 0
        total_habits = Habit.objects.count()
        total_daily_logs = DailyLog.objects.count()

        # Recent signups
        recent_users = User.objects.order_by('-date_joined')[:10]
        recent_signups = [
            {
                'id': str(u.id),
                'email': u.email,
                'name': u.name,
                'date_joined': u.date_joined.isoformat(),
                'is_active': u.is_active,
            }
            for u in recent_users
        ]

        # User growth (last 7 days)
        user_growth = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            count = User.objects.filter(date_joined__date=d).count()
            user_growth.append({'date': str(d), 'count': count})

        # Task status distribution
        status_dist = (
            Task.objects.values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        task_statuses = {item['status']: item['count'] for item in status_dist}

        return Response({
            'users': {
                'total': total_users,
                'active_week': active_users_week,
                'new_today': new_users_today,
                'new_week': new_users_week,
                'new_month': new_users_month,
                'growth': user_growth,
            },
            'tasks': {
                'total': task_stats['total'],
                'completed': task_stats['completed'],
                'today': task_stats['today'],
                'statuses': task_statuses,
            },
            'projects': {
                'total': total_projects,
            },
            'finance': {
                'total_transactions': total_transactions,
                'transactions_today': transactions_today,
                'total_accounts': total_accounts,
                'total_budgets': total_budgets,
                'total_goals': total_goals,
                'total_income': float(total_income),
                'total_expense': float(total_expense),
            },
            'productivity': {
                'total_focus_sessions': total_focus_sessions,
                'total_focus_minutes': total_focus_minutes,
                'total_habits': total_habits,
                'total_daily_logs': total_daily_logs,
            },
            'recent_signups': recent_signups,
        })


# ─── Users ───────────────────────────────────────────────────────

class AdminUserViewSet(viewsets.ModelViewSet):
    """Управление пользователями: CRUD, блокировка, роли."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    search_fields = ['email', 'name']
    ordering_fields = ['date_joined', 'email', 'name', 'last_seen_at']
    ordering = ['-date_joined']

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return AdminUserUpdateSerializer
        return AdminUserSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Filters
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')
        is_staff = self.request.query_params.get('is_staff')
        if is_staff is not None:
            qs = qs.filter(is_staff=is_staff.lower() == 'true')
        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(name__icontains=search))
        return qs

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Активировать/деактивировать пользователя."""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])
        return Response({
            'id': str(user.id),
            'is_active': user.is_active,
            'message': f"User {'activated' if user.is_active else 'deactivated'}",
        })

    @action(detail=True, methods=['post'])
    def toggle_staff(self, request, pk=None):
        """Назначить/снять права администратора."""
        user = self.get_object()
        if user == request.user:
            return Response(
                {'detail': 'Cannot change your own admin status'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.is_staff = not user.is_staff
        user.save(update_fields=['is_staff'])
        return Response({
            'id': str(user.id),
            'is_staff': user.is_staff,
            'message': f"User {'promoted to admin' if user.is_staff else 'removed from admin'}",
        })


# ─── Tasks ───────────────────────────────────────────────────────

class AdminTaskViewSet(viewsets.ModelViewSet):
    """Управление всеми задачами системы."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminTaskSerializer
    queryset = Task.objects.select_related('user', 'project').all()
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'deadline', 'priority', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        task_status = self.request.query_params.get('status')
        if task_status:
            qs = qs.filter(status=task_status)
        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        return qs


class AdminProjectViewSet(viewsets.ModelViewSet):
    """Управление всеми проектами системы."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminProjectSerializer
    queryset = Project.objects.select_related('user').all()
    search_fields = ['name']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        return qs


# ─── Finance ─────────────────────────────────────────────────────

class AdminAccountViewSet(viewsets.ModelViewSet):
    """Управление всеми счетами системы."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminAccountSerializer
    queryset = Account.objects.select_related('user').all()
    search_fields = ['name']
    ordering = ['-created_at']


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Управление категориями транзакций."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminCategorySerializer
    queryset = Category.objects.select_related('user').all()
    search_fields = ['name']
    ordering = ['-created_at']


class AdminTransactionViewSet(viewsets.ModelViewSet):
    """Управление всеми транзакциями системы."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminTransactionSerializer
    queryset = Transaction.objects.select_related('user', 'account', 'category').all()
    search_fields = ['note']
    ordering_fields = ['date', 'amount', 'created_at']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        tx_type = self.request.query_params.get('type')
        if tx_type:
            qs = qs.filter(transaction_type=tx_type)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(note__icontains=search)
        return qs


class AdminBudgetViewSet(viewsets.ModelViewSet):
    """Управление всеми бюджетами системы."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminBudgetSerializer
    queryset = Budget.objects.select_related('user', 'category').all()
    ordering = ['-start_date']


class AdminGoalViewSet(viewsets.ModelViewSet):
    """Управление всеми финансовыми целями системы."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminGoalSerializer
    queryset = Goal.objects.select_related('user').all()
    search_fields = ['name']
    ordering = ['-created_at']


# ─── Productivity ────────────────────────────────────────────────

class AdminFocusSessionViewSet(viewsets.ModelViewSet):
    """Управление всеми фокус-сессиями."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminFocusSessionSerializer
    queryset = FocusSession.objects.select_related('user', 'task').all()
    ordering_fields = ['start_time', 'duration']
    ordering = ['-start_time']

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        session_status = self.request.query_params.get('status')
        if session_status:
            qs = qs.filter(status=session_status)
        return qs


class AdminHabitViewSet(viewsets.ModelViewSet):
    """Управление всеми привычками."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminHabitSerializer
    queryset = Habit.objects.select_related('user').all()
    search_fields = ['name']
    ordering = ['-created_at']


class AdminDailyLogViewSet(viewsets.ModelViewSet):
    """Управление всеми дневниковыми записями."""
    permission_classes = [IsAdminUser]
    serializer_class = AdminDailyLogSerializer
    queryset = DailyLog.objects.select_related('user').all()
    ordering = ['-date']

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get('user')
        if user_id:
            qs = qs.filter(user_id=user_id)
        mood = self.request.query_params.get('mood')
        if mood:
            qs = qs.filter(mood=mood)
        return qs
