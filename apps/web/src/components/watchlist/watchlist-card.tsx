"use client";

import { useMemo } from "react";
import { ArrowRight, Activity, TrendingUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Watchlist } from "@/stores/watchlist-store";
import Link from "next/link";

interface WatchlistCardProps {
    watchlist: Watchlist;
}

export function WatchlistCard({ watchlist }: WatchlistCardProps) {
    // Calculate aggregate volatility history for the sparkline
    // Just averaging the first market's history for mock purposes
    const data = useMemo(() => {
        if (watchlist.markets.length === 0) return [];
        return watchlist.markets[0].history;
    }, [watchlist.markets]);

    const activeMarkets = watchlist.markets.length;
    // Mock average change
    const isPositive = Math.random() > 0.5;
    const change = (Math.random() * 5).toFixed(1);

    return (
        <div className="group relative overflow-hidden rounded-lg border border-sidebar-border bg-sidebar/50 backdrop-blur-sm p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-neon hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
                    <h3 className="font-orbitron font-bold text-lg text-foreground tracking-wide group-hover:text-primary transition-colors">
                        {watchlist.name}
                    </h3>
                </div>
                <div className={cn("text-xs font-mono flex items-center gap-1", isPositive ? "text-green-400" : "text-red-400")}>
                    {isPositive ? "+" : "-"}{change}%
                    <TrendingUp className="w-3 h-3" />
                </div>
            </div>

            {/* Sparkline Chart */}
            <div className="h-16 w-full mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke={isPositive ? "#4ade80" : "#f87171"}
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false} // Performance
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Stats */}
            <div className="flex items-center justify-between text-xs text-foreground/40 font-mono mb-6">
                <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {activeMarkets} MARKETS
                </span>
                <span>UPDATED 2M AGO</span>
            </div>

            {/* Action */}
            <Link
                href={`/watchlists/${watchlist.id}`}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-sm bg-white/5 border border-transparent hover:bg-primary hover:text-black hover:shadow-neon transition-all duration-300 font-orbitron text-sm tracking-widest font-bold"
            >
                MONITOR <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Decorative corners */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-white/5 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
        </div>
    );
}
