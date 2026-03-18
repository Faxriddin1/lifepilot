from rest_framework import serializers

from apps.users.models import User
from apps.tasks.models import Task, Project
from apps.finance.models import Account, Category, Transaction, Budget, Goal
from apps.productivity.models import FocusSession, Habit, HabitLog, DailyLog


# ─── Users ───────────────────────────────────────────────────────

class AdminUserSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    projects_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'name', 'avatar_url', 'is_active', 'is_staff',
            'is_superuser', 'base_currency', 'locale', 'timezone',
            'date_joined', 'last_login', 'last_seen_at',
            'tasks_count', 'projects_count',
        ]
        read_only_fields = ['id', 'date_joined', 'last_login']

    def get_tasks_count(self, obj):
        return obj.tasks.count()

    def get_projects_count(self, obj):
        return obj.projects.count()


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'name', 'is_active', 'is_staff', 'base_currency', 'locale', 'timezone']


# ─── Tasks ───────────────────────────────────────────────────────

class AdminTaskSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True, default='')

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'deadline', 'position', 'time_logged',
            'user', 'user_email', 'project', 'project_name',
            'parent_task', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminProjectSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'is_archived', 'user', 'user_email', 'task_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_task_count(self, obj):
        return obj.tasks.count()


# ─── Finance ─────────────────────────────────────────────────────

class AdminAccountSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Account
        fields = [
            'id', 'name', 'account_type', 'currency', 'balance',
            'icon', 'color', 'is_active', 'user', 'user_email',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminCategorySerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True, default='System')

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'icon', 'color', 'category_type',
            'is_default', 'parent', 'user', 'user_email', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminTransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default='')

    class Meta:
        model = Transaction
        fields = [
            'id', 'transaction_type', 'amount', 'currency', 'date',
            'note', 'is_recurring',
            'user', 'user_email', 'account', 'account_name',
            'category', 'category_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AdminBudgetSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Budget
        fields = [
            'id', 'amount', 'period', 'start_date', 'end_date',
            'user', 'user_email', 'category', 'category_name',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminGoalSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'target_amount', 'current_amount', 'currency',
            'deadline', 'icon', 'color', 'is_completed',
            'user', 'user_email', 'progress',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_progress(self, obj):
        if obj.target_amount > 0:
            return round(float(obj.current_amount) / float(obj.target_amount) * 100, 1)
        return 0


# ─── Productivity ────────────────────────────────────────────────

class AdminFocusSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True, default='')

    class Meta:
        model = FocusSession
        fields = [
            'id', 'session_type', 'status', 'duration',
            'start_time', 'end_time',
            'user', 'user_email', 'task', 'task_title',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminHabitSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Habit
        fields = [
            'id', 'name', 'description', 'color', 'icon',
            'frequency', 'target_count', 'is_active',
            'user', 'user_email', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AdminDailyLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = DailyLog
        fields = [
            'id', 'date', 'done', 'planned', 'notes',
            'mood', 'energy_level',
            'user', 'user_email',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
