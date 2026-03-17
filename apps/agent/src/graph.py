"""
Foresynth Agent - LangGraph Definition

Wires all nodes into a StateGraph with conditional routing.

Graph Flow:
  START → supervisor → (context | market_analyst | researcher | advisor | chat) → supervisor → ... → END
  
The Supervisor node acts as the router, examining the current state
and deciding which node should execute next.
"""
import logging
from langgraph.graph import StateGraph, END

from src.state import AgentState
from src.nodes.supervisor import supervisor_node
from src.nodes.context import context_node
from src.nodes.market import market_analyst_node
from src.nodes.researcher import researcher_node
from src.nodes.advisor import advisor_node
from src.nodes.chat import chat_node

logger = logging.getLogger(__name__)


def _route_from_supervisor(state: AgentState) -> str:
    """Conditional edge: read next_node from state and route accordingly."""
    next_node = state.get("next_node", "END")
    if next_node == "END":
        return END
    return next_node


def build_graph() -> StateGraph:
    """
    Construct and compile the Foresynth Advisor graph.
    
    Returns a compiled LangGraph that can be invoked with:
        result = await graph.ainvoke({"user_id": "...", "task": "proactive_scan"})
    """
    graph = StateGraph(AgentState)

    # ── Register nodes ─────────────────────────────────────────
    graph.add_node("supervisor", supervisor_node)
    graph.add_node("context", context_node)
    graph.add_node("market_analyst", market_analyst_node)
    graph.add_node("researcher", researcher_node)
    graph.add_node("advisor", advisor_node)
    graph.add_node("chat", chat_node)

    # ── Entry point ────────────────────────────────────────────
    graph.set_entry_point("supervisor")

    # ── Edges ──────────────────────────────────────────────────
    # Supervisor routes to the appropriate next node
    graph.add_conditional_edges(
        "supervisor",
        _route_from_supervisor,
        {
            "context": "context",
            "market_analyst": "market_analyst",
            "researcher": "researcher",
            "advisor": "advisor",
            "chat": "chat",
            END: END,
        },
    )

    # Each worker node returns to the supervisor for the next routing decision
    graph.add_edge("context", "supervisor")
    graph.add_edge("market_analyst", "supervisor")
    graph.add_edge("researcher", "supervisor")
    graph.add_edge("advisor", "supervisor")
    graph.add_edge("chat", "supervisor")

    # ── Compile ────────────────────────────────────────────────
    compiled = graph.compile()
    logger.info("🧬 Foresynth Agent graph compiled successfully")
    return compiled


# Singleton compiled graph
_compiled_graph = None


def get_graph():
    """Get or create the compiled graph singleton."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph
