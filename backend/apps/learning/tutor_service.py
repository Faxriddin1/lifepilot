"""
AI Tutor service — Socratic learning assistant.
"""

import logging

from django.utils import timezone

from .exceptions import TutorRateLimitError
from .models import LearningTask, TutorMessage

logger = logging.getLogger("learning")


class TutorService:

    MAX_HISTORY_MESSAGES = 10
    DAILY_LIMIT = 20

    @staticmethod
    def ask_question(goal, question: str, task=None, user=None) -> dict:
        """
        User asks a question → AI tutor responds (Socratic style).

        Returns: {"answer": str, "message_id": str, "topic": str, "module": str}
        """
        TutorService._check_rate_limit(goal)

        # 1. Determine context
        if task:
            module = task.module
            topic = task.title
            module_title = module.title
        else:
            module = goal.modules.filter(
                status__in=["in_progress", "available"]
            ).order_by("order").first()

            if module:
                module_title = module.title
                current_task = module.tasks.filter(
                    status__in=["todo", "in_progress"]
                ).order_by("order").first()
                topic = current_task.title if current_task else module.title
            else:
                module_title = goal.title
                topic = goal.title

        # 2. Sliding window history
        history = list(
            TutorMessage.objects.filter(goal=goal)
            .order_by("-created_at")[:TutorService.MAX_HISTORY_MESSAGES]
        )
        history.reverse()

        conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in history
        ]

        # 3. Save user message
        TutorMessage.objects.create(
            goal=goal,
            task=task,
            role=TutorMessage.Role.USER,
            content=question,
            module_title=module_title,
            topic=topic,
        )

        # 4. Call AI
        from apps.ai_core.services import AIService

        context = {
            "topic": topic,
            "module": module_title,
            "level": goal.difficulty_level,
            "goal": goal.title,
            "locale": getattr(user, "locale", "en") if user else "en",
            "conversation_history": conversation_history,
        }

        answer = AIService.answer_learning_question(
            question=question,
            context=context,
            user=user,
            channel="web",
        )

        # 5. Save assistant message
        assistant_msg = TutorMessage.objects.create(
            goal=goal,
            task=task,
            role=TutorMessage.Role.ASSISTANT,
            content=answer,
            module_title=module_title,
            topic=topic,
        )

        return {
            "answer": answer,
            "message_id": str(assistant_msg.id),
            "topic": topic,
            "module": module_title,
        }

    @staticmethod
    def _check_rate_limit(goal):
        """Check daily message limit (20/day/goal for free tier)."""
        today = timezone.now().date()
        count = TutorMessage.objects.filter(
            goal=goal,
            role=TutorMessage.Role.USER,
            created_at__date=today,
        ).count()

        if count >= TutorService.DAILY_LIMIT:
            raise TutorRateLimitError(
                f"Daily limit of {TutorService.DAILY_LIMIT} questions reached. Try again tomorrow."
            )
