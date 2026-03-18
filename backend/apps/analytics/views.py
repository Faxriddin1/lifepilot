from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.finance.models import Account, Transaction
from apps.productivity.models import FocusSession, HabitLog
from apps.tasks.models import Project, Task



class DashboardView(APIView):
    """Агрегированные данные дашборда для авторизованного пользователя."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Возвращает полную сводку дашборда: задачи, фокус, привычки, финансы."""
        from apps.finance.models import Budget
        from apps.productivity.models import Habit

        user = request.user
        today = timezone.localdate()
        month_start = today.replace(day=1)
        week_start = today - timedelta(days=6)

        # === Tasks ===
        user_tasks = Task.objects.filter(user=user).exclude(status=Task.Status.ARCHIVED)
        tasks_today = user_tasks.filter(deadline=today).count()
        tasks_completed_today = user_tasks.filter(deadline=today, status=Task.Status.DONE).count()

        # Recent tasks (last 10, not archived)
        recent_tasks = list(
            user_tasks
            .select_related('project')
            .order_by('-created_at')[:10]
            .values('id', 'title', 'status', 'priority', 'deadline')
        )
        for t in recent_tasks:
            t['id'] = str(t['id'])
            if t['deadline']:
                t['deadline'] = str(t['deadline'])

        # === Focus ===
        focus_minutes_today = (
            FocusSession.objects.filter(
                user=user,
                status=FocusSession.Status.COMPLETED,
                start_time__date=today,
            ).aggregate(total=Sum('duration'))['total']
        ) or 0

        # Heatmap (last 90 days)
        heatmap_start = today - timedelta(days=90)
        heatmap_qs = (
            FocusSession.objects.filter(
                user=user,
                status=FocusSession.Status.COMPLETED,
                start_time__date__gte=heatmap_start,
            )
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(minutes=Sum('duration'))
            .order_by('day')
        )
        productivity_heatmap = [
            {'date': str(e['day']), 'minutes': e['minutes'] or 0}
            for e in heatmap_qs
        ]

        # === Habits (this week) ===
        habits = Habit.objects.filter(user=user, is_active=True)[:5]
        habit_completions = []
        for habit in habits:
            logs = set(
                HabitLog.objects.filter(
                    habit=habit, date__gte=week_start, date__lte=today
                ).values_list('date', flat=True)
            )
            days = []
            for i in range(7):
                d = week_start + timedelta(days=i)
                days.append({'date': str(d), 'completed': d in logs})
            habit_completions.append({
                'habit_id': str(habit.id),
                'habit_name': habit.name,
                'days': days,
            })

        # === Finance ===
        total_balance = (
            Account.objects.filter(user=user, is_active=True)
            .aggregate(total=Sum('balance'))['total']
        ) or Decimal('0.00')

        # Cashflow 7 days
        cashflow_7d = []
        for i in range(7):
            d = today - timedelta(days=6 - i)
            day_income = Transaction.objects.filter(
                user=user, transaction_type=Transaction.TransactionType.INCOME, date=d
            ).aggregate(total=Sum('amount'))['total'] or 0
            day_expense = Transaction.objects.filter(
                user=user, transaction_type=Transaction.TransactionType.EXPENSE, date=d
            ).aggregate(total=Sum('amount'))['total'] or 0
            cashflow_7d.append({
                'date': str(d),
                'income': float(day_income),
                'expense': float(day_expense),
            })

        # Top budgets
        budgets = Budget.objects.filter(user=user).select_related('category')[:4]
        top_budgets = []
        for b in budgets:
            spent = Transaction.objects.filter(
                user=user,
                transaction_type=Transaction.TransactionType.EXPENSE,
                category=b.category,
                date__gte=b.start_date,
                date__lte=b.end_date or today,
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            top_budgets.append({
                'id': str(b.id),
                'name': b.category.name,
                'amount': float(b.amount),
                'spent': float(spent),
            })

        return Response({
            'tasks_today': tasks_today,
            'tasks_completed_today': tasks_completed_today,
            'focus_minutes_today': focus_minutes_today,
            'total_balance': float(total_balance),
            'recent_tasks': recent_tasks,
            'cashflow_7d': cashflow_7d,
            'habit_completions': habit_completions,
            'top_budgets': top_budgets,
            'productivity_heatmap': productivity_heatmap,
        })


class ProductivityAnalyticsView(APIView):
    """Статистика фокус-времени и тепловая карта продуктивности."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Возвращает полную статистику продуктивности: фокус, задачи, тепловую карту."""
        user = request.user
        days = int(request.query_params.get('days', 90))
        today = timezone.localdate()
        start_date = today - timedelta(days=days)

        # === Focus sessions ===
        sessions = FocusSession.objects.filter(
            user=user,
            status=FocusSession.Status.COMPLETED,
            start_time__date__gte=start_date,
        )

        # Heatmap: focus minutes per day
        heatmap_qs = (
            sessions
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(minutes=Sum('duration'))
            .order_by('day')
        )
        heatmap = [
            {'date': str(entry['day']), 'minutes': entry['minutes'] or 0}
            for entry in heatmap_qs
        ]

        # Daily focus (last 30 days for bar chart)
        daily_start = today - timedelta(days=30)
        daily_focus_qs = (
            sessions.filter(start_time__date__gte=daily_start)
            .annotate(day=TruncDate('start_time'))
            .values('day')
            .annotate(minutes=Sum('duration'))
            .order_by('day')
        )
        daily_focus = [
            {'date': str(entry['day']), 'minutes': entry['minutes'] or 0}
            for entry in daily_focus_qs
        ]

        # Peak hours
        from django.db.models.functions import ExtractHour
        peak_qs = (
            sessions
            .annotate(hour=ExtractHour('start_time'))
            .values('hour')
            .annotate(minutes=Sum('duration'))
            .order_by('hour')
        )
        peak_hours = [
            {'hour': entry['hour'], 'minutes': entry['minutes'] or 0}
            for entry in peak_qs
        ]

        total_focus_minutes = sessions.aggregate(total=Sum('duration'))['total'] or 0
        avg_daily = round(total_focus_minutes / max(days, 1), 1)

        # Focus streak (consecutive days with sessions)
        focus_dates = set(
            sessions.annotate(day=TruncDate('start_time'))
            .values_list('day', flat=True)
            .distinct()
        )
        streak_days = 0
        check_date = today
        while check_date in focus_dates:
            streak_days += 1
            check_date -= timedelta(days=1)

        # === Tasks ===
        total_tasks = Task.objects.filter(
            user=user
        ).exclude(status=Task.Status.ARCHIVED).count()
        completed_tasks = Task.objects.filter(
            user=user, status=Task.Status.DONE
        ).count()
        task_completion_rate = round(
            (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1
        )

        data = {
            'heatmap': heatmap,
            'daily_focus': daily_focus,
            'peak_hours': peak_hours,
            'total_focus_minutes': total_focus_minutes,
            'avg_focus_per_day': avg_daily,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'task_completion_rate': task_completion_rate,
            'streak_days': streak_days,
        }
        return Response(data)


class FinanceAnalyticsView(APIView):
    """Тренды доходов/расходов и топ категорий за период."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Возвращает cashflow, категории расходов/доходов, помесячные тренды."""
        user = request.user
        today = timezone.localdate()

        # === Cashflow (last 30 days) ===
        cashflow_start = today - timedelta(days=30)
        cashflow = []
        for i in range(30):
            d = cashflow_start + timedelta(days=i)
            day_income = Transaction.objects.filter(
                user=user, transaction_type=Transaction.TransactionType.INCOME, date=d
            ).aggregate(total=Sum('amount'))['total'] or 0
            day_expense = Transaction.objects.filter(
                user=user, transaction_type=Transaction.TransactionType.EXPENSE, date=d
            ).aggregate(total=Sum('amount'))['total'] or 0
            cashflow.append({
                'date': str(d),
                'income': float(day_income),
                'expense': float(day_expense),
            })

        # === Expense by category ===
        colors = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981',
                  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#06B6D4']
        expense_cats = (
            Transaction.objects.filter(
                user=user,
                transaction_type=Transaction.TransactionType.EXPENSE,
                category__isnull=False,
                date__gte=today.replace(day=1),
            )
            .values('category__name')
            .annotate(amount=Sum('amount'))
            .order_by('-amount')[:10]
        )
        expense_by_category = [
            {'category': e['category__name'], 'amount': float(e['amount']),
             'color': colors[i % len(colors)]}
            for i, e in enumerate(expense_cats)
        ]

        # === Income by category ===
        income_cats = (
            Transaction.objects.filter(
                user=user,
                transaction_type=Transaction.TransactionType.INCOME,
                category__isnull=False,
                date__gte=today.replace(day=1),
            )
            .values('category__name')
            .annotate(amount=Sum('amount'))
            .order_by('-amount')[:10]
        )
        income_by_category = [
            {'category': e['category__name'], 'amount': float(e['amount']),
             'color': colors[i % len(colors)]}
            for i, e in enumerate(income_cats)
        ]

        # === Monthly totals (last 12 months) ===
        months = 12
        start_year = today.year - (months // 12)
        start_month = today.month - (months % 12)
        if start_month <= 0:
            start_month += 12
            start_year -= 1
        start_date = today.replace(year=start_year, month=start_month, day=1)

        income_by_month = dict(
            Transaction.objects.filter(
                user=user, transaction_type=Transaction.TransactionType.INCOME,
                date__gte=start_date,
            ).annotate(month=TruncMonth('date'))
            .values('month').annotate(total=Sum('amount'))
            .values_list('month', 'total')
        )
        expense_by_month = dict(
            Transaction.objects.filter(
                user=user, transaction_type=Transaction.TransactionType.EXPENSE,
                date__gte=start_date,
            ).annotate(month=TruncMonth('date'))
            .values('month').annotate(total=Sum('amount'))
            .values_list('month', 'total')
        )

        monthly_totals = []
        for i in range(months):
            m = start_month + i
            y = start_year + (m - 1) // 12
            m = ((m - 1) % 12) + 1
            from datetime import date as date_cls
            month_key = date_cls(y, m, 1)
            inc = float(income_by_month.get(month_key, 0) or 0)
            exp = float(expense_by_month.get(month_key, 0) or 0)
            monthly_totals.append({
                'month': month_key.strftime('%Y-%m'),
                'income': inc,
                'expense': exp,
                'savings': inc - exp,
            })

        # === Net worth trend ===
        total_balance = float(
            Account.objects.filter(user=user, is_active=True)
            .aggregate(total=Sum('balance'))['total'] or 0
        )
        net_worth_trend = [{'date': str(today), 'amount': total_balance}]

        return Response({
            'cashflow': cashflow,
            'expense_by_category': expense_by_category,
            'income_by_category': income_by_category,
            'monthly_totals': monthly_totals,
            'net_worth_trend': net_worth_trend,
        })
