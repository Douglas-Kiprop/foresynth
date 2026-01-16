"use client";

import { useState } from "react";
import { TrendingUp, Crosshair } from "lucide-react";
import { getTopTraders, TraderProfile } from "@/lib/mock-traders";
import { cn } from "@/lib/utils";

interface SmartMoneyListProps {
    onAddTarget: (trader: TraderProfile) => void;
}

export function SmartMoneyList({ onAddTarget }: SmartMoneyListProps) {
    const [category, setCategory] = useState<string>("all");

    // Get traders sorted by win rate (The "Smart" Money)
    const smartTraders = getTopTraders('winrate').filter(t => t.winRate > 60);

    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-orbitron text-xl text-primary flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" /> SMART MONEY LIST
                </h2>

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
            </div>

            <div className="border border-sidebar-border rounded-lg bg-black/20 overflow-hidden text-nowrap overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-sidebar/50 text-foreground/40 font-mono uppercase text-xs">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Operator</th>
                            <th className="p-4">Net P/L</th>
                            <th className="p-4 hidden md:table-cell">Volume</th>
                            <th className="p-4">Trades</th>
                            <th className="p-4">Wins</th>
                            <th className="p-4">Losses</th>
                            <th className="p-4">Win Rate</th>
                            <th className="p-4">Track</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border">
                        {smartTraders.map((trader, index) => {
                            const wins = Math.round(trader.totalBets * (trader.winRate / 100));
                            const losses = trader.totalBets - wins;

                            return (
                                <tr key={trader.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-orbitron font-bold text-foreground/60">
                                        #{index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-primary/20 border border-sidebar-border hidden sm:block" />
                                            <div>
                                                <div className="font-bold text-foreground">{trader.name || "Unknown Operator"}</div>
                                                <div className="font-mono text-xs text-foreground/40">{trader.address}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={cn("p-4 font-mono font-bold", trader.totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                                        {trader.totalProfit >= 0 ? "+" : "-"}${Math.abs(trader.totalProfit).toLocaleString()}
                                    </td>
                                    <td className="p-4 font-mono text-foreground/60 hidden md:table-cell">
                                        ${(trader.volume / 1000).toFixed(0)}k
                                    </td>
                                    <td className="p-4 font-mono">
                                        {trader.totalBets}
                                    </td>
                                    <td className="p-4 font-mono text-green-400">
                                        {wins}
                                    </td>
                                    <td className="p-4 font-mono text-red-400">
                                        {losses}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold font-orbitron text-green-400 text-lg">{trader.winRate}%</span>
                                        </div>
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
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
