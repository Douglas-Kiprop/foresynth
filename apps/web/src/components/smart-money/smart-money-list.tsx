"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Crosshair } from "lucide-react";
import { getTopTraders, TraderProfile } from "@/lib/mock-traders";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SmartMoneyListProps {
    onAddTarget: (trader: TraderProfile) => void;
}

export function SmartMoneyList({ onAddTarget }: SmartMoneyListProps) {
    const [traders, setTraders] = useState<TraderProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState<string>("all");

    useEffect(() => {
        const fetchSmartMoney = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
                const res = await fetch(`${apiUrl}/squads/smart-money?limit=20&min_trades=5`);
                if (res.ok) {
                    const data = await res.json();
                    // Map API response to TraderProfile compatible format
                    const mappedTraders: TraderProfile[] = data.map((t: any) => ({
                        id: t.address, // Use address as ID
                        address: t.address,
                        name: t.name,
                        rank: t.rank,
                        totalProfit: t.totalProfit,
                        volume: t.volume,
                        winRate: t.winRate,
                        totalBets: t.totalBets,
                        // The original API response includes wins and losses,
                        // but TraderProfile might not directly have them.
                        // For now, we'll pass them through if they exist,
                        // or set to 0 if TraderProfile expects them.
                        // Assuming TraderProfile can accept these or they are derived.
                        wins: t.wins,
                        losses: t.losses,
                        topCategory: "General", // Placeholder
                        lastActive: new Date().toISOString(), // Placeholder
                        history: [] // Placeholder
                    }));
                    setTraders(mappedTraders);
                }
            } catch (error) {
                console.error("Failed to fetch smart money list", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSmartMoney();
    }, []);

    if (loading) {
        return <SmartMoneyListSkeleton />;
    }

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
                        {traders.map((trader, index) => (
                            <tr key={trader.address} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-orbitron font-bold text-foreground/60">
                                    #{trader.rank}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {trader.profileImage ? (
                                            <img src={trader.profileImage} alt={trader.name} className="w-8 h-8 rounded-full border border-sidebar-border hidden sm:block" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-primary/20 border border-sidebar-border hidden sm:block" />
                                        )}
                                        <div>
                                            <div className="font-bold text-foreground truncate max-w-[150px]">{trader.name}</div>
                                            <div className="font-mono text-xs text-foreground/40 truncate max-w-[150px]">{trader.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className={cn("p-4 font-mono font-bold", trader.totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                                    {trader.totalProfit >= 0 ? "+" : "-"}${Math.abs(trader.totalProfit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                                <td className="p-4 font-mono text-foreground/60 hidden md:table-cell">
                                    ${(trader.volume / 1000).toFixed(0)}k
                                </td>
                                <td className="p-4 font-mono">
                                    {trader.totalBets}
                                </td>
                                <td className="p-4 font-mono text-green-400">
                                    {trader.wins}
                                </td>
                                <td className="p-4 font-mono text-red-400">
                                    {trader.losses}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "font-bold font-orbitron text-lg",
                                            trader.winRate >= 60 ? "text-green-400" :
                                                trader.winRate >= 50 ? "text-yellow-400" : "text-red-400"
                                        )}>{trader.winRate}%</span>
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
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SmartMoneyListSkeleton() {
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-32 h-8" />
            </div>

            <div className="border border-sidebar-border rounded-lg bg-black/20 overflow-hidden">
                <div className="bg-sidebar/50 p-4 border-b border-sidebar-border">
                    <div className="flex justify-between gap-4">
                        {[...Array(9)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-20" />
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-sidebar-border">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="p-4 flex items-center justify-between gap-4">
                            <Skeleton className="w-8 h-4" />
                            <div className="flex items-center gap-3 w-48">
                                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                            </div>
                            <Skeleton className="w-24 h-4" />
                            <Skeleton className="w-20 h-4 hidden md:block" />
                            <Skeleton className="w-12 h-4" />
                            <Skeleton className="w-12 h-4" />
                            <Skeleton className="w-12 h-4" />
                            <Skeleton className="w-16 h-6" />
                            <Skeleton className="w-8 h-8" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
