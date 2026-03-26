"""Execute write intents via Django ORM."""

import logging
import re
from datetime import timedelta
from decimal import Decimal

from django.db.models import F
from django.utils import timezone

logger = logging.getLogger("bot")


def _extract_title_from_confirmation(confirmation: str) -> str:
    """Extract title from AI confirmation message like: Создать задачу «позвонить маме»..."""
    # Try to find text in «» or "" quotes
    match = re.search(r'[«"](.*?)[»"]', confirmation)
    if match:
        return match.group(1)
    return ""


def _extract_deadline_from_confirmation(confirmation: str) -> str | None:
    """Extract deadline hint from confirmation message."""
    text = confirmation.lower()
    now = timezone.now()

    if "сегодня" in text or "today" in text:
        if "вечер" in text or "evening" in text:
            return now.replace(hour=20, minute=0, second=0).isoformat()
        return now.replace(hour=23, minute=59, second=0).isoformat()
    if "завтра" in text or "tomorrow" in text:
        tomorrow = now + timedelta(days=1)
        return tomorrow.replace(hour=23, minute=59, second=0).isoformat()
    return None


async def execute_write_intent(intent: str, data: dict, user) -> str:
    """Execute a write action. Returns result text for Telegram."""
    try:
        if intent == "task_create":
            return await _create_task(data, user)
        elif intent == "finance_expense":
            return await _create_transaction(data, user, "expense")
        elif intent == "finance_income":
            return await _create_transaction(data, user, "income")
        elif intent == "task_complete":
            return await _complete_task(data, user)
        elif intent == "habit_toggle":
            return await _toggle_habit(data, user)
        elif intent == "focus_start":
            return await _start_focus(data, user)
        elif intent == "focus_stop":
            return await _stop_focus(data, user)
        elif intent == "learning_create_goal":
            return await _create_learning_goal(data, user)
        else:
            return f"⚠️ Действие '{intent}' пока не поддерживается."
    except Exception as e:
        logger.error("Execute intent error: %s", e, exc_info=True)
        return f"⚠️ Ошибка: {str(e)[:100]}"


async def _create_task(data: dict, user) -> str:
    from apps.tasks.models import Task, Project

    original = data.get("original_text", "")
    confirmation = data.get("confirmation", "")
    text_lower = original.lower()

    # Extract title: from data → from confirmation → from original text
    title = data.get("title", "")
    if not title:
        title = _extract_title_from_confirmation(confirmation)
    if not title:
        for prefix in ["создать задачу", "нужно создать задачу", "добавь задачу", "создай задачу",
                       "add task", "create task", "новая задача", "задача"]:
            idx = text_lower.find(prefix)
            if idx >= 0:
                after = original[idx + len(prefix):].strip().lstrip(",:.- ")
                # Cut off at project/deadline/priority markers
                for marker in [" . срок", " срок ", " в проекте ", " проект ", " статус ", " приоритет "]:
                    cut = after.lower().find(marker)
                    if cut > 0:
                        after = after[:cut]
                title = after.strip()
                break
        if not title:
            title = original[:100] if original else "Без названия"

    # Extract priority from original text
    priority = data.get("priority", "")
    if not priority:
        pl = text_lower
        if "срочн" in pl or "urgent" in pl or "p1" in pl:
            priority = "P1"
        elif "высок" in pl or "high" in pl or "p2" in pl or "важн" in pl:
            priority = "P2"
        elif "низк" in pl or "low" in pl or "p4" in pl:
            priority = "P4"
        else:
            priority = "P3"

    # Extract project from original text
    project = None
    project_name = data.get("project", "")
    if not project_name:
        for marker in ["в проекте ", "в проект ", "проект "]:
            idx = text_lower.find(marker)
            if idx >= 0:
                after = original[idx + len(marker):].strip().lstrip("«\"")
                # Cut at next marker
                for cut_marker in [" . ", " срок", " статус", " приоритет", "»", "\""]:
                    cut = after.lower().find(cut_marker)
                    if cut > 0:
                        after = after[:cut]
                project_name = after.strip().rstrip(".,!»\"")
                break
    if project_name:
        project = await Project.objects.filter(
            user=user, name__icontains=project_name
        ).afirst()

    # Extract deadline
    deadline = data.get("deadline")
    if not deadline:
        deadline = _extract_deadline_from_confirmation(confirmation)
    if not deadline:
        deadline = _extract_deadline_from_confirmation(original)

    task = await Task.objects.acreate(
        user=user,
        title=title.strip(),
        priority=priority,
        deadline=deadline,
        project=project,
        status="inbox",
    )

    # Format response
    result = f"✅ Задача создана: {task.title}"
    prio_labels = {"P1": "🔴 Срочный", "P2": "🟠 Высокий", "P3": "🔵 Средний", "P4": "⚪ Низкий"}
    result += f"\n📌 {prio_labels.get(priority, priority)}"
    if project:
        result += f"\n📁 Проект: {project.name}"
    if task.deadline:
        try:
            from django.utils.dateformat import format as df
            result += f"\n📅 Срок: {df(task.deadline, 'd M Y, H:i')}"
        except Exception:
            d = str(task.deadline)[:16]
            result += f"\n📅 Срок: {d}"
    return result


async def _create_transaction(data: dict, user, tx_type: str) -> str:
    from apps.finance.models import Account, Category, Transaction
    from apps.finance.currency import convert_currency, format_conversion
    from asgiref.sync import sync_to_async

    account = await Account.objects.filter(user=user, is_active=True).afirst()
    if not account:
        return "⚠️ Нет активных счетов. Создайте в Settings."

    category = None
    cat_name = data.get("category", "")
    if cat_name:
        from django.db.models import Q
        category = await Category.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            name__icontains=cat_name,
        ).afirst()

    original_amount = Decimal(str(data.get("amount", 0)))
    if original_amount <= 0:
        return "⚠️ Сумма должна быть положительной."

    # Determine transaction currency (what user paid in)
    tx_currency = data.get("currency", "").upper() or "UZS"
    account_currency = account.currency.upper() if account.currency else "USD"

    # Convert if currencies differ
    conversion_text = ""
    if tx_currency != account_currency:
        converted_amount, rate = await sync_to_async(convert_currency)(
            original_amount, tx_currency, account_currency
        )
        conversion_text = await sync_to_async(format_conversion)(
            original_amount, tx_currency, converted_amount, account_currency, rate
        )
        amount_to_record = converted_amount
    else:
        amount_to_record = original_amount

    note = data.get("note", data.get("description", ""))
    if conversion_text and note:
        note = f"{note} | {original_amount} {tx_currency}"
    elif conversion_text:
        note = f"{original_amount} {tx_currency}"

    tx = await Transaction.objects.acreate(
        user=user,
        account=account,
        category=category,
        amount=amount_to_record,
        transaction_type=tx_type,
        date=data.get("date", timezone.now().date()),
        note=note,
    )

    if tx_type == "expense":
        await Account.objects.filter(id=account.id).aupdate(balance=F("balance") - amount_to_record)
    else:
        await Account.objects.filter(id=account.id).aupdate(balance=F("balance") + amount_to_record)

    # Format response
    icon = "💸" if tx_type == "expense" else "💰"
    cat_text = f" ({category.name})" if category else ""

    if conversion_text:
        return f"{icon} Записано{cat_text}:\n{conversion_text}"
    else:
        formatted = f"{amount_to_record:,.0f}".replace(",", " ")
        return f"{icon} Записано: {formatted} {account_currency}{cat_text}"


async def _complete_task(data: dict, user) -> str:
    from apps.tasks.models import Task
    title = data.get("title", "")
    task = await Task.objects.filter(user=user, title__icontains=title, status__in=["inbox", "in_progress"]).afirst()
    if not task:
        return f"⚠️ Задача '{title}' не найдена."
    task.status = "done"
    task.completed_at = timezone.now()
    await task.asave(update_fields=["status", "completed_at"])
    return f"✅ Задача выполнена: {task.title}"


async def _toggle_habit(data: dict, user) -> str:
    from apps.productivity.models import Habit, HabitLog
    name = data.get("name", data.get("habit_name", ""))
    habit = await Habit.objects.filter(user=user, name__icontains=name).afirst()
    if not habit:
        return f"⚠️ Привычка '{name}' не найдена."
    today = timezone.now().date()
    log, created = await HabitLog.objects.aget_or_create(habit=habit, date=today)
    if not created:
        await log.adelete()
        return f"⬜ Привычка снята: {habit.name}"
    return f"✅ Привычка отмечена: {habit.name}"


async def _start_focus(data: dict, user) -> str:
    from apps.productivity.models import FocusSession
    duration = data.get("duration", data.get("minutes", 25))
    session = await FocusSession.objects.acreate(
        user=user,
        duration=duration,
        session_type=data.get("type", "pomodoro"),
    )
    return f"🎯 Фокус запущен: {duration} мин"


async def _stop_focus(data: dict, user) -> str:
    from apps.productivity.models import FocusSession
    session = await FocusSession.objects.filter(
        user=user, status="active"
    ).order_by("-created_at").afirst()
    if not session:
        return "⚠️ Нет активной фокус-сессии."
    session.status = "completed"
    session.completed_at = timezone.now()
    await session.asave(update_fields=["status", "completed_at"])
    return "✅ Фокус завершён!"


async def _create_learning_goal(data: dict, user) -> str:
    from apps.learning.models import LearningGoal
    title = data.get("goal_title", data.get("title", ""))
    if not title:
        original = data.get("original_text", "")
        title = original[:200] if original else "Новая цель"

    goal = await LearningGoal.objects.acreate(
        user=user,
        title=title,
        difficulty_level=data.get("level", "beginner"),
        target_date=(timezone.now() + timedelta(days=90)).date(),
        minutes_per_day=data.get("minutes_per_day", 60),
        status="generating",
    )

    from apps.learning.tasks import generate_learning_plan_task
    generate_learning_plan_task.delay(str(goal.id), str(user.id))

    return (
        f"🎯 Цель создана: {goal.title}\n\n"
        f"AI генерирует план обучения... ⏳\n"
        f"Напишу когда будет готово."
    )
