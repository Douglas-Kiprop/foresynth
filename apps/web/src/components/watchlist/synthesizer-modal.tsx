"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Search, Plus, Check, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketsApi, Market as ApiMarket } from "@/lib/api";
import { Market } from "@/lib/mock-data";

interface SynthesizerModalProps {
    onClose: () => void;
    onConfirm: (name: string, markets: Market[]) => void;
    initialName?: string;
    mode?: "create" | "add";
}

/**
 * Debounce hook for search input
 */
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function SynthesizerModal({ onClose, onConfirm, initialName = "", mode = "create" }: SynthesizerModalProps) {
    const [query, setQuery] = useState("");
    const [name, setName] = useState(initialName);
    const [selectedMarkets, setSelectedMarkets] = useState<Market[]>([]);
    const [isSynthesizing, setIsSynthesizing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Market[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Debounce the search query
    const debouncedQuery = useDebounce(query, 300);

    // Search markets when query changes
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setResults([]);
            return;
        }

        const searchMarkets = async () => {
            setIsSearching(true);
            setSearchError(null);
            try {
                const response = await marketsApi.search(debouncedQuery, 15);
                // Transform API response to local Market format
                const markets: Market[] = response.markets.map(m => ({
                    id: m.id,
                    question: m.question,
                    volume: m.volume,
                    outcome: "Yes",
                    probability: Math.round(m.yes_price * 100),
                    endDate: m.end_date || null,
                    clob_token_id: m.clob_token_id,
                    history: Array.from({ length: 20 }, (_, i) => ({
                        value: Math.round(m.yes_price * 100) + (Math.random() * 10 - 5),
                        timestamp: Date.now() - (20 - i) * 86400000
                    })),
                }));
                setResults(markets);
            } catch (err) {
                console.error("Search failed:", err);
                setSearchError("Failed to search markets. Check if backend is running.");
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        searchMarkets();
    }, [debouncedQuery]);

    const handleToggle = (market: Market) => {
        if (selectedMarkets.find(m => m.id === market.id)) {
            setSelectedMarkets(prev => prev.filter(m => m.id !== market.id));
        } else {
            setSelectedMarkets(prev => [...prev, market]);
        }
    };

    const handleConfirm = async () => {
        if (mode === "create" && !name) return;
        if (selectedMarkets.length === 0) return;

        setIsSynthesizing(true);
        await new Promise(resolve => setTimeout(resolve, 500));

        onConfirm(name, selectedMarkets);
        setIsSynthesizing(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-background border border-sidebar-border shadow-[0_0_50px_rgba(6,182,212,0.15)] rounded-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-6 border-b border-sidebar-border flex items-center justify-between bg-sidebar/50">
                    <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                        <h2 className="font-orbitron font-bold text-xl tracking-widest text-primary">
                            {mode === "create" ? "SIGNAL SYNTHESIZER" : "ADD SIGNAL SOURCES"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-foreground/40 hover:text-foreground transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">

                    {/* Step 1: Search */}
                    <div className="space-y-4">
                        <label className="text-xs font-mono text-foreground/40">1. INPUT KEYWORDS</label>
                        <div className="relative group">
                            {isSearching ? (
                                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                            ) : (
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                            )}
                            <input
                                type="text"
                                placeholder="SEARCH POLYMARKET (e.g. Trump, Crypto, Fed)..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-black/20 border border-sidebar-border rounded-sm py-4 pl-12 pr-4 text-lg font-mono focus:outline-none focus:border-primary/50 focus:shadow-neon transition-all"
                                autoFocus
                            />
                        </div>
                        {searchError && (
                            <p className="text-xs text-red-400 font-mono">{searchError}</p>
                        )}
                    </div>

                    {/* Results Grid */}
                    {results.length > 0 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2">
                            <label className="text-xs font-mono text-foreground/40">DETECTED SIGNALS ({results.length})</label>
                            <div className="grid grid-cols-1 gap-2">
                                {results.map(market => {
                                    const isSelected = !!selectedMarkets.find(m => m.id === market.id);
                                    return (
                                        <button
                                            key={market.id}
                                            onClick={() => handleToggle(market)}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-sm border transition-all duration-200 text-left group",
                                                isSelected
                                                    ? "bg-primary/10 border-primary shadow-[inset_0_0_10px_rgba(6,182,212,0.2)]"
                                                    : "bg-white/5 border-transparent hover:border-sidebar-border hover:bg-white/10"
                                            )}
                                        >
                                            <div className="flex flex-col">
                                                <span className={cn("font-medium text-sm font-rajdhani", isSelected ? "text-primary" : "text-foreground")}>
                                                    {market.question}
                                                </span>
                                                <span className="text-xs text-foreground/40 font-mono mt-1">
                                                    VOL: ${(market.volume / 1000000).toFixed(1)}M • YES: {market.probability}%
                                                </span>
                                            </div>

                                            <div className={cn(
                                                "h-5 w-5 rounded-sm border flex items-center justify-center transition-colors",
                                                isSelected ? "bg-primary border-primary text-black" : "border-foreground/20 group-hover:border-foreground/50"
                                            )}>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Empty state when searching */}
                    {query.length >= 2 && !isSearching && results.length === 0 && !searchError && (
                        <div className="text-center py-8 border border-dashed border-sidebar-border rounded-lg">
                            <p className="text-foreground/40 font-mono text-sm">NO SIGNALS FOUND FOR &quot;{query}&quot;</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-sidebar-border bg-black/20 space-y-4">
                    {mode === "create" && (
                        <div className="space-y-4">
                            <label className="text-xs font-mono text-foreground/40">2. ASSIGN DESIGNATION</label>
                            <input
                                type="text"
                                placeholder="WATCHLIST NAME"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/20 border border-sidebar-border rounded-sm px-4 py-3 font-orbitron text-sm focus:outline-none focus:border-primary/50"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleConfirm}
                        disabled={(!name && mode === "create") || selectedMarkets.length === 0 || isSynthesizing}
                        className="w-full py-3 bg-primary text-black font-bold font-orbitron tracking-widest rounded-sm shadow-neon hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        {isSynthesizing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {mode === "create" ? "SYNTHESIZING..." : "ADDING..."}
                            </>
                        ) : (
                            <>
                                {mode === "create" ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                {mode === "create" ? `GENERATE (${selectedMarkets.length})` : `ADD ${selectedMarkets.length} MARKETS`}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
