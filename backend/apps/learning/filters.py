import django_filters

from .models import LearningGoal


class LearningGoalFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(field_name="title", lookup_expr="icontains")

    class Meta:
        model = LearningGoal
        fields = ["status", "difficulty_level"]
