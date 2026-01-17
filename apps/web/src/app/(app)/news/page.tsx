"use client";

import { useState, useEffect, useMemo } from "react";
import { Radio, Search, RadioReceiver, Loader2 } from "lucide-react";
import { NewsCard } from "@/components/news/news-card";
import { intelApi, IntelItem } from "@/lib/api";

const TOPICS = ["All", "US Election", "Fed", "Crypto", "Geopolitics", "AI", "Tech"];

// Map our internal topics to CryptoPanic filters
const FILTER_MAP: Record<string, string> = {
    "All": "all",
    "Crypto": "hot",
    "bullish": "bullish",
    "bearish": "bearish",
};

export default function NewsPage() {
    const [news, setNews] = useState<IntelItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("All");

    // Fetch news on mount
    useEffect(() => {
        const fetchNews = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const filter = FILTER_MAP[selectedTopic] || "all";
                const response = await intelApi.feed(filter, "all", 30);
                setNews(response.items);
            } catch (err) {
                console.error("Failed to fetch news:", err);
                setError("Failed to load news feed. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchNews();
    }, [selectedTopic]);

    // Client-side search filtering
    const filteredNews = useMemo(() => {
        if (!searchTerm) return news;

        return news.filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [news, searchTerm]);

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-4xl font-orbitron font-bold text-foreground drop-shadow-lg flex items-center gap-3">
                        <Radio className="w-8 h-8 text-primary animate-pulse" /> INTELLIGENCE STREAM
                    </h1>
                    <p className="text-foreground/60 font-light mt-2 max-w-xl">
                        Real-time aggregated global intel feed. Filter by topic to intercept market-moving signals.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                        <input
                            type="text"
                            placeholder="Search keywords (e.g. 'Rate Cut', 'Trump')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-sidebar-border rounded-sm pl-10 pr-4 py-3 font-mono text-sm focus:outline-none focus:border-primary text-foreground shadow-sm"
                        />
                    </div>

                    {/* Topic Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                        {TOPICS.map(topic => (
                            <button
                                key={topic}
                                onClick={() => setSelectedTopic(topic)}
                                className={`px-4 py-2 rounded-sm font-mono text-xs font-bold whitespace-nowrap border transition-all ${selectedTopic === topic
                                    ? "bg-primary text-black border-primary shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                                    : "bg-transparent border-sidebar-border text-foreground/60 hover:border-foreground/40 hover:text-foreground"
                                    }`}
                            >
                                {topic === "All" ? "// ALL FEEDS" : `#${topic.toUpperCase()}`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-3 font-mono text-foreground/60">SCANNING FREQUENCIES...</span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="text-center py-20 border border-dashed border-red-500/50 rounded-lg bg-red-500/5">
                    <RadioReceiver className="w-12 h-12 text-red-500/50 mx-auto mb-4" />
                    <h3 className="text-xl font-orbitron text-red-400">{error}</h3>
                    <button
                        onClick={() => setSelectedTopic(selectedTopic)}
                        className="mt-4 px-4 py-2 bg-red-500/20 border border-red-500 rounded-sm font-mono text-sm text-red-400 hover:bg-red-500/30"
                    >
                        RETRY CONNECTION
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredNews.length === 0 && (
                <div className="text-center py-20 border border-dashed border-sidebar-border rounded-lg">
                    <RadioReceiver className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-xl font-orbitron text-foreground/40">NO SIGNALS FOUND</h3>
                    <p className="font-mono text-xs text-foreground/30 mt-2">TRY ADJUSTING FREQUENCY FILTERS</p>
                </div>
            )}

            {/* News Feed */}
            {!isLoading && !error && filteredNews.length > 0 && (
                <div className="flex flex-col gap-4 max-w-4xl">
                    {filteredNews.map(item => (
                        <NewsCard
                            key={item.id}
                            item={{
                                id: item.id,
                                source: item.source as "Reuters" | "CoinDesk" | "Polymarket" | "X (Twitter)" | "Bloomberg" | "Financial Times",
                                headline: item.title,
                                summary: "",
                                url: item.url,
                                timestamp: new Date(item.published_at),
                                timeAgo: formatTimeAgo(item.published_at),
                                topics: [],
                                sentiment: "neutral",
                                impactScore: 50,
                                imageUrl: "",
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/**
 * Format a date string to relative time (e.g., "5m ago")
 */
function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}
