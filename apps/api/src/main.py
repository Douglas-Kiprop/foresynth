"""
Foresynth API - Main Application Entry Point

FastAPI application with CORS, routers, and lifecycle management.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.routers import markets, watchlists, squads, signals, intel, notifications


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup
    settings = get_settings()
    print(f"🚀 Foresynth API starting in {'DEBUG' if settings.debug else 'PROD'} mode")
    yield
    # Shutdown
    print("👋 Foresynth API shutting down")


def create_app() -> FastAPI:
    """Application factory pattern."""
    settings = get_settings()
    
    app = FastAPI(
        title="Foresynth API",
        description="Backend for Polymarket Analytics & Trading Platform",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=f"{settings.api_prefix}/docs" if settings.debug else None,
        redoc_url=f"{settings.api_prefix}/redoc" if settings.debug else None,
    )
    
    # CORS - Allow frontend origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",
            "https://*.vercel.app",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register routers
    prefix = settings.api_prefix
    app.include_router(markets.router, prefix=f"{prefix}/markets", tags=["Markets"])
    app.include_router(watchlists.router, prefix=f"{prefix}/watchlists", tags=["Watchlists"])
    app.include_router(squads.router, prefix=f"{prefix}/squads", tags=["Squads"])
    app.include_router(signals.router, prefix=f"{prefix}/signals", tags=["Signals"])
    app.include_router(intel.router, prefix=f"{prefix}/intel", tags=["Intel"])
    app.include_router(notifications.router, prefix=f"{prefix}/notifications", tags=["Notifications"])
    
    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "0.1.0"}
    
    return app


app = create_app()
