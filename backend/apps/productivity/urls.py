from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'productivity'

router = DefaultRouter()
router.register('focus-sessions', views.FocusSessionViewSet, basename='focus-session')
router.register('habits', views.HabitViewSet, basename='habit')
router.register('habit-logs', views.HabitLogViewSet, basename='habit-log')
router.register('daily-logs', views.DailyLogViewSet, basename='daily-log')

urlpatterns = [
    path('', include(router.urls)),
]
