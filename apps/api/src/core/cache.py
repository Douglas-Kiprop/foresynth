import redis
import redis.asyncio as async_redis
from src.core.config import get_settings

_redis_client: redis.Redis | None = None
_async_redis_client: async_redis.Redis | None = None


def get_redis() -> redis.Redis:
    """Get or create Redis client singleton."""
    global _redis_client
    
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(
            settings.upstash_redis_url,
            decode_responses=True,
            socket_timeout=5.0
        )
    
    return _redis_client


def get_async_redis() -> async_redis.Redis:
    """Get or create Async Redis client singleton."""
    global _async_redis_client
    
    if _async_redis_client is None:
        settings = get_settings()
        _async_redis_client = async_redis.from_url(
            settings.upstash_redis_url,
            decode_responses=True,
            socket_timeout=5.0
        )
    
    return _async_redis_client


def get_cache() -> redis.Redis:
    return get_redis()

def get_async_cache() -> async_redis.Redis:
    return get_async_redis()
