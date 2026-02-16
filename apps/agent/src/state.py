"""
Foresynth Agent - Graph State

Defines the TypedDict state that flows through the LangGraph.
Every node reads from and writes to this shared state object.
"""
from __future__ import annotations

from typing import TypedDict, Literal, Annotated
from operator import add


class MarketSnapshot(TypedDict, total=False):
    """Data collected about a single market."""
    token_id: str
    question: str
    slug: str
    outcome_yes_price: float
    outcome_no_price: float
    volume_24h: float
    liquidity: float
    end_date: str


class WalletActivity(TypedDict, total=False):
    """Recent trade from a tracked wallet."""
    wallet: str
    side: str
    shares: float
    price: float
    usd_size: float
    market_slug: str


class NewsItem(TypedDict, total=False):
    """A piece of research / news context."""
    title: str
    source: str
    url: str
    snippet: str
    relevance: str  # e.g. "high", "medium", "low"


class Decision(TypedDict, total=False):
    """A single agent recommendation."""
    market_question: str
    market_slug: str
    signal: Literal["BUY_YES", "BUY_NO", "HOLD", "SKIP"]
    confidence: float  # 0.0 → 1.0
    reasoning: str  # The decision path explanation
    key_factors: list[str]
    risk_level: Literal["low", "medium", "high"]


class AgentState(TypedDict, total=False):
    """
    The shared state object that flows through every node in the graph.
    
    Fields are populated progressively as the graph executes:
      1. Supervisor seeds `user_id` and `task`
      2. ContextNode fills `watchlist_markets`, `tracked_wallets`, `user_config`
      3. MarketAnalystNode fills `market_snapshots`, `smart_money_trades`
      4. ResearcherNode fills `news_items`
      5. AdvisorNode produces `decisions`
    """

    # ── Inputs ──────────────────────────────────────────────────
    user_id: str
    task: str  # e.g. "proactive_scan" or "analyze_market:<slug>"

    # ── User Config ─────────────────────────────────────────────
    user_config: dict  # From agent_configs table

    # ── Context (from Supabase) ─────────────────────────────────
    watchlist_markets: list[dict]  # Markets the user is watching
    tracked_wallets: list[str]    # Wallet addresses from squads

    # ── Market Data ─────────────────────────────────────────────
    market_snapshots: list[MarketSnapshot]
    smart_money_trades: list[WalletActivity]

    # ── Research ────────────────────────────────────────────────
    news_items: list[NewsItem]

    # ── Output ──────────────────────────────────────────────────
    decisions: list[Decision]

    # ── Routing ─────────────────────────────────────────────────
    next_node: str  # Set by supervisor to route control flow
    messages: Annotated[list, add]  # Accumulator for intermediate messages / logs
