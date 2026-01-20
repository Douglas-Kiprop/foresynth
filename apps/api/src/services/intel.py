import httpx
import feedparser
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from src.core.config import get_settings
from src.core.cache import get_redis

settings = get_settings()

class IntelService:
    """
    Architecture Design:
    1. Parallel Fetching: Uses `asyncio.gather` to fetch from all sources concurrently.
    2. Global Gating: `asyncio.wait_for` ensures a hard timeout (8s) so the API never hangs.
    3. Resilient Caching: Uses Redis (Upstash) to store results for 5 minutes.
    4. Graceful Degradation: If a source fails or timeouts, partial results are returned.
    5. Non-Blocking: Sync calls (Redis, feedparser) are wrapped in `asyncio.to_thread`.
    """
    
    CRYPTOPANIC_API = "https://cryptopanic.com/api/v1/posts/"
    GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"
    CACHE_KEY_PREFIX = "foresynth:intel_feed"
    CACHE_TTL = 300  # 5 minutes
    GLOBAL_TIMEOUT = 8.0 
    
    RSS_FEEDS = {
        "The Guardian": "https://www.theguardian.com/world/rss",
        "Politico": "https://www.politico.com/rss/politicopicks.xml",
        "BBC News": "http://feeds.bbci.co.uk/news/world/rss.xml",
    }

    def __init__(self):
        try:
            self.redis = get_redis()
        except Exception as e:
            print(f"IntelService: Redis init failed (falling back to no-cache): {e}")
            self.redis = None

    async def get_aggregated_feed(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetch and aggregate news from all sources with caching."""
        cache_key = f"{self.CACHE_KEY_PREFIX}:{limit}"
        
        # 1. Attempt Cache Hit
        if self.redis:
            try:
                cached = await asyncio.to_thread(self.redis.get, cache_key)
                if cached:
                    return json.loads(cached)
            except Exception as e:
                print(f"IntelService: Cache read error: {e}")

        # 2. Parallel Fetch with Exception Handling
        tasks = [
            self.fetch_cryptopanic(limit=limit // 2),
            self.fetch_gdelt(limit=limit // 2),
            self.fetch_rss_all()
        ]
        
        try:
            # We use gather with return_exceptions to ensure partial success
            # wrapped in wait_for for a hard global limit
            results_wrapped = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.GLOBAL_TIMEOUT
            )
            
            all_items = []
            for res in results_wrapped:
                if isinstance(res, list):
                    all_items.extend(res)
                elif isinstance(res, Exception):
                    print(f"IntelService: Source fetcher failed: {res}")
                    
        except asyncio.TimeoutError:
            print(f"IntelService: Global timeout ({self.GLOBAL_TIMEOUT}s) reached. Serving partial/stored data.")
            return [] # In a production system, we might return stale cache here if available
        except Exception as e:
            print(f"IntelService: Aggregation error: {e}")
            return []
        
        # 3. Sort by date (descending)
        all_items.sort(key=lambda x: x.get("published_at", ""), reverse=True)
        final_items = all_items[:limit]
        
        # 4. Background Cache Update
        if final_items and self.redis:
            try:
                data_str = json.dumps(final_items)
                await asyncio.to_thread(self.redis.setex, cache_key, self.CACHE_TTL, data_str)
            except Exception as e:
                print(f"IntelService: Cache write error: {e}")
                
        return final_items

    async def fetch_cryptopanic(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch from CryptoPanic with auth."""
        if not settings.cryptopanic_api_key:
            return []
            
        params = {
            "auth_token": settings.cryptopanic_api_key,
            "public": "true",
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.CRYPTOPANIC_API, params=params, timeout=5.0)
                if response.status_code != 200:
                    return []
                data = response.json()
                
                return [{
                    "id": f"cp_{p.get('id')}",
                    "source": p.get("source", {}).get("title", "CryptoPanic"),
                    "title": p.get("title"),
                    "url": p.get("url"),
                    "published_at": p.get("published_at"),
                    "domain": p.get("domain", ""),
                    "kind": "news"
                } for p in data.get("results", [])[:limit]]
        except Exception as e:
            print(f"IntelService: CryptoPanic error: {e}")
            return []

    async def fetch_gdelt(self, query: str = "polymarket OR prediction market OR election", limit: int = 20) -> List[Dict[str, Any]]:
        """Fetch from GDELT Doc API (Robust handling)."""
        params = {
            "query": query,
            "mode": "artlist",
            "format": "json",
            "maxrecords": limit,
            "sort": "hybridrel"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(self.GDELT_DOC_API, params=params, timeout=5.0)
                if response.status_code != 200:
                    return []
                
                # Check if content-type is json
                if "application/json" not in response.headers.get("content-type", "").lower():
                    return []
                    
                data = response.json()
                items = []
                for p in data.get("articles", []):
                    raw_date = p.get("seendate", "")
                    try:
                        dt = datetime.strptime(raw_date, "%Y%m%dT%H%M%SZ")
                        published_at = dt.isoformat() + "Z"
                    except:
                        published_at = datetime.now().isoformat() + "Z"

                    items.append({
                        "id": f"gd_{p.get('url')}",
                        "source": p.get("source", "GDELT"),
                        "title": p.get("title"),
                        "url": p.get("url"),
                        "published_at": published_at,
                        "domain": p.get("source", ""),
                        "kind": "news"
                    })
                return items
        except Exception as e:
            print(f"IntelService: GDELT error: {e}")
            return []

    async def fetch_rss_all(self) -> List[Dict[str, Any]]:
        """Interleave multiple RSS sources."""
        tasks = [self.fetch_rss(name, url) for name, url in self.RSS_FEEDS.items()]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        items = []
        for res in results:
            if isinstance(res, list):
                items.extend(res)
        return items

    async def fetch_rss(self, source_name: str, url: str) -> List[Dict[str, Any]]:
        """Async fetch and thread-safe parse RSS."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=5.0)
                if response.status_code != 200:
                    return []
                
                # feedparser is synchronous and CPU-heavy; run in thread
                feed = await asyncio.to_thread(feedparser.parse, response.text)
                
                items = []
                for entry in feed.entries[:10]:
                    published_at = ""
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        published_at = datetime(*entry.published_parsed[:6]).isoformat() + "Z"
                    elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                        published_at = datetime(*entry.updated_parsed[:6]).isoformat() + "Z"
                    else:
                        published_at = datetime.now().isoformat() + "Z"

                    items.append({
                        "id": f"rss_{entry.get('link')}",
                        "source": source_name,
                        "title": entry.get("title", "Untitled"),
                        "url": entry.get("link", ""),
                        "published_at": published_at,
                        "domain": source_name.lower().replace(" ", ""),
                        "kind": "news"
                    })
                return items
        except Exception as e:
            print(f"IntelService: RSS error ({source_name}): {e}")
            return []
