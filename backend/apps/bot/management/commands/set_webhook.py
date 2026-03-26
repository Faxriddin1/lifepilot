"""Management command to set Telegram webhook URL."""

import asyncio

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Set Telegram webhook URL"

    def add_arguments(self, parser):
        parser.add_argument("--url", type=str, required=True, help="Webhook base URL (e.g. https://lifepilot.uz)")

    def handle(self, *args, **options):
        import os
        from apps.bot.bot import bot

        if not bot:
            self.stderr.write("BOT_TOKEN not set.")
            return

        token = os.environ.get("BOT_TOKEN", "")
        webhook_url = f"{options['url'].rstrip('/')}/bot/webhook/{token}/"

        async def _set():
            await bot.set_webhook(webhook_url)
            self.stdout.write(self.style.SUCCESS(f"Webhook set: {webhook_url}"))

        asyncio.run(_set())
