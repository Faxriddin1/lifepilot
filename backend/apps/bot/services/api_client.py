"""HTTP client for calling Django API from the bot (used for CRUD via DRF)."""

import logging

import httpx
from django.core.cache import cache

logger = logging.getLogger("bot")

API_BASE_URL = "http://127.0.0.1:8000/api/v1"


class BotAPIClient:
    """Async HTTP client with JWT auth and auto-refresh."""

    def __init__(self, telegram_id: int):
        self.telegram_id = telegram_id
        self._tokens = None

    def _get_tokens(self) -> dict | None:
        if self._tokens:
            return self._tokens
        self._tokens = cache.get(f"bot:jwt:{self.telegram_id}")
        return self._tokens

    def _get_headers(self) -> dict:
        tokens = self._get_tokens()
        if not tokens:
            return {}
        return {"Authorization": f"Bearer {tokens['access']}"}

    async def request(self, method: str, path: str, **kwargs) -> dict | None:
        headers = self._get_headers()
        async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=30) as client:
            resp = await client.request(method, path, headers=headers, **kwargs)

            if resp.status_code == 401:
                if await self._refresh_token():
                    headers = self._get_headers()
                    resp = await client.request(method, path, headers=headers, **kwargs)

            if resp.status_code >= 400:
                logger.warning("API %s %s: %s", method, path, resp.status_code)
                return None

            return resp.json()

    async def get(self, path: str, **kwargs):
        return await self.request("GET", path, **kwargs)

    async def post(self, path: str, **kwargs):
        return await self.request("POST", path, **kwargs)

    async def _refresh_token(self) -> bool:
        tokens = self._get_tokens()
        if not tokens or "refresh" not in tokens:
            return False
        async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=10) as client:
            resp = await client.post("/auth/token/refresh/", json={"refresh": tokens["refresh"]})
            if resp.status_code == 200:
                data = resp.json()
                tokens["access"] = data["access"]
                cache.set(f"bot:jwt:{self.telegram_id}", tokens, 60 * 60 * 24 * 7)
                self._tokens = tokens
                return True
        return False

    @property
    def is_authenticated(self) -> bool:
        return cache.get(f"bot:jwt:{self.telegram_id}") is not None
