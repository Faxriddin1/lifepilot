from django.contrib import admin

from .models import Account, Budget, Category, Goal, Transaction


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'account_type', 'balance', 'currency', 'is_active')
    list_filter = ('account_type', 'currency', 'is_active')
    search_fields = ('name', 'user__email')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'category_type', 'user', 'parent')
    list_filter = ('category_type',)
    search_fields = ('name',)


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'amount', 'account', 'category', 'date')
    list_filter = ('transaction_type', 'date')
    search_fields = ('note', 'user__email')
    raw_id_fields = ('user', 'account', 'category')
    ordering = ('-date', '-created_at')


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'amount', 'period', 'start_date', 'end_date')
    list_filter = ('period',)
    search_fields = ('user__email',)


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'target_amount', 'current_amount', 'deadline', 'is_completed')
    list_filter = ('is_completed',)
    search_fields = ('name', 'user__email')
