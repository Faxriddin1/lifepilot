"""
Web notification channel helpers.
"""

from apps.notifications.models import Notification


def get_unread_count(user) -> int:
    """Return the number of unread web notifications for the given user.

    A web notification is considered unread when its read_at field is None.

    Args:
        user: AUTH_USER_MODEL instance.

    Returns:
        Integer count of unread notifications.
    """
    return Notification.objects.filter(
        user=user,
        channel="web",
        read_at__isnull=True,
    ).count()
