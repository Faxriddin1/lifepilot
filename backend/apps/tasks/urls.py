from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'tasks'

router = DefaultRouter()
router.register('projects', views.ProjectViewSet, basename='project')
router.register('items', views.TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
