from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.notifications.channels.web import get_unread_count
from apps.notifications.models import Notification, NotificationPreference
from apps.notifications.serializers import (
    NotificationPreferenceSerializer,
    NotificationSerializer,
)


class NotificationViewSet(ReadOnlyModelViewSet):
    """ViewSet for the authenticated user's web notifications.

    Provides list, retrieve, unread_count, mark_read, and mark_all_read actions.
    """

    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Return the 50 most-recent web notifications for the current user."""
        return (
            Notification.objects.filter(
                user=self.request.user,
                channel="web",
            )
            .order_by("-created_at")[:50]
        )

    # GET /notifications/unread_count/
    @action(detail=False, methods=["get"], url_path="unread_count")
    def unread_count(self, request):
        """Return the number of unread web notifications."""
        count = get_unread_count(request.user)
        return Response({"unread_count": count})

    # POST /notifications/{id}/mark_read/
    @action(detail=True, methods=["post"], url_path="mark_read")
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notification = self.get_object()
        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at"])
        serializer = self.get_serializer(notification)
        return Response(serializer.data)

    # POST /notifications/mark_all_read/
    @action(detail=False, methods=["post"], url_path="mark_all_read")
    def mark_all_read(self, request):
        """Mark all unread web notifications as read for the current user."""
        updated = Notification.objects.filter(
            user=request.user,
            channel="web",
            read_at__isnull=True,
        ).update(read_at=timezone.now())
        return Response({"marked_read": updated}, status=status.HTTP_200_OK)


class NotificationPreferenceView(RetrieveUpdateAPIView):
    """Retrieve or update the notification preferences for the current user."""

    serializer_class = NotificationPreferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """Get or create the preference record for the authenticated user."""
        prefs, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        self.check_object_permissions(self.request, prefs)
        return prefs
