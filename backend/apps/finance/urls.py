from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

app_name = 'finance'

router = DefaultRouter()
router.register('accounts', views.AccountViewSet, basename='account')
router.register('categories', views.CategoryViewSet, basename='category')
router.register('transactions', views.TransactionViewSet, basename='transaction')
router.register('budgets', views.BudgetViewSet, basename='budget')
router.register('goals', views.GoalViewSet, basename='goal')

urlpatterns = [
    path('', include(router.urls)),
]
