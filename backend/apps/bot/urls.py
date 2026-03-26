from django.urls import path
from .webhook import telegram_webhook

urlpatterns = [
    path("webhook/<str:token>/", telegram_webhook, name="telegram-webhook"),
]
