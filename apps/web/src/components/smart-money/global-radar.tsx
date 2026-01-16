"use client";

import { useState } from "react";
import { Crosshair, Trophy, Filter } from "lucide-react";
import { getTopTraders, TraderProfile } from "@/lib/mock-traders";
import { cn } from "@/lib/utils";

interface GlobalRadarProps {
    onAddTarget: (trader: TraderProfile) => void;
}

export function GlobalRadar({ onAddTarget }: GlobalRadarProps) {
    const [timeframe, setTimeframe] = useState('monthly');
    const [category, setCategory] = useState('all');

    // Logic to filter would go here. For now we just get top profit mock data.
    const traders = getTopTraders('profit');

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-orbitron text-xl text-primary flex items-center gap-2">
                    <Trophy className="w-5 h-5" /> GLOBAL LEADERBOARD
                </h2>

                <div className="flex gap-2">
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-black/40 border border-sidebar-border rounded-sm px-3 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                        <option value="all">ALL CATEGORIES</option>
                        <option value="politics">POLITICS</option>
                        <option value="crypto">CRYPTO</option>
                        <option value="pop-culture">POP CULTURE</option>
                        <option value="sports">SPORTS</option>
                    </select>

                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-black/40 border border-sidebar-border rounded-sm px-3 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
                    >
                        <option value="daily">24H</option>
                        <option value="weekly">7D</option>
                        <option value="monthly">30D</option>
                        <option value="all">ALL TIME</option>
                    </select>
                </div>
            </div>

            <div className="border border-sidebar-border rounded-lg bg-black/20 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-sidebar/50 text-foreground/40 font-mono uppercase text-xs">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Operator</th>
                            <th className="p-4">Net P/L (Size)</th>
                            <th className="p-4 hidden md:table-cell">Volume</th>
                            <th className="p-4">Track</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border">
                        {traders.map((trader, index) => (
                            <tr key={trader.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-orbitron font-bold">
                                    {index === 0 && <span className="text-yellow-400">#1</span>}
                                    {index === 1 && <span className="text-gray-300">#2</span>}
                                    {index === 2 && <span className="text-amber-600">#3</span>}
                                    {index > 2 && <span className="text-foreground/60">#{index + 1}</span>}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-sidebar-border hidden sm:block" />
                                        <div>
                                            <div className="font-bold text-foreground">{trader.name || "Anonymous"}</div>
                                            <div className="font-mono text-xs text-foreground/40">{trader.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={cn("p-4 font-mono font-bold text-lg", trader.totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                                    {trader.totalProfit >= 0 ? "+" : "-"}${Math.abs(trader.totalProfit).toLocaleString()}
                                </td>
                                <td className="p-4 font-mono text-foreground/60 hidden md:table-cell">
                                    ${(trader.volume / 1000000).toFixed(1)}M
                                </td>
                                <td className="p-4">
                                    <button
                                        onClick={() => onAddTarget(trader)}
                                        className="p-2 border border-sidebar-border rounded-sm hover:bg-primary hover:text-black hover:border-primary transition-all text-primary"
                                        title="Add to Target Squad"
                                    >
                                        <Crosshair className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
