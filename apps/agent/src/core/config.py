"""
Foresynth Agent - Core Configuration

Centralized settings for the Agent service. Reads from its own .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Agent service settings loaded from environment variables."""

    # Supabase (shared)
    supabase_url: str
    supabase_key: str

    # Upstash Redis (shared)
    upstash_redis_url: str

    # Telegram (shared bot)
    telegram_bot_token: str = ""

    # LLM Provider (OpenRouter compatible)
    openai_api_key: str = ""
    openai_api_base: str = "https://openrouter.ai/api/v1"

    # Search / RAG
    tavily_api_key: str = ""

    # Agent Config
    agent_poll_interval: int = 300  # seconds between proactive scans
    agent_port: int = 8001

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
