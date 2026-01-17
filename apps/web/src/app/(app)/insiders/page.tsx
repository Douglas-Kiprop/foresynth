"use client";

import { useState, useEffect, useMemo } from "react";
import { Radar, RefreshCcw, Search, Loader2, AlertTriangle } from "lucide-react";
import { InsiderTable } from "@/components/insiders/insider-table";
import { signalsApi, InsiderSignal } from "@/lib/api";
import { cn } from "@/lib/utils";
import { InsiderTrade } from "@/lib/mock-insiders";

export default function InsidersPage() {
    const [apiData, setApiData] = useState<InsiderSignal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [minScore, setMinScore] = useState(0);
    const [maxAge, setMaxAge] = useState(30);
    const [searchTerm, setSearchTerm] = useState("");

    // Fetch from API
    const fetchSignals = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await signalsApi.feed(minScore, maxAge, 100);
            setApiData(response.signals);
        } catch (err) {
            console.error("Failed to fetch signals:", err);
            setError("Failed to load insider signals. Check if the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSignals();
    }, [minScore, maxAge]);

    // Transform API data to table format
    const tableData: InsiderTrade[] = useMemo(() => {
        return apiData.map(signal => ({
            id: signal.id,
            walletAddress: signal.wallet_address,
            walletName: signal.metadata.wallet_age_days && signal.metadata.wallet_age_days < 7 ? "🆕 Rookie" : undefined,
            profileUrl: "#",
            radarScore: signal.radar_score,
            marketTitle: signal.metadata.market_title || "Unknown Market",
            marketUrl: "#",
            side: (signal.metadata.side || "YES") as "YES" | "NO",
            size: signal.trade_size,
            priceEntry: 0.5,
            priceAverage: 0.5,
            priceCurrent: 0.5,
            timeSinceTrade: formatTimeAgo(signal.created_at),
            timestamp: new Date(signal.created_at),
            walletAgeDays: signal.metadata.wallet_age_days || 0,
            wakeTimeDelta: signal.metadata.wake_time || "N/A",
            wakeTimeSeconds: 0,
            speedRatio: signal.metadata.speed_ratio || 0,
            marketTradesCount: 1,
            marketVolume: signal.trade_size,
            volumeConcentration: 50,
            marketPnL: 0,
            totalTrades: 1,
            uniqueMarkets: 1,
            tradeConcentration: 100,
            openPositions: 1,
            openPositionsValue: signal.trade_size,
            totalPnL: 0,
            totalVolume: signal.trade_size,
            activeMarket: true,
            activeHold: true,
            txHash: "#",
        }));
    }, [apiData]);

    // Client-side search filtering
    const filteredData = useMemo(() => {
        if (!searchTerm) return tableData;
        const term = searchTerm.toLowerCase();
        return tableData.filter(item =>
            item.marketTitle.toLowerCase().includes(term) ||
            item.walletAddress.toLowerCase().includes(term)
        );
    }, [tableData, searchTerm]);

    return (
        <div className="space-y-6 animate-fade-in relative h-[calc(100vh-100px)] flex flex-col">
            {/* Header & Controls */}
            <div className="flex flex-col gap-6 shrink-0">
                <div>
                    <h1 className="text-4xl font-orbitron font-bold text-foreground drop-shadow-lg flex items-center gap-3">
                        <Radar className="w-8 h-8 text-primary animate-pulse" /> ANOMALY RADAR
                    </h1>
                    <p className="text-foreground/60 font-light mt-2 max-w-xl">
                        Real-time detection of high-conviction trades from fresh wallets.
                    </p>
                </div>

                <div className="flex flex-wrap items-end gap-4 p-4 border border-sidebar-border rounded-lg bg-black/20">
                    {/* Radar Score Filter - Toggle Buttons */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-foreground/40 uppercase">Min Confidence</label>
                        <div className="flex bg-black/40 border border-sidebar-border rounded-sm p-1">
                            {[0, 50, 80].map((score) => (
                                <button
                                    key={score}
                                    onClick={() => setMinScore(score)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-all flex-1",
                                        minScore === score
                                            ? "bg-primary text-black shadow-neon"
                                            : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {score === 0 ? "ALL" : score === 80 ? "EXTREME" : "HIGH"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age Filter - Toggle Buttons */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-foreground/40 uppercase">Max Wallet Age</label>
                        <div className="flex bg-black/40 border border-sidebar-border rounded-sm p-1 gap-1">
                            {[1, 3, 7, 30].map((age) => (
                                <button
                                    key={age}
                                    onClick={() => setMaxAge(age)}
                                    className={cn(
                                        "px-3 py-1.5 text-xs font-mono font-bold rounded-sm transition-all",
                                        maxAge === age
                                            ? "bg-primary text-black shadow-neon"
                                            : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    &lt;{age === 1 ? "24H" : `${age}D`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                            <input
                                type="text"
                                placeholder="Filter markets or wallets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-sidebar-border rounded-sm pl-9 pr-4 py-2 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                            />
                        </div>
                    </div>

                    <div className="border-l border-sidebar-border pl-4">
                        <button
                            onClick={fetchSignals}
                            disabled={isLoading}
                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-sm transition-all disabled:opacity-50"
                            title="Refresh Feed"
                        >
                            <RefreshCcw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Stats */}
            <div className="flex items-center justify-between text-xs font-mono text-foreground/40 shrink-0">
                <div>
                    {isLoading ? "SCANNING..." : `${filteredData.length} SIGNALS FOUND`}
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> HIGH RISK
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> MEDIUM
                    </span>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="ml-3 font-mono text-foreground/60">SCANNING BLOCKCHAIN...</span>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-yellow-500/50 rounded-lg bg-yellow-500/5 p-8">
                    <AlertTriangle className="w-12 h-12 text-yellow-500/70 mb-4" />
                    <h3 className="text-xl font-orbitron text-yellow-400">{error}</h3>
                    <p className="font-mono text-xs text-foreground/40 mt-2">
                        Make sure the backend is running at localhost:8000
                    </p>
                    <button
                        onClick={fetchSignals}
                        className="mt-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500 rounded-sm font-mono text-sm text-yellow-400 hover:bg-yellow-500/30"
                    >
                        RETRY CONNECTION
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredData.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-sidebar-border rounded-lg">
                    <Radar className="w-12 h-12 text-foreground/20 mb-4" />
                    <h3 className="text-xl font-orbitron text-foreground/40">NO SIGNALS DETECTED</h3>
                    <p className="font-mono text-xs text-foreground/30 mt-2">
                        The radar is scanning... Check back soon or adjust filters.
                    </p>
                </div>
            )}

            {/* Data Table */}
            {!isLoading && !error && filteredData.length > 0 && (
                <div className="flex-1 min-h-0">
                    <InsiderTable data={filteredData} />
                </div>
            )}
        </div>
    );
}

/**
 * Format a date string to relative time
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
