from django.urls import path

from . import views

app_name = 'analytics'

urlpatterns = [
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('productivity/', views.ProductivityAnalyticsView.as_view(), name='productivity'),
    path('finance/', views.FinanceAnalyticsView.as_view(), name='finance'),
]
