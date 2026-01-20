"""
Foresynth API - Core Configuration

Centralized settings management using Pydantic. Reads from .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    database_url: str
    
    # Supabase
    supabase_url: str
    supabase_key: str
    
    # Upstash Redis
    upstash_redis_url: str
    
    # External APIs
    polymarket_api_key: str = ""
    polymarket_api_secret: str = ""
    cryptopanic_api_key: str = ""
    
    # Server
    debug: bool = True
    api_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
