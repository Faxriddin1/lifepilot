"""
Drop the legacy bot_telegram_users table (created by SQLAlchemy async bot, not managed by Django).
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_user_date_format_user_number_format_user_week_start"),
    ]

    operations = [
        migrations.RunSQL(
            sql="DROP TABLE IF EXISTS bot_telegram_users;",
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
