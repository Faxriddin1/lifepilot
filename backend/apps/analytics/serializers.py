from rest_framework import serializers


class FinanceStatsSerializer(serializers.Serializer):
    """Сериализатор финансовой аналитики: тренды доходов/расходов и топ категорий."""
    income_trend = serializers.ListField(
        child=serializers.DictField(), help_text='List of {month, total} objects'
    )
    expense_trend = serializers.ListField(
        child=serializers.DictField(), help_text='List of {month, total} objects'
    )
    top_expense_categories = serializers.ListField(
        child=serializers.DictField(), help_text='List of {category, total} objects'
    )
    top_income_categories = serializers.ListField(
        child=serializers.DictField(), help_text='List of {category, total} objects'
    )
