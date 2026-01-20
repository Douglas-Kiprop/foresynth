import { useState, useEffect } from "react";
import { Crosshair, Trophy, AlertTriangle } from "lucide-react";
import { squadsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface GlobalRadarProps {
    onAddTarget: (trader: any) => void;
}

export function GlobalRadar({ onAddTarget }: GlobalRadarProps) {
    const [timeframe, setTimeframe] = useState('monthly');
    const [traders, setTraders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            setIsLoading(true);
            setError(null);
            try {
                const data = await squadsApi.getLeaderboard(timeframe);
                setTraders(data || []);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
                setError("Failed to synchronize with Polymarket intelligence. Check network connection.");
            } finally {
                setIsLoading(false);
            }
        }
        fetchLeaderboard();
    }, [timeframe]);

    if (isLoading) {
        return <GlobalRadarSkeleton />;
    }

    if (error) {
        return (
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-red-500/50" />
                <div>
                    <h3 className="text-red-400 font-orbitron font-bold">RADAR INTERFERENCE</h3>
                    <p className="text-foreground/60 text-sm max-w-sm mx-auto mt-1">{error}</p>
                </div>
                <button
                    onClick={() => setTimeframe(timeframe)}
                    className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all rounded-sm"
                >
                    RE-INITIALIZE SCAN
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="font-orbitron text-xl text-primary flex items-center gap-2 text-glow">
                    <Trophy className="w-5 h-5" /> GLOBAL LEADERBOARD
                </h2>

                <div className="flex gap-2">
                    <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value)}
                        className="bg-black/40 border border-sidebar-border rounded-sm px-3 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary transition-all hover:border-primary/50"
                    >
                        <option value="daily">24H WINDOW</option>
                        <option value="weekly">7D WINDOW</option>
                        <option value="monthly">30D WINDOW</option>
                        <option value="all">ALL TIME</option>
                    </select>
                </div>
            </div>

            <div className="border border-sidebar-border rounded-lg bg-black/20 overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-sidebar/50 text-foreground/40 font-mono uppercase text-[10px] tracking-wider">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Operator</th>
                            <th className="p-4 text-right">Net P/L</th>
                            <th className="p-4 hidden md:table-cell text-right">Volume</th>
                            <th className="p-4 text-center">Track</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border">
                        {traders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-foreground/40 font-mono text-xs">
                                    NO SIGNAL DETECTED IN THIS WINDOW
                                </td>
                            </tr>
                        ) : (
                            traders.map((trader, index) => (
                                <tr key={trader.proxyWallet} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-orbitron font-bold">
                                        {trader.rank == 1 && <span className="text-yellow-400 text-glow">#1</span>}
                                        {trader.rank == 2 && <span className="text-gray-300">#2</span>}
                                        {trader.rank == 3 && <span className="text-amber-600">#3</span>}
                                        {parseInt(trader.rank) > 3 && <span className="text-foreground/60">#{trader.rank}</span>}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 border border-sidebar-border hidden sm:flex items-center justify-center text-[10px] font-bold text-primary/40">
                                                {trader.userName?.substring(0, 2).toUpperCase() || "PX"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {trader.userName || "Anonymous Trader"}
                                                </div>
                                                <div className="font-mono text-[10px] text-foreground/40 tracking-tight">
                                                    {trader.proxyWallet.substring(0, 6)}...{trader.proxyWallet.substring(trader.proxyWallet.length - 4)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className={cn("p-4 font-mono font-bold text-right", trader.pnl >= 0 ? "text-green-400" : "text-red-400")}>
                                        {trader.pnl >= 0 ? "+" : "-"}${Math.abs(trader.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="p-4 font-mono text-foreground/60 hidden md:table-cell text-right">
                                        ${(trader.vol / 1000).toFixed(1)}K
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => onAddTarget({
                                                id: trader.proxyWallet,
                                                address: trader.proxyWallet,
                                                name: trader.userName || "Anonymous",
                                                rank: parseInt(trader.rank),
                                                totalProfit: trader.pnl,
                                                volume: trader.vol,
                                                winRate: 0,
                                                totalBets: 0,
                                                topCategory: "Unknown",
                                                lastActive: new Date().toISOString(),
                                                history: []
                                            })}
                                            className="p-2 border border-sidebar-border rounded-sm hover:bg-primary hover:text-black hover:border-primary transition-all text-primary/60 hover:text-black group-hover:border-primary/40"
                                            title="Add to Target Squad"
                                        >
                                            <Crosshair className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function GlobalRadarSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-64 bg-sidebar-accent/20" />
                <Skeleton className="h-8 w-32 bg-sidebar-accent/20" />
            </div>
            <div className="border border-sidebar-border rounded-lg bg-black/20 overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-sidebar/50 text-foreground/40 font-mono uppercase text-[10px] tracking-wider">
                        <tr>
                            <th className="p-4">Rank</th>
                            <th className="p-4">Operator</th>
                            <th className="p-4 text-right">Net P/L</th>
                            <th className="p-4 hidden md:table-cell text-right">Volume</th>
                            <th className="p-4 text-center">Track</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-sidebar-border">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <tr key={i} className="animate-pulse">
                                <td className="p-4">
                                    <Skeleton className="h-6 w-8 bg-sidebar-accent/10" />
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full bg-sidebar-accent/10 shrink-0" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32 bg-sidebar-accent/10" />
                                            <Skeleton className="h-3 w-48 bg-sidebar-accent/10" />
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Skeleton className="h-6 w-24 bg-sidebar-accent/10 ml-auto" />
                                </td>
                                <td className="p-4 hidden md:table-cell">
                                    <Skeleton className="h-6 w-20 bg-sidebar-accent/10 ml-auto" />
                                </td>
                                <td className="p-4">
                                    <Skeleton className="h-8 w-8 bg-sidebar-accent/10 mx-auto" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

