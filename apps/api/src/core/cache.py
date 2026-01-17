"""
Foresynth API - Redis Cache Module

Upstash Redis client for caching and queues.
"""
from upstash_redis import Redis
from src.core.config import get_settings

_redis_client: Redis | None = None


def get_redis() -> Redis:
    """Get or create Redis client singleton."""
    global _redis_client
    
    if _redis_client is None:
        settings = get_settings()
        _redis_client = Redis.from_url(settings.upstash_redis_url)
    
    return _redis_client


# Dependency for FastAPI
async def get_cache() -> Redis:
    """FastAPI dependency for Redis client."""
    return get_redis()
