import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Account(models.Model):
    """Финансовый счёт пользователя.

    Поддерживает типы: наличные, банковский счёт, кредитная карта.
    """

    class AccountType(models.TextChoices):
        """Тип финансового счёта."""
        CASH = 'cash', 'Cash'
        BANK = 'bank', 'Bank'
        CREDIT = 'credit', 'Credit'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='accounts',
    )
    name = models.CharField(max_length=255)
    account_type = models.CharField(
        max_length=10, choices=AccountType.choices, default=AccountType.BANK
    )
    currency = models.CharField(max_length=3, default='USD')
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # Текущий баланс
    icon = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=7, default='#3B82F6')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Мета-настройки модели счёта."""
        ordering = ['-created_at']
        verbose_name = 'account'
        verbose_name_plural = 'accounts'

    def __str__(self):
        return f'{self.name} ({self.currency})'


class Category(models.Model):
    """Категория транзакции (доход или расход).

    Поддерживает подкатегории и категории по умолчанию (user=null).
    """

    class CategoryType(models.TextChoices):
        """Тип категории: доход или расход."""
        INCOME = 'income', 'Income'
        EXPENSE = 'expense', 'Expense'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(  # null — системная категория по умолчанию
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='categories',
    )
    name = models.CharField(max_length=255)
    icon = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=7, default='#8B5CF6')
    category_type = models.CharField(
        max_length=10, choices=CategoryType.choices
    )
    is_default = models.BooleanField(default=False)  # Категория по умолчанию (системная)
    parent = models.ForeignKey(  # Родительская категория для иерархии
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Мета-настройки модели категории."""
        ordering = ['name']
        verbose_name = 'category'
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class Goal(models.Model):
    """Финансовая цель пользователя.

    Отслеживает прогресс накопления от current_amount к target_amount.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='goals',
    )
    name = models.CharField(max_length=255)
    target_amount = models.DecimalField(max_digits=15, decimal_places=2)  # Целевая сумма
    current_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)  # Накоплено
    currency = models.CharField(max_length=3, default='USD')
    deadline = models.DateField(null=True, blank=True)
    icon = models.CharField(max_length=50, blank=True, default='')
    color = models.CharField(max_length=7, default='#F59E0B')
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Мета-настройки модели финансовой цели."""
        ordering = ['-created_at']
        verbose_name = 'goal'
        verbose_name_plural = 'goals'

    def __str__(self):
        return self.name

    @property
    def progress(self):
        """Вернуть процент достижения цели (0–100)."""
        if self.target_amount == 0:
            return 0
        return round(float(self.current_amount / self.target_amount) * 100, 2)


class Transaction(models.Model):
    """Финансовая транзакция.

    Доход, расход или перевод между счетами. Может быть привязана к цели.
    """

    class TransactionType(models.TextChoices):
        """Тип транзакции: доход, расход или перевод."""
        INCOME = 'income', 'Income'
        EXPENSE = 'expense', 'Expense'
        TRANSFER = 'transfer', 'Transfer'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='transactions',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions',
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    transaction_type = models.CharField(
        max_length=10, choices=TransactionType.choices
    )
    date = models.DateField()
    note = models.CharField(max_length=500, blank=True, default='')
    is_recurring = models.BooleanField(default=False)  # Регулярная транзакция
    recurrence_rule = models.JSONField(null=True, blank=True)  # Правило повторения
    linked_goal = models.ForeignKey(  # Связь с финансовой целью
        Goal,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        """Мета-настройки модели транзакции."""
        ordering = ['-date', '-created_at']
        verbose_name = 'transaction'
        verbose_name_plural = 'transactions'

    def __str__(self):
        return f'{self.transaction_type} {self.amount} {self.currency}'


class Budget(models.Model):
    """Бюджет по категории расходов.

    Лимит трат за период (неделя или месяц) по конкретной категории.
    """

    class Period(models.TextChoices):
        """Период бюджетирования: месячный или недельный."""
        MONTHLY = 'monthly', 'Monthly'
        WEEKLY = 'weekly', 'Weekly'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='budgets',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='budgets',
    )
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    period = models.CharField(
        max_length=10, choices=Period.choices, default=Period.MONTHLY
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        """Мета-настройки модели бюджета."""
        ordering = ['-start_date']
        verbose_name = 'budget'
        verbose_name_plural = 'budgets'

    def clean(self):
        """Проверить, что дата окончания позже даты начала."""
        if self.end_date and self.start_date and self.end_date <= self.start_date:
            raise ValidationError({
                'end_date': 'End date must be after start date.',
            })

    def __str__(self):
        return f'{self.category.name} – {self.amount} ({self.period})'
