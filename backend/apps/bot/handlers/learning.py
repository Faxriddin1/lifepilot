"""Learning-specific commands: /plan, /today, /ask."""

import logging

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

logger = logging.getLogger("bot")
router = Router()


def _t(locale: str, key: str) -> str:
    MSGS = {
        "no_goals": {
            "ru": "📚 Нет целей обучения.\n\nНапишите: «хочу выучить Python»",
            "en": "📚 No learning goals.\n\nWrite: «I want to learn Python»",
            "uz": "📚 Ta'lim maqsadlari yo'q.\n\nYozing: «Python o'rganmoqchiman»",
        },
        "your_goals": {
            "ru": "📚 <b>Ваши цели обучения:</b>\n\n",
            "en": "📚 <b>Your learning goals:</b>\n\n",
            "uz": "📚 <b>Ta'lim maqsadlaringiz:</b>\n\n",
        },
        "no_active": {
            "ru": "📚 Нет активных целей. Напишите: «хочу выучить Python»",
            "en": "📚 No active goals. Write: «I want to learn Python»",
            "uz": "📚 Faol maqsadlar yo'q. Yozing: «Python o'rganmoqchiman»",
        },
        "all_done": {
            "ru": "✅ На сегодня всё выполнено! Серия: 🔥{streak}",
            "en": "✅ All done for today! Streak: 🔥{streak}",
            "uz": "✅ Bugun hammasi bajarildi! Ketma-ket: 🔥{streak}",
        },
        "today_title": {
            "ru": "📋 <b>Задания на сегодня</b> ({goal}):\n\n",
            "en": "📋 <b>Today's tasks</b> ({goal}):\n\n",
            "uz": "📋 <b>Bugungi vazifalar</b> ({goal}):\n\n",
        },
        "streak": {
            "ru": "\n🔥 Серия: {streak} дней",
            "en": "\n🔥 Streak: {streak} days",
            "uz": "\n🔥 Ketma-ket: {streak} kun",
        },
        "min": {"ru": "мин", "en": "min", "uz": "daq"},
        "ask_hint": {
            "ru": "❓ Напишите вопрос после /ask\nПример: /ask Что такое list comprehension?",
            "en": "❓ Write your question after /ask\nExample: /ask What is list comprehension?",
            "uz": "❓ /ask dan keyin savol yozing\nMisol: /ask List comprehension nima?",
        },
        "create_goal_first": {
            "ru": "📚 Сначала создайте цель обучения.",
            "en": "📚 Create a learning goal first.",
            "uz": "📚 Avval ta'lim maqsadi yarating.",
        },
        "thinking": {"ru": "🤔 Думаю...", "en": "🤔 Thinking...", "uz": "🤔 O'ylayapman..."},
        "tutor_error": {
            "ru": "⚠️ AI-тьютор временно недоступен.",
            "en": "⚠️ AI tutor temporarily unavailable.",
            "uz": "⚠️ AI tyutor vaqtincha mavjud emas.",
        },
    }
    msg = MSGS.get(key, {})
    return msg.get(locale, msg.get("ru", key))


@router.message(Command("plan"))
async def cmd_plan(message: Message, user=None, authenticated: bool = False, **kwargs):
    if not authenticated or not user:
        return

    locale = user.locale or "ru"
    from apps.learning.models import LearningGoal
    goals = LearningGoal.objects.filter(user=user, status__in=["active", "paused"]).order_by("-created_at")[:5]
    goals_list = [g async for g in goals]

    if not goals_list:
        await message.answer(_t(locale, "no_goals"))
        return

    text = _t(locale, "your_goals")
    for g in goals_list:
        streak = f" 🔥{g.current_streak}" if g.current_streak > 0 else ""
        status_icon = "▶️" if g.status == "active" else "⏸"
        text += f"{status_icon} {g.title}{streak}\n"

    await message.answer(text)


@router.message(Command("today"))
async def cmd_today(message: Message, user=None, authenticated: bool = False, **kwargs):
    if not authenticated or not user:
        return

    locale = user.locale or "ru"
    from apps.learning.models import LearningGoal
    from apps.learning.services import LearningService

    goal = await LearningGoal.objects.filter(user=user, status="active").order_by("-updated_at").afirst()
    if not goal:
        await message.answer(_t(locale, "no_active"))
        return

    tasks = LearningService.get_today_tasks(goal)
    tasks_list = list(tasks)

    if not tasks_list:
        await message.answer(_t(locale, "all_done").format(streak=goal.current_streak))
        return

    text = _t(locale, "today_title").format(goal=goal.title)
    type_icons = {"video": "📹", "article": "📖", "practice": "💻", "quiz": "❓", "project": "🏗"}
    mn = _t(locale, "min")
    for i, task in enumerate(tasks_list, 1):
        icon = type_icons.get(task.task_type, "📌")
        text += f"{i}. {icon} {task.title} ({task.estimated_minutes} {mn})\n"

    text += _t(locale, "streak").format(streak=goal.current_streak)
    await message.answer(text)


@router.message(Command("ask"))
async def cmd_ask(message: Message, user=None, authenticated: bool = False, **kwargs):
    if not authenticated or not user:
        return

    locale = user.locale or "ru"
    question = (message.text or "").replace("/ask", "").strip()
    if not question:
        await message.answer(_t(locale, "ask_hint"))
        return

    from apps.learning.models import LearningGoal
    goal = await LearningGoal.objects.filter(user=user, status="active").order_by("-updated_at").afirst()
    if not goal:
        await message.answer(_t(locale, "create_goal_first"))
        return

    await message.answer(_t(locale, "thinking"))

    from apps.learning.tutor_service import TutorService
    from asgiref.sync import sync_to_async
    try:
        result = await sync_to_async(TutorService.ask_question)(goal=goal, question=question, user=user)
        await message.answer(f"🎓 {result['answer']}")
    except Exception:
        await message.answer(_t(locale, "tutor_error"))
