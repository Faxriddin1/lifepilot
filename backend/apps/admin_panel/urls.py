from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'admin_panel'

router = DefaultRouter()
router.register('users', views.AdminUserViewSet, basename='admin-users')
router.register('tasks', views.AdminTaskViewSet, basename='admin-tasks')
router.register('projects', views.AdminProjectViewSet, basename='admin-projects')
router.register('accounts', views.AdminAccountViewSet, basename='admin-accounts')
router.register('categories', views.AdminCategoryViewSet, basename='admin-categories')
router.register('transactions', views.AdminTransactionViewSet, basename='admin-transactions')
router.register('budgets', views.AdminBudgetViewSet, basename='admin-budgets')
router.register('goals', views.AdminGoalViewSet, basename='admin-goals')
router.register('focus-sessions', views.AdminFocusSessionViewSet, basename='admin-focus-sessions')
router.register('habits', views.AdminHabitViewSet, basename='admin-habits')
router.register('daily-logs', views.AdminDailyLogViewSet, basename='admin-daily-logs')

urlpatterns = [
    path('dashboard/', views.AdminDashboardView.as_view(), name='admin-dashboard'),
    path('', include(router.urls)),
]
