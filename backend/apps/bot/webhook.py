"""Django view for receiving Telegram webhook updates."""

import json
import logging
import asyncio

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

logger = logging.getLogger("bot")


@csrf_exempt
@require_POST
def telegram_webhook(request, token: str):
    """Receive Telegram updates via webhook. Always returns 200."""
    import os
    expected_token = os.environ.get("BOT_TOKEN", "")
    if token != expected_token:
        return JsonResponse({"ok": False}, status=403)

    try:
        update_data = json.loads(request.body)
        import sys
        print(f"[BOT] Webhook update_id={update_data.get('update_id')}", file=sys.stderr, flush=True)

        from apps.bot.bot import process_update
        asyncio.run(process_update(update_data))

        print("[BOT] Webhook OK", file=sys.stderr, flush=True)
    except Exception as e:
        import sys, traceback
        print(f"[BOT] ERROR: {e}", file=sys.stderr, flush=True)
        traceback.print_exc(file=sys.stderr)

    return JsonResponse({"ok": True})
