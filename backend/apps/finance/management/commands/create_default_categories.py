from django.core.management.base import BaseCommand

from apps.finance.models import Category


EXPENSE_CATEGORIES = [
    {'name': 'Food & Dining', 'icon': 'utensils', 'color': '#EF4444'},
    {'name': 'Transportation', 'icon': 'car', 'color': '#F97316'},
    {'name': 'Housing', 'icon': 'home', 'color': '#8B5CF6'},
    {'name': 'Utilities', 'icon': 'zap', 'color': '#EAB308'},
    {'name': 'Healthcare', 'icon': 'heart-pulse', 'color': '#EC4899'},
    {'name': 'Entertainment', 'icon': 'gamepad-2', 'color': '#06B6D4'},
    {'name': 'Shopping', 'icon': 'shopping-bag', 'color': '#F43F5E'},
    {'name': 'Education', 'icon': 'graduation-cap', 'color': '#6366F1'},
    {'name': 'Personal Care', 'icon': 'sparkles', 'color': '#D946EF'},
    {'name': 'Subscriptions', 'icon': 'repeat', 'color': '#0EA5E9'},
    {'name': 'Insurance', 'icon': 'shield', 'color': '#14B8A6'},
    {'name': 'Gifts & Donations', 'icon': 'gift', 'color': '#F59E0B'},
    {'name': 'Travel', 'icon': 'plane', 'color': '#3B82F6'},
    {'name': 'Other Expense', 'icon': 'circle-dot', 'color': '#6B7280'},
]

INCOME_CATEGORIES = [
    {'name': 'Salary', 'icon': 'banknote', 'color': '#10B981'},
    {'name': 'Freelance', 'icon': 'laptop', 'color': '#22C55E'},
    {'name': 'Investments', 'icon': 'trending-up', 'color': '#059669'},
    {'name': 'Business', 'icon': 'briefcase', 'color': '#34D399'},
    {'name': 'Rental Income', 'icon': 'building', 'color': '#6EE7B7'},
    {'name': 'Refunds', 'icon': 'rotate-ccw', 'color': '#A7F3D0'},
    {'name': 'Other Income', 'icon': 'circle-dot', 'color': '#4ADE80'},
]


class Command(BaseCommand):
    help = 'Create default expense and income categories'

    def handle(self, *args, **options):
        created_count = 0

        for cat_data in EXPENSE_CATEGORIES:
            _, created = Category.objects.get_or_create(
                name=cat_data['name'],
                user=None,
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'category_type': Category.CategoryType.EXPENSE,
                    'is_default': True,
                },
            )
            if created:
                created_count += 1

        for cat_data in INCOME_CATEGORIES:
            _, created = Category.objects.get_or_create(
                name=cat_data['name'],
                user=None,
                defaults={
                    'icon': cat_data['icon'],
                    'color': cat_data['color'],
                    'category_type': Category.CategoryType.INCOME,
                    'is_default': True,
                },
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} default categories.')
        )
