from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import LearningGoalViewSet, LearningTaskViewSet

router = DefaultRouter()
router.register("goals", LearningGoalViewSet, basename="learning-goal")
router.register("tasks", LearningTaskViewSet, basename="learning-task")

urlpatterns = [
    path("", include(router.urls)),
]
