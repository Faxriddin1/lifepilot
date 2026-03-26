from django.urls import path

from .views import submit_ai_feedback

urlpatterns = [
    path("feedback/", submit_ai_feedback, name="ai-feedback"),
]
