"use client";

import { Crosshair, Target } from "lucide-react";
import { getTopTraders, TraderProfile } from "@/lib/mock-traders";
import { cn } from "@/lib/utils";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SniperScopeProps {
    onAddTarget: (trader: TraderProfile) => void;
}

export function SniperScope({ onAddTarget }: SniperScopeProps) {
    // Get traders sorted by win rate
    const snipers = getTopTraders('winrate').filter(t => t.winRate > 60);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {snipers.map((sniper) => (
                <div key={sniper.id} className="group bg-sidebar/30 border border-sidebar-border rounded-lg overflow-hidden hover:border-primary/50 transition-all">
                    <div className="p-5 border-b border-sidebar-border bg-black/20 flex justify-between items-start">
                        <div>
                            <h3 className="font-bold font-rajdhani text-lg text-foreground group-hover:text-primary transition-colors">
                                {sniper.name || "Unknown Operator"}
                            </h3>
                            <p className="font-mono text-xs text-foreground/40">{sniper.address}</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-2xl font-orbitron font-bold text-green-400">{sniper.winRate}%</span>
                            <span className="text-[10px] font-mono text-foreground/40 uppercase tracking-widest">Accuracy</span>
                        </div>
                    </div>

                    <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-foreground/40 text-[10px] font-mono uppercase">Total Profit</p>
                                <p className="font-bold text-green-400">+${sniper.totalProfit.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-foreground/40 text-[10px] font-mono uppercase">Avg Vol</p>
                                <p className="font-bold text-foreground">${(sniper.volume / sniper.totalBets).toFixed(0)}</p>
                            </div>
                        </div>

                        <div className="h-16 opacity-50">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sniper.history}>
                                    <Line type="step" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <button
                            onClick={() => onAddTarget(sniper)}
                            className="w-full flex items-center justify-center gap-2 py-2 border border-sidebar-border rounded-sm hover:bg-primary hover:text-black hover:border-primary transition-all font-bold text-xs tracking-widest"
                        >
                            <Target className="w-4 h-4" />
                            ACQUIRE TARGET
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
