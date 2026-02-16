"""
Foresynth Agent - Researcher Node

Gathers external news and web search results relevant to the markets
the agent is analyzing. This provides the LLM with real-world context
beyond raw price data.
"""
import logging
from src.state import AgentState, NewsItem
from src.tools.search import tavily_search, get_crypto_news

logger = logging.getLogger(__name__)


async def researcher_node(state: AgentState) -> dict:
    """
    Gather news and search results for each market in the snapshot.

    Reads: market_snapshots, user_config
    Writes: news_items, messages
    """
    snapshots = state.get("market_snapshots", [])
    user_config = state.get("user_config", {})
    sources = user_config.get("sources", ["watchlists", "news"])

    logger.info(f"🔍 Researcher: Gathering intelligence for {len(snapshots)} markets...")

    all_news: list[NewsItem] = []

    # ── 1. Targeted search per market (top 5 only to limit API calls) ──
    if "news" in sources:
        for snapshot in snapshots[:5]:
            question = snapshot.get("question", "")
            if not question:
                continue

            # Search for recent news/analysis about this market's topic
            search_results = await tavily_search(
                query=f"Polymarket prediction: {question}",
                max_results=3,
            )

            for r in search_results:
                item: NewsItem = {
                    "title": r.get("title", ""),
                    "source": r.get("source", "web"),
                    "url": r.get("url", ""),
                    "snippet": r.get("snippet", ""),
                    "relevance": "high",
                }
                all_news.append(item)

        # ── 2. General crypto / prediction market news ──────────────
        general_news = await get_crypto_news(limit=5)
        for n in general_news:
            item: NewsItem = {
                "title": n.get("title", ""),
                "source": n.get("source", "news"),
                "url": n.get("url", ""),
                "snippet": n.get("snippet", ""),
                "relevance": "medium",
            }
            all_news.append(item)

    msg = f"🔍 Researcher complete: {len(all_news)} news items gathered"
    logger.info(msg)

    return {
        "news_items": all_news,
        "messages": [msg],
    }
