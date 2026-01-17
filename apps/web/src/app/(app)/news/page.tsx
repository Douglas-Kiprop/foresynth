"use client";

import { useState, useMemo } from "react";
import { Radio, Search, SlidersHorizontal, RadioReceiver } from "lucide-react";
import { generateNews } from "@/lib/mock-news";
import { NewsCard } from "@/components/news/news-card";

const TOPICS = ["All", "US Election", "Fed", "Crypto", "Geopolitics", "AI", "Tech"];

export default function NewsPage() {
    const [news, setNews] = useState(() => generateNews(30));
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("All");

    const filteredNews = useMemo(() => {
        return news.filter(item => {
            const matchSearch = searchTerm === "" ||
                item.headline.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.summary.toLowerCase().includes(searchTerm.toLowerCase());

            const matchTopic = selectedTopic === "All" || item.topics.includes(selectedTopic);

            return matchSearch && matchTopic;
        });
    }, [news, searchTerm, selectedTopic]);

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

            {/* Staggered Feed */}
            {filteredNews.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-sidebar-border rounded-lg">
                    <RadioReceiver className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-xl font-orbitron text-foreground/40">NO SIGNALS FOUND</h3>
                    <p className="font-mono text-xs text-foreground/30 mt-2">TRY ADJUSTING FREQUENCY FILTERS</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4 max-w-4xl">
                    {filteredNews.map(item => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
