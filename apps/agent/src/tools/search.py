"""
Foresynth Agent - Search / RAG Tools

Web search and news retrieval for the Researcher node.
Uses Tavily for search; falls back to CryptoPanic headlines.
"""
import httpx
import logging
from src.core.config import get_settings

logger = logging.getLogger(__name__)


async def tavily_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Perform a web search using Tavily API.
    Returns list of {title, url, content/snippet}.
    """
    settings = get_settings()
    if not settings.tavily_api_key:
        logger.warning("Tavily API key not set, falling back to empty results")
        return []

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": settings.tavily_api_key,
                    "query": query,
                    "max_results": max_results,
                    "search_depth": "advanced",
                    "include_answer": True,
                },
            )
            resp.raise_for_status()
            data = resp.json()

            results = []
            for item in data.get("results", []):
                results.append(
                    {
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("content", "")[:500],
                        "source": "tavily",
                    }
                )
            return results
    except Exception as e:
        logger.error(f"Tavily search error: {e}")
        return []


async def get_crypto_news(limit: int = 10) -> list[dict]:
    """
    Fetch latest crypto / prediction market news headlines.
    Uses a simple news API or curated RSS approach.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://min-api.cryptocompare.com/data/v2/news/",
                params={"lang": "EN", "sortOrder": "latest"},
            )
            resp.raise_for_status()
            data = resp.json()

            results = []
            for item in data.get("Data", [])[:limit]:
                results.append(
                    {
                        "title": item.get("title", ""),
                        "url": item.get("url", ""),
                        "snippet": item.get("body", "")[:400],
                        "source": item.get("source", "cryptocompare"),
                    }
                )
            return results
    except Exception as e:
        logger.error(f"Crypto news fetch error: {e}")
        return []
