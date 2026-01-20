"""
Foresynth API - Redis Cache Module

Redis client for caching and queues.
"""
import redis
from src.core.config import get_settings

_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Get or create Redis client singleton."""
    global _redis_client
    
    if _redis_client is None:
        settings = get_settings()
        # Supporting rediss:// and redis:// protocols
        _redis_client = redis.from_url(
            settings.upstash_redis_url,
            decode_responses=True,
            socket_timeout=5.0
        )
    
    return _redis_client


# Dependency for FastAPI
def get_cache() -> redis.Redis:
    """FastAPI dependency or internal accessor for Redis client."""
    return get_redis()
