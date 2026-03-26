import json
import uuid
from datetime import datetime

import pytz
from aiogram import F, Router
from aiogram.enums import ChatAction
from aiogram.types import Message

from keyboards.confirm import confirm_action_keyboard
from keyboards.main_menu import main_menu_keyboard, extended_menu_keyboard, BUTTON_TO_TEXT
from models.user import TelegramUser
from services.ai_parser import AIParser, ParsedIntent
from services.lifepilot_api import LifePilotAPI
from utils.formatting import (
    format_budgets, format_finance_report, format_goals_report,
    format_habits, format_money, format_task_list, format_week_report,
    split_long_message,
)

router = Router()
ai_parser = AIParser()
api = LifePilotAPI()

# Intents that require confirmation before execution
WRITE_INTENTS = {
    "task_create", "task_complete", "task_delete",
    "finance_expense", "finance_income", "finance_transfer",
    "finance_goal_contribute",
    "focus_start", "focus_stop",
    "habit_toggle", "habit_create", "daily_log",
    "account_create", "project_create",
    "budget_create", "goal_create",
}

# Read-only intents — execute immediately
READ_INTENTS = {
    "task_list", "finance_balance", "finance_budget_status",
    "finance_goal_progress",
    "habit_list", "report_today", "report_week", "report_finance",
    "account_list", "project_list", "category_list",
    "help",
}

# Intents that mutate data — invalidate cache after execution
MUTATING_INTENTS = {
    "task_create", "task_complete", "task_delete",
    "finance_expense", "finance_income", "finance_transfer",
    "finance_goal_contribute",
    "focus_start", "focus_stop",
    "habit_toggle", "habit_create", "daily_log",
    "account_create", "project_create",
    "budget_create", "goal_create",
}


async def get_user_context(user: TelegramUser, token: str, redis=None) -> dict:
    """Get user context for AI parsing, cached in Redis."""
    if redis:
        cache_key = f"bot:context:{user.telegram_id}"
        cached = await redis.get(cache_key)
        if cached:
            ctx = json.loads(cached)
            tz = pytz.timezone(user.timezone or "Asia/Tashkent")
            ctx["now"] = datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
            return ctx

    accounts = await api.get_accounts(token)
    expense_cats = await api.get_categories(token, "expense")
    income_cats = await api.get_categories(token, "income")
    projects = await api.get_projects(token)
    habits = await api.get_habits(token)

    tz = pytz.timezone(user.timezone or "Asia/Tashkent")

    context = {
        "locale": user.locale,
        "currency": user.currency,
        "timezone": user.timezone,
        "now": datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"),
        "accounts": [{"id": a["id"], "name": a["name"]} for a in accounts] if accounts else [],
        "expense_categories": [{"id": c["id"], "name": c["name"]} for c in expense_cats] if expense_cats else [],
        "income_categories": [{"id": c["id"], "name": c["name"]} for c in income_cats] if income_cats else [],
        "projects": [{"id": p["id"], "name": p["name"]} for p in projects] if projects else [],
        "habits": [{"id": h["id"], "name": h["name"]} for h in habits] if habits else [],
    }

    if redis:
        await redis.setex(f"bot:context:{user.telegram_id}", 300, json.dumps(context, ensure_ascii=False))

    return context


async def invalidate_context_cache(user: TelegramUser, redis=None):
    """Invalidate cached user context after mutations."""
    if redis:
        await redis.delete(f"bot:context:{user.telegram_id}")


async def execute_intent(parsed: ParsedIntent, token: str, user: TelegramUser) -> str:
    """Execute a parsed intent against the LifePilot API."""
    data = parsed.data
    intent = parsed.intent

    try:
        if intent == "task_create":
            title = data.get("title") or data.get("name") or data.get("task") or data.get("description") or ""
            payload = {"title": title}
            if data.get("priority"):
                payload["priority"] = data["priority"]
            deadline = data.get("deadline") or data.get("due_date") or data.get("date")
            if deadline:
                payload["deadline"] = deadline
            project = data.get("project")
            if project:
                proj_id = await api.resolve_project_id(project, token)
                if proj_id:
                    payload["project"] = proj_id
            result = await api.create_task(payload, token)
            if result:
                return f'✅ Задача "{title}" создана'

        elif intent == "task_list":
            params = {}
            if data.get("status"):
                params["status"] = data["status"]
            if data.get("date"):
                params["deadline"] = data["date"]
            result = await api.list_tasks(token, params)
            tasks = result.get("results", []) if result else []
            return f"📋 *Задачи:*\n\n{format_task_list(tasks, user.locale)}"

        elif intent == "task_complete":
            task_id = data.get("task_id")
            if not task_id:
                query = data.get("title", data.get("query", ""))
                if query:
                    task_id = await api.resolve_task_id(query, token)
            if task_id:
                await api.update_task(task_id, {"status": "done"}, token)
                return "✅ Задача выполнена"
            return "❌ Не удалось найти задачу"

        elif intent == "task_delete":
            task_id = data.get("task_id")
            if not task_id:
                query = data.get("title", data.get("query", ""))
                if query:
                    task_id = await api.resolve_task_id(query, token)
            if task_id:
                await api.delete_task(task_id, token)
                return "🗑 Задача удалена"
            return "❌ Не удалось найти задачу"

        elif intent == "finance_expense":
            cat_id = await api.resolve_category_id(data.get("category", "Other"), token)
            acc_id = await api.resolve_account_id(data.get("account"), token)
            if not acc_id:
                return "❌ Сначала создайте счёт в LifePilot (Finance → Accounts)"
            payload = {
                "amount": str(data.get("amount", 0)),
                "transaction_type": "expense",
                "category": cat_id,
                "account": acc_id,
                "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
                "description": data.get("description", ""),
            }
            if cat_id:
                payload["category"] = cat_id
            result = await api.create_transaction(payload, token)
            if result:
                amt = format_money(data.get("amount", 0), user.currency)
                return f"✅ Расход {amt} записан ({data.get('category', '')})"

        elif intent == "finance_income":
            cat_id = await api.resolve_category_id(data.get("category", "Other"), token)
            acc_id = await api.resolve_account_id(data.get("account"), token)
            if not acc_id:
                return "❌ Сначала создайте счёт в LifePilot (Finance → Accounts)"
            payload = {
                "amount": str(data.get("amount", 0)),
                "transaction_type": "income",
                "account": acc_id,
                "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
                "description": data.get("description", ""),
            }
            if cat_id:
                payload["category"] = cat_id
            result = await api.create_transaction(payload, token)
            if result:
                amt = format_money(data.get("amount", 0), user.currency)
                return f"✅ Доход {amt} записан ({data.get('category', '')})"

        elif intent == "finance_transfer":
            from_acc = await api.resolve_account_id(data.get("from_account", data.get("from")), token)
            to_acc = await api.resolve_account_id(data.get("to_account", data.get("to")), token)
            if not from_acc or not to_acc:
                return "❌ Не удалось найти счета для перевода"
            result = await api.create_transaction({
                "amount": str(data.get("amount", 0)),
                "transaction_type": "transfer",
                "account": from_acc,
                "to_account": to_acc,
                "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
                "description": data.get("description", "Перевод"),
            }, token)
            if result:
                amt = format_money(data.get("amount", 0), user.currency)
                return f"✅ Перевод {amt} выполнен"

        elif intent == "finance_balance":
            accounts = await api.get_accounts(token)
            if accounts:
                lines = ["💰 *Баланс:*\n"]
                total = 0
                for a in accounts:
                    bal = float(a.get("balance", 0))
                    total += bal
                    lines.append(f"  {a['name']}: {format_money(bal, user.currency)}")
                lines.append(f"\n  *Итого: {format_money(total, user.currency)}*")
                return "\n".join(lines)
            return "💰 Нет счетов"

        elif intent == "finance_budget_status":
            budgets = await api.get_budgets(token)
            return f"📈 *Бюджеты:*\n\n{format_budgets(budgets, user.locale)}"

        elif intent == "finance_goal_contribute":
            goal_name = data.get("goal_name", "")
            amount = data.get("amount", 0)
            goals = await api.get_goals(token)
            goal = next((g for g in goals if goal_name.lower() in g.get("name", "").lower()), None)
            if goal:
                await api.contribute_to_goal(goal["id"], amount, token)
                return f"✅ Внесено {format_money(amount, user.currency)} в цель \"{goal['name']}\""
            return "❌ Цель не найдена"

        elif intent == "finance_goal_progress":
            goals = await api.get_goals(token)
            return format_goals_report(goals, user.currency)

        elif intent == "focus_start":
            result = await api.start_focus_session({
                "session_type": data.get("session_type", "pomodoro"),
                "duration": data.get("duration", 25),
                "start_time": datetime.now().isoformat(),
            }, token)
            if result:
                return f"🎯 Фокус-сессия запущена на {data.get('duration', 25)} мин"

        elif intent == "focus_stop":
            result = await api.stop_focus_session(token)
            if result and not result.get("error"):
                return "🎯 Фокус-сессия завершена"
            return f"❌ {result.get('error', 'Не удалось остановить сессию')}"

        elif intent == "habit_toggle":
            habit_name = data.get("habit_name", data.get("name", ""))
            habit_id = await api.resolve_habit_id(habit_name, token)
            if habit_id:
                await api.toggle_habit({"habit": habit_id, "date": datetime.now().strftime("%Y-%m-%d")}, token)
                return f"✅ Привычка \"{habit_name}\" отмечена"
            return f"❌ Привычка \"{habit_name}\" не найдена"

        elif intent == "habit_list":
            habits = await api.get_habits(token)
            if habits:
                lines = ["✅ *Привычки:*\n"]
                for h in habits:
                    streak = h.get("current_streak", 0)
                    lines.append(f"  • {h['name']} (серия: {streak} дн.)")
                return "\n".join(lines)
            return "✅ Привычек нет"

        elif intent == "daily_log":
            result = await api.create_daily_log({
                "done": data.get("done", ""),
                "plans": data.get("plans", ""),
                "notes": data.get("notes", ""),
                "mood": data.get("mood", 3),
                "energy_level": data.get("energy_level", 3),
            }, token)
            if result:
                return "📝 Журнал дня сохранён"

        elif intent == "report_today":
            dashboard = await api.get_dashboard(token)
            if dashboard:
                completed = dashboard.get("tasks_completed_today", 0)
                total = dashboard.get("tasks_today", 0)
                focus = dashboard.get("focus_minutes_today", 0)
                balance = dashboard.get("total_balance", 0)

                text = f"""📊 *Сводка за сегодня*

📋 Задачи: {completed}/{total} выполнено
🎯 Фокус: {focus} мин
💰 Баланс: {format_money(balance, user.currency)}

📈 Бюджеты:
{format_budgets(dashboard.get('top_budgets', []), user.locale)}

✅ Привычки:
{format_habits(dashboard.get('habit_completions', []), user.locale)}"""
                return text
            return "📊 Не удалось загрузить сводку"

        elif intent == "report_week":
            prod = await api.get_productivity_analytics(token)
            return format_week_report(prod, user.currency)

        elif intent == "report_finance":
            fin = await api.get_finance_analytics(token)
            return format_finance_report(fin, user.currency)

        # === New intents: Create entities ===

        elif intent == "account_create":
            name = data.get("name", "")
            if not name:
                return "❌ Укажите название счёта"
            result = await api.create_account({
                "name": name,
                "account_type": data.get("account_type", "cash"),
                "currency": data.get("currency", user.currency or "UZS"),
                "balance": str(data.get("balance", 0)),
            }, token)
            if result:
                return f'✅ Счёт "{name}" создан'

        elif intent == "account_list":
            accounts = await api.get_accounts(token)
            if not accounts:
                return "💰 Нет счетов. Создайте: «создай счёт Наличные»"
            lines = ["💰 *Ваши счета:*\n"]
            total = 0
            for a in accounts:
                bal = float(a.get("balance", 0))
                total += bal
                atype = a.get("account_type", "")
                icon = {"cash": "💵", "bank": "🏦", "card": "💳", "ewallet": "📱"}.get(atype, "💰")
                lines.append(f"  {icon} {a['name']}: {format_money(bal, a.get('currency', user.currency))}")
            lines.append(f"\n  *Итого: {format_money(total, user.currency)}*")
            return "\n".join(lines)

        elif intent == "project_create":
            name = data.get("name", "")
            if not name:
                return "❌ Укажите название проекта"
            result = await api.create_project({"name": name, "color": data.get("color", "#3B82F6")}, token)
            if result:
                return f'✅ Проект "{name}" создан'

        elif intent == "project_list":
            projects = await api.get_projects(token)
            if not projects:
                return "📂 Нет проектов. Создайте: «создай проект Работа»"
            lines = ["📂 *Проекты:*\n"]
            for p in projects:
                count = p.get("task_count", 0)
                lines.append(f"  • {p['name']} ({count} задач)")
            return "\n".join(lines)

        elif intent == "habit_create":
            name = data.get("name", "")
            if not name:
                return "❌ Укажите название привычки"
            payload = {"name": name}
            if data.get("frequency"):
                payload["frequency"] = data["frequency"]
            if data.get("target_count"):
                payload["target_count"] = data["target_count"]
            result = await api.create_habit(payload, token)
            if result:
                return f'✅ Привычка "{name}" создана'

        elif intent == "category_list":
            expense_cats = await api.get_categories(token, "expense")
            income_cats = await api.get_categories(token, "income")
            lines = ["📁 *Категории:*\n"]
            lines.append("💸 *Расходы:*")
            for c in expense_cats:
                lines.append(f"  • {c['name']}")
            lines.append("\n💰 *Доходы:*")
            for c in income_cats:
                lines.append(f"  • {c['name']}")
            return "\n".join(lines)

        elif intent == "budget_create":
            name = data.get("name", data.get("category", ""))
            amount = data.get("amount", 0)
            if not name or not amount:
                return "❌ Укажите категорию и сумму бюджета"
            cat_id = await api.resolve_category_id(name, token)
            payload = {
                "name": name,
                "amount": str(amount),
                "period": data.get("period", "monthly"),
            }
            if cat_id:
                payload["category"] = cat_id
            result = await api.create_budget(payload, token)
            if result:
                return f'✅ Бюджет "{name}" на {format_money(amount, user.currency)} создан'

        elif intent == "goal_create":
            name = data.get("name", "")
            target = data.get("target_amount", 0)
            if not name or not target:
                return "❌ Укажите название цели и сумму"
            payload = {
                "name": name,
                "target_amount": str(target),
            }
            if data.get("deadline"):
                payload["deadline"] = data["deadline"]
            result = await api.create_goal(payload, token)
            if result:
                return f'✅ Цель "{name}" на {format_money(target, user.currency)} создана'

        elif intent == "help":
            return None

        return "❌ Не удалось выполнить действие. Попробуйте ещё раз."

    except Exception as e:
        error_str = str(e)
        # Try to extract readable validation error
        if "validation_error" in error_str or "errors" in error_str:
            try:
                import ast
                err_data = ast.literal_eval(error_str)
                if isinstance(err_data, dict) and "errors" in err_data:
                    msgs = []
                    for field, errs in err_data["errors"].items():
                        msgs.append(f"{field}: {', '.join(errs)}")
                    return f"⚠️ Ошибка валидации:\n" + "\n".join(msgs)
            except Exception:
                pass
        return f"⚠️ Ошибка: {error_str[:200]}"


@router.message(F.text)
async def handle_text(
    message: Message,
    lifepilot_user: TelegramUser = None,
    api_token: str = None,
    redis=None,
    t=None,
    **kwargs,
):
    if not lifepilot_user or not api_token:
        return

    text = message.text.strip()

    # Handle menu buttons
    if text in ("⚙️ Меню", "⚙️ Menu", "⚙️ Menyu"):
        await message.answer(
            "📋 Дополнительное меню:",
            reply_markup=extended_menu_keyboard(lifepilot_user.locale),
        )
        return

    if text in ("🔙 Назад", "🔙 Back", "🔙 Orqaga", "🔙 Орқага"):
        await message.answer(
            "🏠 Главное меню:",
            reply_markup=main_menu_keyboard(lifepilot_user.locale),
        )
        return

    # Translate button press to natural language for AI
    if text in BUTTON_TO_TEXT:
        text = BUTTON_TO_TEXT[text]

    await message.bot.send_chat_action(chat_id=message.chat.id, action=ChatAction.TYPING)

    # Get user context
    user_context = await get_user_context(lifepilot_user, api_token, redis)

    # AI parse with graceful degradation
    try:
        parsed = await ai_parser.parse_message(text, user_context)
    except Exception:
        await message.answer(
            t("ai_unavailable") if t else "🤖 AI-помощник временно недоступен. Используйте меню:",
            reply_markup=main_menu_keyboard(lifepilot_user.locale),
        )
        return

    # AI returned unknown with clarification (likely error)
    if parsed.intent == "unknown" and parsed.clarification_question:
        if "занят" in (parsed.clarification_question or "") or "недоступен" in (parsed.clarification_question or ""):
            await message.answer(
                parsed.clarification_question,
                reply_markup=main_menu_keyboard(lifepilot_user.locale),
            )
            return

    # Low confidence or clarification needed
    if parsed.confidence < 0.7 or parsed.clarification_question:
        await message.answer(parsed.clarification_question or (t("clarify") if t else "🤔 Уточните, пожалуйста."))
        return

    # Missing fields
    if parsed.missing_fields:
        await message.answer(parsed.clarification_question or (t("clarify") if t else "🤔 Уточните, пожалуйста."))
        return

    # Help intent
    if parsed.intent == "help":
        await message.answer(t("help") if t else "Напишите /help")
        return

    # Write intents — need confirmation
    if parsed.intent in WRITE_INTENTS:
        action_id = str(uuid.uuid4())[:8]
        parsed.action_id = action_id

        if redis:
            await redis.setex(
                f"bot:action:{action_id}",
                300,
                json.dumps({
                    "intent": parsed.intent,
                    "data": parsed.data,
                    "confirmation_message": parsed.confirmation_message,
                }, ensure_ascii=False),
            )

        await message.answer(
            parsed.confirmation_message or "Выполнить действие?",
            reply_markup=confirm_action_keyboard(action_id, lifepilot_user.locale),
        )
        return

    # Read intents — execute immediately
    result = await execute_intent(parsed, api_token, lifepilot_user)
    if result:
        for part in split_long_message(result):
            try:
                await message.answer(part)
            except Exception:
                await message.answer(part, parse_mode=None)
