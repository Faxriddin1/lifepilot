"""
AI Core configuration — models, temperatures, pricing, method configs.
"""

from dataclasses import dataclass

# Gemini model identifiers
MODEL_FLASH_LITE = "gemini-2.5-flash-lite"
MODEL_FLASH = "gemini-2.5-flash"

# Pricing per 1M tokens (USD)
PRICING = {
    MODEL_FLASH_LITE: {"input": 0.10, "output": 0.40},
    MODEL_FLASH: {"input": 0.30, "output": 2.50},
}


@dataclass(frozen=True)
class MethodConfig:
    model: str
    temperature: float
    max_output_tokens: int
    json_mode: bool
    cache_ttl_seconds: int
    prompt_file: str


AI_METHOD_CONFIG: dict[str, MethodConfig] = {
    "parse_user_intent": MethodConfig(
        model=MODEL_FLASH_LITE,
        temperature=0.1,
        max_output_tokens=512,
        json_mode=True,
        cache_ttl_seconds=300,  # 5 min
        prompt_file="parse_user_intent.v1.txt",
    ),
    "generate_learning_plan": MethodConfig(
        model=MODEL_FLASH,
        temperature=0.3,
        max_output_tokens=65536,
        json_mode=True,
        cache_ttl_seconds=86400,  # 24 hours
        prompt_file="generate_learning_plan.v1.txt",
    ),
    "adapt_learning_plan": MethodConfig(
        model=MODEL_FLASH_LITE,
        temperature=0.2,
        max_output_tokens=1024,
        json_mode=True,
        cache_ttl_seconds=0,  # never cache — depends on progress
        prompt_file="adapt_learning_plan.v1.txt",
    ),
    "answer_learning_question": MethodConfig(
        model=MODEL_FLASH_LITE,
        temperature=0.5,
        max_output_tokens=256,
        json_mode=False,  # plain text tutor
        cache_ttl_seconds=0,
        prompt_file="answer_learning_question.v1.txt",
    ),
    "generate_daily_tasks": MethodConfig(
        model=MODEL_FLASH_LITE,
        temperature=0.2,
        max_output_tokens=512,
        json_mode=True,
        cache_ttl_seconds=43200,  # 12 hours
        prompt_file="generate_daily_tasks.v1.txt",
    ),
    "generate_insights": MethodConfig(
        model=MODEL_FLASH_LITE,
        temperature=0.3,
        max_output_tokens=768,
        json_mode=True,
        cache_ttl_seconds=21600,  # 6 hours
        prompt_file="generate_insights.v1.txt",
    ),
    "parse_receipt": MethodConfig(
        model=MODEL_FLASH_LITE,
        temperature=0.1,
        max_output_tokens=1024,
        json_mode=True,
        cache_ttl_seconds=2592000,  # 30 days
        prompt_file="parse_receipt.v1.txt",
    ),
}
