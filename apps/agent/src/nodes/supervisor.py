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
      - proactive_scan: context → market_analyst → researcher → advisor → END
      - chat:           context → chat → END

    Reads: next_node (or determines from current state)
    Writes: next_node, messages
    """
    task = state.get("task", "proactive_scan")

    # Determine next step based on what's been populated
    has_context = state.get("watchlist_markets") is not None
    has_market_data = state.get("market_snapshots") is not None
    has_research = state.get("news_items") is not None
    has_decisions = state.get("decisions") is not None

    if task == "chat":
        # Chat flow: context → chat → END
        if not has_context:
            next_node = "context"
        elif not state.get("chat_replied"):
            next_node = "chat"
        else:
            next_node = "END"
    else:
        # Default proactive scan / analysis flow
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
