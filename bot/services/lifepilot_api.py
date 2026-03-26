from datetime import date
from typing import Any

import aiohttp
import structlog

from config import settings

logger = structlog.get_logger()


class LifePilotAPI:
    def __init__(self):
        self.base_url = settings.LIFEPILOT_API_URL

    def _headers(self, token: str) -> dict:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    async def _request(
        self, method: str, path: str, token: str = "", json: dict = None, params: dict = None
    ) -> dict | list | None:
        url = f"{self.base_url}{path}"
        headers = self._headers(token) if token else {"Content-Type": "application/json"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(
                    method, url, headers=headers, json=json, params=params, timeout=aiohttp.ClientTimeout(total=15)
                ) as resp:
                    if resp.status in (200, 201):
                        return await resp.json()
                    elif resp.status == 401:
                        raise TokenExpiredError("Token expired")
                    elif resp.status == 400:
                        error = await resp.json()
                        raise ValidationError(error)
                    else:
                        logger.error("api_error", status=resp.status, path=path)
                        return None
        except aiohttp.ClientError as e:
            logger.error("api_connection_error", error=str(e), path=path)
            return None

    async def _get(self, path: str, token: str, params: dict = None) -> Any:
        return await self._request("GET", path, token, params=params)

    async def _post(self, path: str, data: dict, token: str) -> Any:
        return await self._request("POST", path, token, json=data)

    async def _patch(self, path: str, data: dict, token: str) -> Any:
        return await self._request("PATCH", path, token, json=data)

    async def _delete(self, path: str, token: str) -> Any:
        return await self._request("DELETE", path, token)

    # === Auth ===

    async def login(self, email: str, password: str) -> dict | None:
        return await self._request("POST", "/auth/login/", json={"email": email, "password": password})

    async def refresh_token(self, refresh: str) -> dict | None:
        result = await self._request("POST", "/auth/token/refresh/", json={"refresh": refresh})
        return result

    async def verify_telegram_code(self, code: str, telegram_id: int) -> dict | None:
        return await self._request(
            "POST", "/auth/telegram/verify-code/",
            json={"code": code, "telegram_id": telegram_id},
        )

    async def get_profile(self, token: str) -> dict | None:
        return await self._get("/auth/me/", token)

    # === Tasks ===

    async def create_task(self, data: dict, token: str) -> dict | None:
        return await self._post("/tasks/items/", data, token)

    async def list_tasks(self, token: str, params: dict = None) -> dict | None:
        return await self._get("/tasks/items/", token, params)

    async def update_task(self, task_id: str, data: dict, token: str) -> dict | None:
        return await self._patch(f"/tasks/items/{task_id}/", data, token)

    async def delete_task(self, task_id: str, token: str) -> dict | None:
        return await self._delete(f"/tasks/items/{task_id}/", token)

    async def get_projects(self, token: str) -> list | None:
        result = await self._get("/tasks/projects/", token)
        if isinstance(result, dict):
            return result.get("results", [])
        return result or []

    # === Finance ===

    async def create_transaction(self, data: dict, token: str) -> dict | None:
        return await self._post("/finance/transactions/", data, token)

    async def get_accounts(self, token: str) -> list:
        result = await self._get("/finance/accounts/", token)
        if isinstance(result, dict):
            return result.get("results", [])
        return result or []

    async def get_categories(self, token: str, cat_type: str = None) -> list:
        params = {"type": cat_type} if cat_type else None
        result = await self._get("/finance/categories/", token, params)
        if isinstance(result, dict):
            return result.get("results", [])
        return result or []

    async def get_budgets(self, token: str) -> list:
        result = await self._get("/finance/budgets/", token)
        if isinstance(result, dict):
            return result.get("results", [])
        return result or []

    async def get_goals(self, token: str) -> list:
        result = await self._get("/finance/goals/", token)
        if isinstance(result, dict):
            return result.get("results", [])
        return result or []

    async def contribute_to_goal(self, goal_id: str, amount: float, token: str) -> dict | None:
        return await self._post(f"/finance/goals/{goal_id}/contribute/", {"amount": amount}, token)

    # === Productivity ===

    async def start_focus_session(self, data: dict, token: str) -> dict | None:
        return await self._post("/productivity/focus-sessions/", data, token)

    async def stop_focus_session(self, token: str) -> dict:
        sessions = await self._get("/productivity/focus-sessions/", token, params={"status": "active"})
        results = sessions.get("results", []) if isinstance(sessions, dict) else []
        if not results:
            return {"error": "Нет активной сессии"}
        active = results[0]
        from datetime import datetime as dt
        result = await self._patch(f"/productivity/focus-sessions/{active['id']}/", {
            "status": "completed",
            "end_time": dt.utcnow().isoformat(),
        }, token)
        return result or {"error": "Не удалось остановить сессию"}

    async def toggle_habit(self, data: dict, token: str) -> dict | None:
        return await self._post("/productivity/habit-logs/toggle/", data, token)

    async def get_habits(self, token: str) -> list:
        result = await self._get("/productivity/habits/", token)
        if isinstance(result, dict):
            return result.get("results", [])
        return result or []

    async def create_daily_log(self, data: dict, token: str) -> dict | None:
        return await self._post("/productivity/daily-logs/", data, token)

    # === Analytics ===

    async def get_dashboard(self, token: str) -> dict | None:
        return await self._get("/analytics/dashboard/", token)

    async def get_productivity_analytics(self, token: str) -> dict | None:
        return await self._get("/analytics/productivity/", token)

    async def get_finance_analytics(self, token: str) -> dict | None:
        return await self._get("/analytics/finance/", token)

    # === Create entities ===

    async def create_account(self, data: dict, token: str) -> dict | None:
        return await self._post("/finance/accounts/", data, token)

    async def create_project(self, data: dict, token: str) -> dict | None:
        return await self._post("/tasks/projects/", data, token)

    async def create_habit(self, data: dict, token: str) -> dict | None:
        return await self._post("/productivity/habits/", data, token)

    async def create_budget(self, data: dict, token: str) -> dict | None:
        return await self._post("/finance/budgets/", data, token)

    async def create_goal(self, data: dict, token: str) -> dict | None:
        return await self._post("/finance/goals/", data, token)

    # === Helpers ===

    async def resolve_category_id(self, name: str, token: str) -> str | None:
        categories = await self.get_categories(token)
        for cat in categories:
            if cat.get("name", "").lower() == name.lower():
                return cat["id"]
        # Fuzzy match
        for cat in categories:
            if name.lower() in cat.get("name", "").lower():
                return cat["id"]
        return None

    async def resolve_account_id(self, name: str | None, token: str) -> str | None:
        accounts = await self.get_accounts(token)
        logger.info("resolve_account", name=name, accounts_count=len(accounts) if accounts else 0)
        if not accounts:
            return None
        if not name:
            return accounts[0]["id"]  # Default to first account
        for acc in accounts:
            if acc.get("name", "").lower() == name.lower():
                return acc["id"]
        for acc in accounts:
            if name.lower() in acc.get("name", "").lower():
                return acc["id"]
        return accounts[0]["id"]

    async def resolve_task_id(self, query: str, token: str) -> str | None:
        tasks = await self._get("/tasks/items/", token, params={"search": query})
        results = tasks.get("results", []) if isinstance(tasks, dict) else []
        if not results:
            return None
        # Exact match first
        for t in results:
            if query.lower() == t.get("title", "").lower():
                return t["id"]
        # Fuzzy: contains
        for t in results:
            if query.lower() in t.get("title", "").lower():
                return t["id"]
        return results[0]["id"] if results else None

    async def resolve_project_id(self, name: str, token: str) -> str | None:
        projects = await self.get_projects(token)
        for p in projects:
            if p.get("name", "").lower() == name.lower():
                return p["id"]
        for p in projects:
            if name.lower() in p.get("name", "").lower():
                return p["id"]
        return None

    async def resolve_habit_id(self, name: str, token: str) -> str | None:
        habits = await self.get_habits(token)
        for h in habits:
            if h.get("name", "").lower() == name.lower():
                return h["id"]
        for h in habits:
            if name.lower() in h.get("name", "").lower():
                return h["id"]
        return None


class TokenExpiredError(Exception):
    pass


class ValidationError(Exception):
    def __init__(self, errors: dict):
        self.errors = errors
        super().__init__(str(errors))
