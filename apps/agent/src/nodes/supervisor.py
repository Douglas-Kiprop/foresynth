"""
Foresynth Agent - Supervisor Node

The routing brain. Determines the execution order of the graph.
In this architecture it's a simple sequential pipeline, but structured
as a supervisor for future extensibility (e.g., conditional re-routing,
user-driven queries, or iterative refinement loops).
"""
import logging
from src.state import AgentState

logger = logging.getLogger(__name__)


async def supervisor_node(state: AgentState) -> dict:
    """
    Route the graph to the next node based on the current state.

    Execution order:
      1. context → 2. market_analyst → 3. researcher → 4. advisor → END

    Reads: next_node (or determines from current state)
    Writes: next_node, messages
    """
    task = state.get("task", "proactive_scan")

    # Determine next step based on what's been populated
    # We check if the key exists (is not None) to handle empty results (e.g. empty watchlist)
    has_context = state.get("watchlist_markets") is not None
    has_market_data = state.get("market_snapshots") is not None
    has_research = state.get("news_items") is not None
    has_decisions = state.get("decisions") is not None

    if not has_context:
        next_node = "context"
    elif not has_market_data:
        next_node = "market_analyst"
    elif not has_research:
        next_node = "researcher"
    elif not has_decisions:
        next_node = "advisor"
    else:
        next_node = "END"

    logger.info(f"🎯 Supervisor: task={task} → routing to {next_node}")

    return {
        "next_node": next_node,
        "messages": [f"🎯 Routing → {next_node}"],
    }
