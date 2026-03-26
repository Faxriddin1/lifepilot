from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Telegram
    BOT_TOKEN: str

    # LifePilot API
    LIFEPILOT_API_URL: str = "https://lifepilot.uz/api/v1"

    # Google Cloud
    GOOGLE_PROJECT_ID: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:lifepilot_prod_secret_2026@db:5432/productflow"
    REDIS_URL: str = "redis://redis:6379/1"

    # Rate limiting
    RATE_LIMIT_MESSAGES: int = 30
    RATE_LIMIT_PERIOD: int = 60
    RATE_LIMIT_AI_CALLS: int = 100
    RATE_LIMIT_AI_PERIOD: int = 3600

    # Encryption key for JWT storage
    ENCRYPTION_KEY: str = ""

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
