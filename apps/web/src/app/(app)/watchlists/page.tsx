"use client";

import { useWatchlistStore } from "@/stores/watchlist-store";
import { WatchlistCard } from "@/components/watchlist/watchlist-card";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { SynthesizerModal } from "@/components/watchlist/synthesizer-modal";

export default function WatchlistsPage() {
    const { watchlists } = useWatchlistStore();
    const [isSynthesizerOpen, setIsSynthesizerOpen] = useState(false);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-orbitron font-bold text-foreground drop-shadow-lg">
                        OPERATOR DASHBOARD
                    </h1>
                    <p className="text-foreground/60 font-light mt-2 max-w-xl">
                        Monitor active signals, track volatility, and manage your prediction portfolio.
                        <span className="text-primary/60 ml-2 font-mono text-xs">// SYSTEM READY</span>
                    </p>
                </div>

                <button
                    onClick={() => setIsSynthesizerOpen(true)}
                    className="px-6 py-3 bg-primary text-black font-bold font-orbitron tracking-widest rounded-sm shadow-neon hover:scale-105 hover:bg-white hover:text-primary transition-all duration-300 flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    NEW SIGNAL
                </button>
            </div>

            {/* Grid Content */}
            {watchlists.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center border border-dashed border-sidebar-border rounded-lg bg-sidebar/20">
                    <div className="p-4 rounded-full bg-primary/10 mb-6 animate-pulse">
                        <Search className="w-8 h-8 text-primary shadow-neon" />
                    </div>
                    <h2 className="text-2xl font-orbitron text-foreground mb-2">NO SIGNALS DETECTED</h2>
                    <p className="text-foreground/40 font-mono text-sm mb-8">INITIATE A SCAN TO BEGIN TRACKING MARKETS</p>
                    <button
                        onClick={() => setIsSynthesizerOpen(true)}
                        className="px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-black font-orbitron tracking-wide transition-all duration-300 rounded-sm"
                    >
                        ACTIVATE SYNTHESIZER
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlists.map((watchlist) => (
                        <WatchlistCard key={watchlist.id} watchlist={watchlist} />
                    ))}
                </div>
            )}

            {isSynthesizerOpen && (
                <SynthesizerModal onClose={() => setIsSynthesizerOpen(false)} />
            )}
        </div>
    );
}
