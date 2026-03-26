"""Management command to run bot in polling mode (development)."""

import asyncio

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Run Telegram bot in polling mode (development)"

    def handle(self, *args, **options):
        from apps.bot.bot import bot, dp

        if not bot:
            self.stderr.write("BOT_TOKEN not set. Cannot start bot.")
            return

        async def _run():
            await bot.delete_webhook()
            self.stdout.write(self.style.SUCCESS("Starting bot in polling mode..."))
            await dp.start_polling(bot)

        asyncio.run(_run())
