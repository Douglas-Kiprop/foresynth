"use client";

import { useState, useMemo } from "react";
import { Radar, Filter, RefreshCcw, Search } from "lucide-react";
import { generateInsiders } from "@/lib/mock-insiders";
import { InsiderTable } from "@/components/insiders/insider-table";
import { cn } from "@/lib/utils";

export default function InsidersPage() {
    const [data, setData] = useState(() => generateInsiders(50));

    // Filters
    const [minScore, setMinScore] = useState(50);
    const [maxAge, setMaxAge] = useState(30);
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        return data.filter(item => {
            const matchScore = item.radarScore >= minScore;
            const matchAge = item.walletAgeDays <= maxAge;
            const matchSearch = searchTerm === "" ||
                item.marketTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.walletAddress.toLowerCase().includes(searchTerm.toLowerCase());

            return matchScore && matchAge && matchSearch;
        });
    }, [data, minScore, maxAge, searchTerm]);

    const handleRegenerate = () => {
        // Simulate live refresh
        const newData = generateInsiders(50);
        setData(newData);
    };

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

                    {/* Radar Score Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-foreground/40 uppercase">Min Confidence</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0"
                                max="90"
                                step="10"
                                value={minScore}
                                onChange={(e) => setMinScore(Number(e.target.value))}
                                className="w-32 accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-mono font-bold text-primary min-w-[30px]">{minScore}%</span>
                        </div>
                    </div>

                    {/* Age Filter */}
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-foreground/40 uppercase">Max Wallet Age</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="1"
                                max="365"
                                value={maxAge}
                                onChange={(e) => setMaxAge(Number(e.target.value))}
                                className="w-32 accent-primary h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-mono font-bold text-primary min-w-[30px]">{maxAge}d</span>
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
                            onClick={handleRegenerate}
                            className="p-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-sm transition-all"
                            title="Refresh Feed"
                        >
                            <RefreshCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Stats */}
            <div className="flex items-center justify-between text-xs font-mono text-foreground/40 shrink-0">
                <div>SCANNING... {filteredData.length} SIGNALS FOUND</div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> HIGH RISK
                    </span>
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span> MEDIUM
                    </span>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 min-h-0">
                <InsiderTable data={filteredData} />
            </div>
        </div>
    );
}
