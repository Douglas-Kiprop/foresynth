"use client";

import { useState, useMemo } from "react";
import { X, Search, Plus, Check, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchMarkets, Market } from "@/lib/mock-data";

interface SynthesizerModalProps {
    onClose: () => void;
    onConfirm: (name: string, markets: Market[]) => void;
    initialName?: string;
    mode?: "create" | "add";
}

export function SynthesizerModal({ onClose, onConfirm, initialName = "", mode = "create" }: SynthesizerModalProps) {
    const [query, setQuery] = useState("");
    const [name, setName] = useState(initialName);
    const [selectedMarkets, setSelectedMarkets] = useState<Market[]>([]);
    const [isSynthesizing, setIsSynthesizing] = useState(false);

    const results = useMemo(() => {
        if (!query) return [];
        return searchMarkets(query);
    }, [query]);

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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Shorter delay

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
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="SEARCH MARKETS (e.g. Trump, Crypto, Fed)..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full bg-black/20 border border-sidebar-border rounded-sm py-4 pl-12 pr-4 text-lg font-mono focus:outline-none focus:border-primary/50 focus:shadow-neon transition-all"
                                autoFocus
                            />
                        </div>
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
                                                    VOL: ${(market.volume / 1000000).toFixed(1)}M • {market.outcome}: {market.probability}%
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
                                {mode === "create" ? "GENERATE" : "ADD SELECTED MARKETS"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
