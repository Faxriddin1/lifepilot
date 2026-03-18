import django_filters

from .models import Task


class TaskFilter(django_filters.FilterSet):
    """Фильтр задач по статусу, приоритету, проекту, дедлайну и поиску по названию."""
    status = django_filters.ChoiceFilter(choices=Task.Status.choices)
    priority = django_filters.ChoiceFilter(choices=Task.Priority.choices)
    project = django_filters.UUIDFilter(field_name='project_id')
    deadline_from = django_filters.DateTimeFilter(field_name='deadline', lookup_expr='gte')
    deadline_to = django_filters.DateTimeFilter(field_name='deadline', lookup_expr='lte')
    has_deadline = django_filters.BooleanFilter(field_name='deadline', lookup_expr='isnull', exclude=True)
    search = django_filters.CharFilter(field_name='title', lookup_expr='icontains')

    class Meta:
        model = Task
        fields = ['status', 'priority', 'project', 'deadline_from', 'deadline_to', 'has_deadline', 'search']
