"""
Foresynth Agent - Service Entry Point

FastAPI application that exposes the agent as an HTTP service.
Also runs the proactive "Decision Feed" loop in the background.

Run with:
    cd apps/agent
    uvicorn src.main:app --port 8001 --reload
"""
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.core.config import get_settings
from src.core.database import get_supabase
from src.graph import get_graph
from src.tools.supabase_tools import save_agent_decision
from src.notifications import send_decision_to_telegram

# ── Logging ────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("foresynth.agent")


# ── Background Decision Feed Loop ─────────────────────────────
def _sync_get_active_configs():
    """Run synchronous Supabase query in a thread to avoid blocking the event loop."""
    db = get_supabase()
    return (
        db.table("agent_configs")
        .select("user_id, risk_profile, focus_sectors, sources")
        .eq("is_active", True)
        .execute()
    )


async def decision_feed_loop():
    """
    Proactive scan loop — runs on a timer, analyzes each user's
    context, and pushes high-conviction insights to Telegram.
    """
    settings = get_settings()
    interval = settings.agent_poll_interval

    logger.info(f"🤖 Decision Feed Loop started (interval: {interval}s)")

    # Wait a few seconds so the HTTP server is fully ready before the first scan
    await asyncio.sleep(5)

    while True:
        try:
            graph = get_graph()

            # Run the synchronous Supabase call in a thread so we don't block uvicorn
            configs_resp = await asyncio.to_thread(_sync_get_active_configs)

            users = configs_resp.data or []
            if not users:
                logger.info("🤖 Decision Feed: No active agent configs, sleeping...")
                await asyncio.sleep(interval)
                continue

            logger.info(f"🤖 Decision Feed: Scanning for {len(users)} users...")

            for user_config in users:
                user_id = user_config["user_id"]
                try:
                    # Yield control briefly so HTTP requests can be served
                    await asyncio.sleep(0)

                    # Run the full graph for this user
                    result = await graph.ainvoke(
                        {
                            "user_id": user_id,
                            "task": "proactive_scan",
                            "messages": [],
                        }
                    )

                    decisions = result.get("decisions", [])
                    if not decisions:
                        continue

                    # Filter to high-conviction signals only
                    risk = user_config.get("risk_profile", "moderate")
                    threshold = {"conservative": 0.8, "moderate": 0.65, "degen": 0.5}.get(risk, 0.65)

                    actionable = [d for d in decisions if d.get("confidence", 0) >= threshold and d.get("signal") != "SKIP"]

                    for decision in actionable:
                        # Persist to feed
                        await save_agent_decision(user_id, decision)
                        # Push to Telegram
                        await send_decision_to_telegram(user_id, decision)

                    if actionable:
                        logger.info(f"🤖 {len(actionable)} insights pushed to user {user_id[:8]}")

                except Exception as e:
                    logger.error(f"🤖 Decision Feed error for user {user_id[:8]}: {e}")

        except Exception as e:
            logger.error(f"🤖 Decision Feed global error: {e}")

        await asyncio.sleep(interval)


# ── FastAPI Lifespan ───────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background tasks on startup, clean up on shutdown."""
    logger.info("🚀 Foresynth Agent Service starting...")
    task = asyncio.create_task(decision_feed_loop())
    yield
    task.cancel()
    logger.info("🛑 Foresynth Agent Service shutting down.")


# ── App ────────────────────────────────────────────────────────
app = FastAPI(
    title="Foresynth Agent",
    description="Intelligent Advisor for Polymarket prediction markets",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────────
class AnalyzeRequest(BaseModel):
    user_id: str
    task: str = "proactive_scan"  # or "analyze_market:<slug>"


class ChatRequest(BaseModel):
    user_id: str
    chat_id: str          # Telegram chat ID
    message: str           # The user's text message


class DecisionResponse(BaseModel):
    market_question: str = ""
    market_slug: str = ""
    signal: str = "HOLD"
    confidence: float = 0.0
    reasoning: str = ""
    key_factors: list[str] = []
    risk_level: str = "medium"


class AnalyzeResponse(BaseModel):
    decisions: list[DecisionResponse] = []
    messages: list[str] = []


# ── Routes ─────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "foresynth-agent", "timestamp": datetime.now().isoformat()}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    """
    Run the agent graph for a specific user on demand.
    Used by the main API to proxy requests, or for manual testing.
    """
    try:
        graph = get_graph()
        result = await graph.ainvoke(
            {
                "user_id": request.user_id,
                "task": request.task,
                "messages": [],
            }
        )

        return AnalyzeResponse(
            decisions=result.get("decisions", []),
            messages=result.get("messages", []),
        )
    except Exception as e:
        logger.error(f"Analyze endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat(request: ChatRequest):
    """
    Handle a chat message from Telegram.
    Invokes the agent graph in 'chat' mode and sends the reply to Telegram.
    """
    try:
        graph = get_graph()
        result = await graph.ainvoke(
            {
                "user_id": request.user_id,
                "task": "chat",
                "current_message": request.message,
                "telegram_chat_id": request.chat_id,
                "messages": [],
            }
        )
        return {
            "status": "ok",
            "messages": result.get("messages", []),
        }
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/decisions/{user_id}")
async def get_decisions(user_id: str, limit: int = 20):
    """Fetch recent agent decisions for a user (for the web feed)."""
    try:
        db = get_supabase()
        resp = (
            db.table("agent_decisions")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        return {"decisions": resp.data or []}
    except Exception as e:
        logger.error(f"Get decisions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
