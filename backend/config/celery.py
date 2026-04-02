import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('config')
app.config_from_object('django.conf:settings', namespace='CELERY')

# Explicitly discover tasks from these packages
app.autodiscover_tasks([
    'apps.learning',
    'apps.notifications',
])


@app.on_after_configure.connect
def setup_tasks(sender, **kwargs):
    """Force-import task modules after Celery is configured."""
    try:
        import apps.learning.tasks  # noqa
        import apps.notifications.tasks  # noqa
    except Exception:
        pass
