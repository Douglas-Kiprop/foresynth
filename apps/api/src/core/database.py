"""
Foresynth API - Database Module

Supabase client and connection management.
"""
from supabase import create_client, Client
from src.core.config import get_settings

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client singleton."""
    global _supabase_client
    
    if _supabase_client is None:
        settings = get_settings()
        _supabase_client = create_client(
            settings.supabase_url,
            settings.supabase_key
        )
    
    return _supabase_client


# Dependency for FastAPI
async def get_db() -> Client:
    """FastAPI dependency for Supabase client."""
    return get_supabase()
