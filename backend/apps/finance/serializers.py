from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import Account, Budget, Category, Goal, Transaction


class AccountSerializer(serializers.ModelSerializer):
    """Сериализатор финансового счёта с валидацией отрицательного баланса."""

    class Meta:
        model = Account
        fields = [
            'id', 'name', 'account_type', 'currency', 'balance',
            'icon', 'color', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        """Проверяет, что отрицательный баланс допустим только для кредитных счетов."""
        balance = attrs.get('balance')
        account_type = attrs.get('account_type')
        if account_type is None and self.instance:
            account_type = self.instance.account_type
        if balance is not None and balance < 0 and account_type != 'credit':
            raise serializers.ValidationError(
                {'balance': 'Balance cannot be negative for non-credit accounts.'}
            )
        return attrs


class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор категории транзакций с вложенными подкатегориями."""
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'icon', 'color', 'category_type',
            'is_default', 'parent', 'subcategories', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def get_subcategories(self, obj):
        """Возвращает список подкатегорий (id и name)."""
        children = obj.subcategories.all()
        return [
            {'id': str(child.id), 'name': child.name}
            for child in children
        ]


class GoalSerializer(serializers.ModelSerializer):
    """Сериализатор финансовой цели с вычисляемым прогрессом."""
    progress = serializers.ReadOnlyField()

    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'target_amount', 'current_amount', 'currency',
            'deadline', 'icon', 'color', 'is_completed', 'progress',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_target_amount(self, value):
        """Проверяет, что целевая сумма больше нуля."""
        if value <= 0:
            raise serializers.ValidationError('Target amount must be greater than zero.')
        return value


class TransactionSerializer(serializers.ModelSerializer):
    """Сериализатор транзакции с валидацией владельца счёта, категории и цели."""
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True, default=None)

    class Meta:
        model = Transaction
        fields = [
            'id', 'account', 'account_name', 'category', 'category_name',
            'amount', 'currency', 'transaction_type', 'date', 'note',
            'is_recurring', 'recurrence_rule', 'linked_goal',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        """Проверяет, что сумма транзакции больше нуля."""
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than zero.')
        return value

    def validate(self, attrs):
        """Проверяет принадлежность счёта, категории и цели текущему пользователю."""
        user = self.context['request'].user
        account = attrs.get('account')
        if account and account.user != user:
            raise serializers.ValidationError({'account': 'Account not found.'})
        category = attrs.get('category')
        if category and category.user is not None and category.user != user:
            raise serializers.ValidationError({'category': 'Category not found.'})
        linked_goal = attrs.get('linked_goal')
        if linked_goal and linked_goal.user != user:
            raise serializers.ValidationError({'linked_goal': 'Goal not found.'})
        return attrs


class BudgetSerializer(serializers.ModelSerializer):
    """Сериализатор бюджета с вычислением потраченной суммы и остатка."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    spent_amount = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = [
            'id', 'category', 'category_name', 'amount', 'period',
            'start_date', 'end_date', 'spent_amount', 'remaining',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_amount(self, value):
        """Проверяет, что сумма бюджета больше нуля."""
        if value <= 0:
            raise serializers.ValidationError('Budget amount must be greater than zero.')
        return value

    def validate(self, attrs):
        """Проверяет корректность дат и принадлежность категории пользователю."""
        start_date = attrs.get('start_date') or (self.instance and self.instance.start_date)
        end_date = attrs.get('end_date') or (self.instance and self.instance.end_date)
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError(
                {'end_date': 'End date must be after start date.'}
            )
        user = self.context['request'].user
        category = attrs.get('category')
        if category and category.user is not None and category.user != user:
            raise serializers.ValidationError({'category': 'Category not found.'})
        return attrs

    def get_spent_amount(self, obj):
        """Возвращает потраченную сумму из аннотации или через запрос к транзакциям."""
        if hasattr(obj, 'spent_amount') and obj.spent_amount is not None:
            return str(obj.spent_amount)

        filters = {
            'user': obj.user,
            'category': obj.category,
            'transaction_type': Transaction.TransactionType.EXPENSE,
            'date__gte': obj.start_date,
        }
        if obj.end_date:
            filters['date__lte'] = obj.end_date

        total = (
            Transaction.objects
            .filter(**filters)
            .aggregate(total=Sum('amount'))['total']
        ) or Decimal('0.00')
        return str(total)

    def get_remaining(self, obj):
        """Вычисляет остаток бюджета (лимит минус потрачено)."""
        spent = Decimal(self.get_spent_amount(obj))
        return str(obj.amount - spent)
