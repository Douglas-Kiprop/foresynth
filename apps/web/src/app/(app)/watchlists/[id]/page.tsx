"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useWatchlistStore } from "@/stores/watchlist-store";
import { AlertDrawer } from "@/components/watchlist/alert-drawer";
import { SynthesizerModal } from "@/components/watchlist/synthesizer-modal";
import { Market } from "@/lib/mock-data";
import { ArrowLeft, Bell, Calendar, TrendingUp, BarChart3, Settings, Trash2, Plus, ExternalLink, MoreVertical } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";

export default function WatchlistDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    const router = useRouter();
    const { watchlists, deleteWatchlist, addMarketToWatchlist, removeMarketFromWatchlist } = useWatchlistStore();

    const [watchlist, setWatchlist] = useState<any>(null);
    const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [activeSettingsId, setActiveSettingsId] = useState<string | null>(null);

    useEffect(() => {
        const found = watchlists.find(w => w.id === id);
        if (found) {
            setWatchlist(found);
        } else {
            // Only redirect if we are sure it's loaded and truly missing.
            // For now, if undefined, we just wait.
        }
    }, [id, watchlists]);

    const handleDeleteWatchlist = () => {
        if (confirm("Terminate this watchlist signal? This action cannot be undone.")) {
            deleteWatchlist(id);
            router.push('/watchlists');
        }
    };

    const handleAddMarkets = (_: any, markets: Market[]) => {
        markets.forEach(m => addMarketToWatchlist(id, m));
    };

    const handleRemoveMarket = (marketId: string) => {
        if (confirm("Disconnect this market signal?")) {
            removeMarketFromWatchlist(id, marketId);
            setActiveSettingsId(null);
        }
    };

    if (!watchlist) return null;

    return (
        <div className="space-y-6 animate-fade-in pb-20" onClick={() => setActiveSettingsId(null)}>

            {/* Breadcrumb / Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/watchlists" className="p-2 rounded-full border border-sidebar-border hover:bg-white/5 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-foreground/60" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-orbitron font-bold text-foreground flex items-center gap-3">
                            {watchlist.name}
                            <span className="text-sm px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">LIVE</span>
                        </h1>
                        <p className="text-foreground/40 font-mono text-sm mt-1">
                            MONITOR ID: {watchlist.id.slice(0, 8)} • {watchlist.markets.length} MARKETS TRACKING
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-sidebar-border hover:bg-primary/20 hover:border-primary hover:text-primary transition-all rounded-sm font-orbiron font-bold text-sm"
                    >
                        <Plus className="w-4 h-4" /> ADD MARKETS
                    </button>
                    <button
                        onClick={handleDeleteWatchlist}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-900/50 hover:bg-red-500/20 text-red-400 transition-all rounded-sm font-orbiron font-bold text-sm"
                    >
                        <Trash2 className="w-4 h-4" /> TERMINATE
                    </button>
                </div>
            </div>

            {/* Markets List (Grid/Table Hybrid) */}
            <div className="space-y-4">
                {watchlist.markets.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-sidebar-border rounded-lg bg-black/20">
                        <p className="text-foreground/40 font-mono">NO SIGNALS ACTIVE. ADD MARKETS TO RESUME MONITORING.</p>
                    </div>
                )}

                {watchlist.markets.map((market: Market) => (
                    <div
                        key={market.id}
                        className="group relative bg-sidebar/30 border border-sidebar-border rounded-lg overflow-visible transition-all hover:bg-black/40 hover:border-sidebar-border hover:shadow-lg"
                    >
                        <div className="flex flex-col md:flex-row items-center">

                            {/* Left: Info & Stats */}
                            <div className="flex-1 p-6 min-w-0">
                                <div className="flex items-start justify-between mb-4">
                                    <h3 className="text-lg font-rajdhani font-bold text-foreground truncate pr-4">
                                        {market.question}
                                    </h3>
                                    <div className={cn(
                                        "px-3 py-1 rounded-sm font-mono text-xs font-bold shrink-0",
                                        market.probability > 50 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                    )}>
                                        {market.probability}% {market.outcome}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono text-foreground/40">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" /> VOLUME</span>
                                        <span className="text-foreground">${(market.volume / 1000000).toFixed(1)}M</span>
                                    </div>
                                    {market.createdDate && (
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> CREATED</span>
                                            <span className="text-foreground">
                                                {market.createdDate ? format(new Date(market.createdDate), 'MMM d, yyyy') : "N/A"}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> END DATE</span>
                                        <span className="text-foreground">
                                            {market.endDate ? format(new Date(market.endDate), 'MMM d, yyyy') : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Middle: Chart (Mini) */}
                            <div className="w-full md:w-48 h-24 p-4 border-t md:border-t-0 md:border-l border-sidebar-border bg-black/20 opacity-60 group-hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={market.history}>
                                        <Line
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#06b6d4"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Right: Actions */}
                            <div className="flex md:flex-col border-t md:border-t-0 md:border-l border-sidebar-border w-full md:w-16 divide-x md:divide-x-0 md:divide-y divide-sidebar-border bg-black/40 relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedMarket(market); }}
                                    className="flex-1 p-3 flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                                    title="Configure Alerts"
                                >
                                    <Bell className="w-5 h-5" />
                                </button>

                                {/* Settings Toggle */}
                                <div className="relative flex-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveSettingsId(activeSettingsId === market.id ? null : market.id);
                                        }}
                                        className={cn(
                                            "w-full h-full p-3 flex items-center justify-center hover:bg-white/10 transition-colors",
                                            activeSettingsId === market.id && "bg-white/10 text-primary"
                                        )}
                                    >
                                        <Settings className="w-5 h-5" />
                                    </button>

                                    {/* Context Menu */}
                                    {activeSettingsId === market.id && (
                                        <div className="absolute right-full top-0 mt-2 mr-2 w-48 bg-black border border-sidebar-border rounded-sm shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                                            <button className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-white/5 text-foreground/80 text-sm">
                                                <ExternalLink className="w-4 h-4" /> View Market
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMarket(market.id); }}
                                                className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-red-500/10 text-red-400 text-sm border-t border-sidebar-border"
                                            >
                                                <Trash2 className="w-4 h-4" /> Remove Signal
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {selectedMarket && (
                <AlertDrawer
                    market={selectedMarket}
                    onClose={() => setSelectedMarket(null)}
                    onSave={(config) => {
                        console.log("Saving Alert Config", config);
                        setSelectedMarket(null);
                    }}
                />
            )}

            {isAddOpen && (
                <SynthesizerModal
                    mode="add"
                    onClose={() => setIsAddOpen(false)}
                    onConfirm={handleAddMarkets}
                />
            )}
        </div>
    );
}
