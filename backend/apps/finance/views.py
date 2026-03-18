import csv
import io
from decimal import Decimal

from django.db import transaction as db_transaction
from django.db.models import F, Q, Sum, DecimalField, Value
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Account, Budget, Category, Goal, Transaction
from .serializers import (
    AccountSerializer,
    BudgetSerializer,
    CategorySerializer,
    GoalSerializer,
    TransactionSerializer,
)


class AccountViewSet(viewsets.ModelViewSet):
    """CRUD операции с финансовыми счетами пользователя."""
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает счета текущего пользователя."""
        return Account.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD операции с категориями транзакций (пользовательские + глобальные)."""
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает пользовательские категории и глобальные (без владельца)."""
        return (
            Category.objects
            .filter(
                user__isnull=True
            ) | Category.objects.filter(
                user=self.request.user
            )
        ).select_related('parent').prefetch_related('subcategories')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalViewSet(viewsets.ModelViewSet):
    """CRUD операции с финансовыми целями пользователя."""
    serializer_class = GoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает финансовые цели текущего пользователя."""
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        """Пополнение финансовой цели на указанную сумму."""
        goal = self.get_object()

        amount = request.data.get('amount')
        if not amount:
            return Response(
                {'detail': 'Укажите сумму пополнения.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                raise ValueError()
        except (ValueError, TypeError):
            return Response(
                {'detail': 'Сумма должна быть положительным числом.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if goal.is_completed:
            return Response(
                {'detail': 'Цель уже достигнута.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        goal.current_amount = F('current_amount') + amount
        goal.save(update_fields=['current_amount', 'updated_at'])
        goal.refresh_from_db()

        if goal.current_amount >= goal.target_amount:
            goal.is_completed = True
            goal.save(update_fields=['is_completed'])

        from .serializers import GoalSerializer
        return Response(GoalSerializer(goal).data)


class TransactionViewSet(viewsets.ModelViewSet):
    """CRUD операции с транзакциями. Автоматически обновляет баланс счёта и прогресс цели."""
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['transaction_type', 'account', 'category', 'date']
    search_fields = ['note']
    ordering_fields = ['date', 'amount', 'created_at']

    def get_queryset(self):
        """Возвращает транзакции пользователя с подгрузкой счёта, категории и цели."""
        return (
            Transaction.objects
            .filter(user=self.request.user)
            .select_related('account', 'category', 'linked_goal')
        )

    def perform_create(self, serializer):
        """Сохраняет транзакцию и обновляет баланс счёта."""
        instance = serializer.save(user=self.request.user)
        self._update_account_balance(instance)

    def perform_update(self, serializer):
        """Откатывает старый баланс и применяет новый при обновлении транзакции."""
        old_instance = self.get_object()
        self._reverse_account_balance(old_instance)
        instance = serializer.save()
        self._update_account_balance(instance)

    def perform_destroy(self, instance):
        """Откатывает баланс счёта и удаляет транзакцию."""
        self._reverse_account_balance(instance)
        instance.delete()

    def _update_account_balance(self, txn):
        """Корректирует баланс счёта и прогресс цели в зависимости от типа транзакции."""
        with db_transaction.atomic():
            # Lock the account row to prevent race conditions
            Account.objects.select_for_update().get(pk=txn.account_id)

            if txn.transaction_type == Transaction.TransactionType.INCOME:
                Account.objects.filter(pk=txn.account_id).update(
                    balance=F('balance') + txn.amount
                )
            elif txn.transaction_type == Transaction.TransactionType.EXPENSE:
                Account.objects.filter(pk=txn.account_id).update(
                    balance=F('balance') - txn.amount
                )

            # Update linked goal
            if txn.linked_goal and txn.transaction_type == Transaction.TransactionType.INCOME:
                goal = Goal.objects.select_for_update().get(pk=txn.linked_goal_id)
                new_amount = goal.current_amount + txn.amount
                Goal.objects.filter(pk=txn.linked_goal_id).update(
                    current_amount=F('current_amount') + txn.amount,
                    is_completed=new_amount >= goal.target_amount,
                )

    def _reverse_account_balance(self, txn):
        """Откатывает влияние транзакции на баланс счёта."""
        with db_transaction.atomic():
            # Lock the account row to prevent race conditions
            Account.objects.select_for_update().get(pk=txn.account_id)

            if txn.transaction_type == Transaction.TransactionType.INCOME:
                Account.objects.filter(pk=txn.account_id).update(
                    balance=F('balance') - txn.amount
                )
            elif txn.transaction_type == Transaction.TransactionType.EXPENSE:
                Account.objects.filter(pk=txn.account_id).update(
                    balance=F('balance') + txn.amount
                )

    @action(detail=False, methods=['post'], url_path='import-csv', parser_classes=[MultiPartParser])
    def import_csv(self, request):
        """Импорт транзакций из CSV-файла.

        Ожидаемые колонки: date, amount, type (income/expense), category, note, account.
        """
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response(
                {'detail': 'CSV file is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not csv_file.name.endswith('.csv'):
            return Response(
                {'detail': 'File must be a CSV.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decoded = csv_file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded))

        created_count = 0
        errors = []

        user_accounts = {a.name.lower(): a for a in Account.objects.filter(user=request.user)}
        user_categories = {
            c.name.lower(): c
            for c in Category.objects.filter(user=request.user) | Category.objects.filter(user__isnull=True)
        }

        with db_transaction.atomic():
            for row_num, row in enumerate(reader, start=2):
                try:
                    account_name = row.get('account', '').strip().lower()
                    category_name = row.get('category', '').strip().lower()
                    account = user_accounts.get(account_name)
                    category = user_categories.get(category_name)

                    if not account:
                        errors.append(f'Row {row_num}: Account "{row.get("account")}" not found.')
                        continue

                    txn = Transaction.objects.create(
                        user=request.user,
                        account=account,
                        category=category,
                        amount=abs(float(row['amount'])),
                        transaction_type=row.get('type', 'expense').strip().lower(),
                        date=row['date'].strip(),
                        note=row.get('note', '').strip()[:500],
                        currency=account.currency,
                    )
                    self._update_account_balance(txn)
                    created_count += 1
                except Exception as e:
                    errors.append(f'Row {row_num}: {str(e)}')

        return Response({
            'created': created_count,
            'errors': errors,
        })


class BudgetViewSet(viewsets.ModelViewSet):
    """CRUD операции с бюджетами. Аннотирует потраченную сумму по категории."""
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Возвращает бюджеты пользователя с аннотацией потраченной суммы."""
        from django.db.models import Subquery, OuterRef
        spent_subquery = (
            Transaction.objects
            .filter(
                user=OuterRef('user'),
                category=OuterRef('category'),
                transaction_type=Transaction.TransactionType.EXPENSE,
                date__gte=OuterRef('start_date'),
            )
            .order_by()
            .values('user')
            .annotate(total=Sum('amount'))
            .values('total')
        )
        return (
            Budget.objects
            .filter(user=self.request.user)
            .select_related('category')
            .annotate(
                spent_amount=Coalesce(
                    Subquery(spent_subquery, output_field=DecimalField()),
                    Value(Decimal('0.00')),
                )
            )
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
