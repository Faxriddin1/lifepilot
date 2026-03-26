"""Main text message handler — AI intent parsing → action routing."""

import logging
import uuid

from aiogram import F, Router
from aiogram.types import Message
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger("bot")
router = Router()

WRITE_INTENTS = {
    "task_create", "task_complete", "task_delete",
    "finance_expense", "finance_income", "finance_transfer",
    "focus_start", "focus_stop",
    "habit_toggle", "habit_create",
    "daily_log_create",
    "project_create", "budget_create", "goal_create", "goal_contribute",
    "learning_create_goal",
}

MENU_BUTTONS = {
    "💸 Расход": "finance_expense_prompt",
    "💸 Expense": "finance_expense_prompt",
    "💸 Xarajat": "finance_expense_prompt",
    "💰 Доход": "finance_income_prompt",
    "💰 Income": "finance_income_prompt",
    "💰 Daromad": "finance_income_prompt",
    "💳 Баланс": "finance_balance",
    "💳 Balance": "finance_balance",
    "💳 Balans": "finance_balance",
    "📋 Задачи": "task_list",
    "📋 Tasks": "task_list",
    "📋 Vazifalar": "task_list",
    "➕ Новая задача": "task_create_prompt",
    "➕ New task": "task_create_prompt",
    "➕ Yangi vazifa": "task_create_prompt",
    "📚 Обучение": "learning_status",
    "📚 Learning": "learning_status",
    "📚 O'qish": "learning_status",
    "📊 Сводка": "analytics_summary",
    "📊 Summary": "analytics_summary",
    "📊 Hisobot": "analytics_summary",
    "⚙️ Настройки": "bot_settings",
    "⚙️ Settings": "bot_settings",
    "⚙️ Sozlamalar": "bot_settings",
}


def _t(locale: str, key: str) -> str:
    """Simple i18n for bot messages."""
    MSGS = {
        "write_details": {
            "ru": "✍️ Напишите подробности (например: «кофе 25к» или «купить продукты завтра»):",
            "en": "✍️ Write the details (e.g. «coffee 25k» or «buy groceries tomorrow»):",
            "uz": "✍️ Tafsilotlarni yozing (masalan: «kofe 25k» yoki «ertaga mahsulot olish»):",
        },
        "ai_unavailable": {
            "ru": "⚠️ AI временно недоступен. Попробуйте позже.",
            "en": "⚠️ AI temporarily unavailable. Try again later.",
            "uz": "⚠️ AI vaqtincha mavjud emas. Keyinroq urinib ko'ring.",
        },
        "unknown_intent": {
            "ru": "🤔 Не понял. Попробуйте по-другому.\n\nПримеры:\n• «купил кофе 25к»\n• «добавь задачу: сделать отчёт»\n• «хочу выучить Python»",
            "en": "🤔 Didn't understand. Try rephrasing.\n\nExamples:\n• «bought coffee 25k»\n• «add task: do report»\n• «I want to learn Python»",
            "uz": "🤔 Tushunmadim. Boshqacha yozib ko'ring.\n\nMisollar:\n• «kofe oldim 25k»\n• «vazifa qo'sh: hisobot tayyorlash»\n• «Python o'rganmoqchiman»",
        },
        "greeting": {
            "ru": "👋 Привет! Чем могу помочь?",
            "en": "👋 Hi! How can I help?",
            "uz": "👋 Salom! Qanday yordam bera olaman?",
        },
        "no_tasks": {
            "ru": "📋 Активных задач нет.",
            "en": "📋 No active tasks.",
            "uz": "📋 Faol vazifalar yo'q.",
        },
        "your_tasks": {
            "ru": "📋 <b>Ваши задачи:</b>\n\n",
            "en": "📋 <b>Your tasks:</b>\n\n",
            "uz": "📋 <b>Vazifalaringiz:</b>\n\n",
        },
        "no_accounts": {
            "ru": "💳 Нет счетов.",
            "en": "💳 No accounts.",
            "uz": "💳 Hisoblar yo'q.",
        },
        "balances": {
            "ru": "💳 <b>Балансы:</b>\n\n",
            "en": "💳 <b>Balances:</b>\n\n",
            "uz": "💳 <b>Balanslar:</b>\n\n",
        },
        "no_learning": {
            "ru": "📚 Нет активных целей обучения.\n\nНапишите: «хочу выучить Python»",
            "en": "📚 No active learning goals.\n\nWrite: «I want to learn Python»",
            "uz": "📚 Faol ta'lim maqsadlari yo'q.\n\nYozing: «Python o'rganmoqchiman»",
        },
        "learning_title": {
            "ru": "📚 <b>Обучение:</b>\n\n",
            "en": "📚 <b>Learning:</b>\n\n",
            "uz": "📚 <b>Ta'lim:</b>\n\n",
        },
        "analytics_hint": {
            "ru": "📊 Откройте lifepilot.uz/dashboard для полной аналитики.",
            "en": "📊 Open lifepilot.uz/dashboard for full analytics.",
            "uz": "📊 To'liq tahlil uchun lifepilot.uz/dashboard ni oching.",
        },
        "error": {
            "ru": "⚠️ Ошибка получения данных.",
            "en": "⚠️ Error fetching data.",
            "uz": "⚠️ Ma'lumot olishda xatolik.",
        },
    }
    msg = MSGS.get(key, {})
    return msg.get(locale, msg.get("ru", key))


@router.message(F.text)
async def handle_text(message: Message, user=None, authenticated: bool = False, **kwargs):
    if not authenticated or not user:
        return

    text = message.text.strip()
    locale = user.locale or "ru"

    # Check menu buttons
    menu_action = MENU_BUTTONS.get(text)
    if menu_action:
        if menu_action == "bot_settings":
            from apps.bot.handlers.settings import cmd_settings
            await cmd_settings(message, user=user)
            return
        if menu_action.endswith("_prompt"):
            await message.answer(_t(locale, "write_details"))
            return
        await handle_read_action(message, user, menu_action, locale=locale)
        return

    # AI Intent Parsing (sync call wrapped for async context)
    from apps.ai_core.services import AIService
    from asgiref.sync import sync_to_async

    user_context = {
        "locale": locale,
        "timezone": user.timezone or "Asia/Tashkent",
        "now": timezone.now().isoformat(),
        "currency": user.base_currency or "UZS",
    }

    try:
        parsed = await sync_to_async(AIService.parse_user_intent)(
            text=text, user_context=user_context, user=user, channel="telegram",
        )
    except Exception as e:
        logger.error("AI parse_user_intent failed: %s", e, exc_info=True)
        await message.answer(_t(locale, "ai_unavailable"))
        return

    # Clarification needed
    if parsed.clarification_question:
        await message.answer(parsed.clarification_question)
        return

    # Unknown intent
    if parsed.intent == "unknown" or parsed.confidence < 0.3:
        await message.answer(_t(locale, "unknown_intent"))
        return

    # Greeting
    if parsed.intent == "greeting":
        await message.answer(_t(locale, "greeting"))
        return

    if parsed.intent == "help":
        from apps.bot.handlers.start import cmd_help
        await cmd_help(message)
        return

    # Write intents → confirmation
    if parsed.intent in WRITE_INTENTS:
        action_id = str(uuid.uuid4())[:8]
        cache.set(f"bot:action:{action_id}", {
            "intent": parsed.intent,
            "data": parsed.data,
            "original_text": text,
            "confirmation": parsed.confirmation_message or "",
        }, 300)

        from apps.bot.keyboards.confirm import get_confirm_keyboard
        confirmation = parsed.confirmation_message or f"Выполнить: {parsed.intent}?"
        await message.answer(confirmation, reply_markup=get_confirm_keyboard(action_id))
        return

    # Read intents → execute immediately
    await handle_read_action(message, user, parsed.intent, parsed.data, locale=locale)


async def handle_read_action(message: Message, user, intent: str, data: dict = None, locale: str = "ru"):
    """Execute a read-only intent and show results."""
    try:
        if intent == "task_list":
            from apps.tasks.models import Task
            tasks = Task.objects.filter(user=user, status__in=["inbox", "in_progress", "review"]).order_by("-created_at")[:10]
            task_list = [t async for t in tasks]
            if not task_list:
                await message.answer(_t(locale, "no_tasks"))
                return
            text = _t(locale, "your_tasks")
            for i, t in enumerate(task_list, 1):
                icon = {"P1": "🔴", "P2": "🟠", "P3": "🔵", "P4": "⚪"}.get(t.priority, "📌")
                text += f"{i}. {icon} {t.title}\n"
            await message.answer(text)

        elif intent == "finance_balance":
            from apps.finance.models import Account
            accounts = Account.objects.filter(user=user, is_active=True)
            accs = [a async for a in accounts]
            if not accs:
                await message.answer(_t(locale, "no_accounts"))
                return
            text = _t(locale, "balances")
            for a in accs:
                text += f"• {a.name}: {a.balance:,.0f} {a.currency}\n"
            await message.answer(text)

        elif intent in ("learning_status", "learning_progress"):
            from apps.learning.models import LearningGoal
            goals = LearningGoal.objects.filter(user=user, status="active")
            goals_list = [g async for g in goals]
            if not goals_list:
                await message.answer(_t(locale, "no_learning"))
                return
            text = _t(locale, "learning_title")
            for g in goals_list:
                streak = f"🔥{g.current_streak}" if g.current_streak > 0 else ""
                text += f"• {g.title} {streak}\n"
            await message.answer(text)

        elif intent == "analytics_summary":
            await message.answer(_t(locale, "analytics_hint"))

        else:
            await message.answer(f"ℹ️ {parsed.intent if 'parsed' in dir() else intent}")

    except Exception as e:
        logger.error("Read action error: %s", e)
        await message.answer(_t(locale, "error"))
