import json
from dataclasses import dataclass, field

from google import genai
from google.genai import types
import structlog

from config import settings
from prompts.intent_parser import INTENT_PARSER_SYSTEM_PROMPT
from prompts.receipt_parser import RECEIPT_PARSER_PROMPT

logger = structlog.get_logger()


@dataclass
class ParsedIntent:
    intent: str = "unknown"
    confidence: float = 0.0
    data: dict = field(default_factory=dict)
    confirmation_message: str = ""
    missing_fields: list = field(default_factory=list)
    clarification_question: str | None = None
    action_id: str | None = None


class AIParser:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        else:
            self.client = None

    async def parse_message(self, text: str, user_context: dict) -> ParsedIntent:
        if not self.client:
            logger.warning("gemini_not_configured")
            return ParsedIntent(intent="unknown", clarification_question="AI не настроен.")

        system_prompt = INTENT_PARSER_SYSTEM_PROMPT.format(
            locale=user_context.get("locale", "ru"),
            currency=user_context.get("currency", "UZS"),
            timezone=user_context.get("timezone", "Asia/Tashkent"),
            current_datetime=user_context.get("now", ""),
            accounts=json.dumps(user_context.get("accounts", []), ensure_ascii=False),
            expense_categories=json.dumps(user_context.get("expense_categories", []), ensure_ascii=False),
            income_categories=json.dumps(user_context.get("income_categories", []), ensure_ascii=False),
            projects=json.dumps(user_context.get("projects", []), ensure_ascii=False),
            habits=json.dumps(user_context.get("habits", []), ensure_ascii=False),
        )

        try:
            response = await self.client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=f"{system_prompt}\n\nСообщение пользователя: {text}",
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    max_output_tokens=1024,
                ),
            )
            # Log usage
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                um = response.usage_metadata
                logger.info("gemini_call",
                    input_tokens=getattr(um, 'prompt_token_count', 0),
                    output_tokens=getattr(um, 'candidates_token_count', 0),
                )
            parsed = self._parse_response(response.text)
            logger.info("gemini_parsed", intent=parsed.intent, data=parsed.data, confidence=parsed.confidence)
            return parsed
        except Exception as e:
            logger.error("gemini_error", error=str(e))
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                return ParsedIntent(intent="unknown", clarification_question="AI занят. Попробуйте через минуту.")
            return ParsedIntent(intent="unknown", clarification_question="Ошибка AI. Попробуйте ещё раз.")

    async def parse_receipt(self, ocr_text: str, user_context: dict) -> dict:
        if not self.client:
            return {"is_receipt": False}

        prompt = RECEIPT_PARSER_PROMPT.format(
            ocr_text=ocr_text,
            currency=user_context.get("currency", "UZS"),
            expense_categories=json.dumps(user_context.get("expense_categories", []), ensure_ascii=False),
        )

        try:
            response = await self.client.aio.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                    max_output_tokens=2048,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            logger.error("gemini_receipt_error", error=str(e))
            return {"is_receipt": False}

    def _parse_response(self, text: str) -> ParsedIntent:
        try:
            data = json.loads(text)
            return ParsedIntent(
                intent=data.get("intent", "unknown"),
                confidence=data.get("confidence", 0.0),
                data=data.get("data", {}),
                confirmation_message=data.get("confirmation_message", ""),
                missing_fields=data.get("missing_fields", []),
                clarification_question=data.get("clarification_question"),
            )
        except (json.JSONDecodeError, KeyError) as e:
            logger.error("gemini_parse_error", error=str(e), raw=text[:200])
            return ParsedIntent(intent="unknown", clarification_question="Не удалось разобрать ответ. Попробуйте по-другому.")
