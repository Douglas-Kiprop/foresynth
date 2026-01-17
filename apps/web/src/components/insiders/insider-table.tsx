"use client";

import { InsiderTrade } from "@/lib/mock-insiders";
import { cn } from "@/lib/utils";
import { ExternalLink, TrendingUp, TrendingDown, Clock, AlertTriangle } from "lucide-react";

interface InsiderTableProps {
    data: InsiderTrade[];
}

export function InsiderTable({ data }: InsiderTableProps) {
    return (
        <div className="w-full border border-sidebar-border rounded-lg bg-black/20 overflow-hidden flex flex-col h-full">
            <div className="overflow-auto custom-scrollbar flex-1 relative">
                <table className="w-max text-left border-collapse">
                    {/* Headers */}
                    <thead className="bg-sidebar/50 text-foreground/40 font-mono uppercase text-[10px] tracking-wider sticky top-0 z-30 shadow-sm backdrop-blur-md">
                        <tr>
                            {/* Sticky Identity Group */}
                            <th className="p-3 sticky left-0 z-40 bg-black border-r border-sidebar-border w-[220px]">Operator</th>

                            {/* Signal */}
                            <th className="p-3 border-r border-sidebar-border/10 w-[80px] text-center">Score</th>
                            <th className="p-3 w-[250px]">Market</th>
                            <th className="p-3">Side</th>
                            <th className="p-3 text-right">Size</th>
                            <th className="p-3 text-right">Entry</th>
                            <th className="p-3 text-right">Avg</th>
                            <th className="p-3 text-right">Curr</th>
                            <th className="p-3">Time</th>

                            {/* Analytics */}
                            <th className="p-3 border-l border-sidebar-border/20 text-right">Age</th>
                            <th className="p-3 text-right">Wake Time</th>
                            <th className="p-3 text-center">Speed %</th>

                            {/* Concentration */}
                            <th className="p-3 border-l border-sidebar-border/20 text-right">Mkt Vol</th>
                            <th className="p-3 text-center">Vol Conc.</th>
                            <th className="p-3 text-right">Mkt PnL</th>

                            {/* Totals */}
                            <th className="p-3 border-l border-sidebar-border/20 text-right">Tot PnL</th>
                            <th className="p-3 text-right">Tot Vol</th>
                            <th className="p-3 text-center">Trades</th>
                            <th className="p-3 text-center">Uniq Mkts</th>

                            {/* Meta */}
                            <th className="p-3 border-l border-sidebar-border/20 text-center">Active</th>
                            <th className="p-3 text-center">Verify</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-sidebar-border/40 font-mono text-xs">
                        {data.map((trade) => (
                            <tr key={trade.id} className="hover:bg-white/5 transition-colors group">
                                {/* Sticky Identity */}
                                <td className="p-3 sticky left-0 z-30 bg-black border-r border-sidebar-border group-hover:bg-[#0c1218] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full border border-sidebar-border flex items-center justify-center font-bold text-xs shrink-0",
                                            trade.radarScore > 80 ? "bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                                                trade.radarScore > 50 ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" : "bg-sidebar"
                                        )}>
                                            {trade.radarScore}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-foreground truncate max-w-[120px] font-rajdhani text-sm">{trade.walletName || "Anonymous"}</div>
                                            <div className="text-foreground/40 text-[10px] truncate max-w-[120px]">{trade.walletAddress}</div>
                                        </div>
                                    </div>
                                </td>

                                {/* Signal */}
                                <td className="p-3 border-r border-sidebar-border/10 text-center">
                                    <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full", trade.radarScore > 80 ? "bg-red-500" : trade.radarScore > 50 ? "bg-yellow-500" : "bg-primary")}
                                            style={{ width: `${trade.radarScore}%` }}
                                        />
                                    </div>
                                </td>

                                <td className="p-3 max-w-[250px]">
                                    <div className="truncate text-foreground font-bold hover:text-primary cursor-pointer" title={trade.marketTitle}>{trade.marketTitle}</div>
                                </td>

                                <td className="p-3">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-sm font-bold text-[10px]",
                                        trade.side === "YES" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                    )}>
                                        {trade.side}
                                    </span>
                                </td>

                                <td className="p-3 text-right font-bold text-foreground">
                                    ${(trade.size / 1000).toFixed(1)}k
                                </td>

                                <td className="p-3 text-right text-foreground/60">
                                    {trade.priceEntry.toFixed(1)}¢
                                </td>
                                <td className="p-3 text-right text-foreground/60">
                                    {(trade.priceAverage || trade.priceEntry || 0).toFixed(1)}¢
                                </td>
                                <td className={cn("p-3 text-right font-bold", trade.priceCurrent > (trade.priceAverage || trade.priceEntry) ? "text-green-400" : "text-red-400")}>
                                    {trade.priceCurrent.toFixed(1)}¢
                                </td>

                                <td className="p-3 text-foreground/40 whitespace-nowrap">
                                    {trade.timeSinceTrade}
                                </td>

                                {/* Analytics */}
                                <td className="p-3 border-l border-sidebar-border/20 text-right text-foreground font-bold">
                                    <div className="flex items-center justify-end gap-1">
                                        {trade.walletAgeDays < 7 && <Clock className="w-3 h-3 text-yellow-500" />}
                                        {trade.walletAgeDays}d
                                    </div>
                                </td>
                                <td className="p-3 text-right whitespace-nowrap">
                                    <span className={cn(
                                        trade.wakeTimeSeconds < 3600 ? "text-red-500 font-bold" : "text-foreground/60"
                                    )}>
                                        {trade.wakeTimeDelta}
                                    </span>
                                </td>
                                <td className="p-3 text-center text-foreground/40">
                                    {trade.speedRatio}%
                                </td>

                                {/* Concentration */}
                                <td className="p-3 border-l border-sidebar-border/20 text-right">
                                    ${(trade.marketVolume / 1000).toFixed(1)}k
                                </td>
                                <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {trade.volumeConcentration > 50 && <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                                        {trade.volumeConcentration}%
                                    </div>
                                </td>
                                <td className={cn("p-3 text-right font-bold", trade.marketPnL >= 0 ? "text-green-400" : "text-red-400")}>
                                    {trade.marketPnL >= 0 ? "+" : "-"}${Math.abs(trade.marketPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>

                                {/* Totals */}
                                <td className={cn("p-3 border-l border-sidebar-border/20 text-right font-bold", trade.totalPnL >= 0 ? "text-green-400" : "text-red-400")}>
                                    {trade.totalPnL >= 0 ? "+" : "-"}${Math.abs(trade.totalPnL / 1000).toFixed(1)}k
                                </td>
                                <td className="p-3 text-right text-foreground/60">
                                    ${(trade.totalVolume / 1000).toFixed(1)}k
                                </td>
                                <td className="p-3 text-center text-foreground/60">
                                    {trade.totalTrades}
                                </td>
                                <td className="p-3 text-center text-foreground/60">
                                    {trade.uniqueMarkets}
                                </td>

                                {/* Meta */}
                                <td className="p-3 border-l border-sidebar-border/20 text-center">
                                    {trade.activeHold ? (
                                        <span className="w-2 h-2 rounded-full bg-green-500 inline-block shadow-[0_0_5px_rgba(34,197,94,0.5)]" title="Active Hold" />
                                    ) : (
                                        <span className="w-2 h-2 rounded-full bg-foreground/10 inline-block" />
                                    )}
                                </td>
                                <td className="p-3 text-center">
                                    <a href={trade.txHash} target="_blank" className="p-1.5 hover:bg-white/10 rounded-sm inline-block text-primary/60 hover:text-primary transition-colors">
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
