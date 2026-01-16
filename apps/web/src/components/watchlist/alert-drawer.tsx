"use client";

import { X, Bell, Zap, Volume2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Market } from "@/lib/mock-data";
import { useState } from "react";

interface AlertDrawerProps {
    market: Market;
    onClose: () => void;
    onSave: (config: any) => void;
}

type TriggerType = 'above' | 'below';

export function AlertDrawer({ market, onClose, onSave }: AlertDrawerProps) {
    const [triggerType, setTriggerType] = useState<TriggerType>('above');
    const [threshold, setThreshold] = useState(market.probability);
    const [channels, setChannels] = useState(["app"]);

    const toggleChannel = (channel: string) => {
        if (channels.includes(channel)) {
            setChannels(channels.filter(c => c !== channel));
        } else {
            setChannels([...channels, channel]);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div className="relative w-full max-w-md bg-sidebar border-l border-sidebar-border shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-sidebar-border bg-black/20 flex items-center justify-between">
                    <div>
                        <h2 className="font-orbitron font-bold text-xl text-primary flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            ALERT CONFIG
                        </h2>
                        <p className="text-xs font-mono text-foreground/40 mt-1 truncate max-w-[300px]">
                            {market.question}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-foreground/60 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                    {/* Section 1: Trigger Condition */}
                    <div className="space-y-4">
                        <label className="text-xs font-mono text-foreground/40 uppercase">Trigger Condition</label>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={() => setTriggerType('above')}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-sm border transition-all",
                                    triggerType === 'above'
                                        ? "bg-green-500/10 border-green-500 text-green-400"
                                        : "bg-white/5 border-transparent text-foreground/40 hover:bg-white/10"
                                )}
                            >
                                <ArrowUpCircle className="w-5 h-5" />
                                <span className="font-mono text-xs font-bold">STRIKES ABOVE</span>
                            </button>
                            <button
                                onClick={() => setTriggerType('below')}
                                className={cn(
                                    "flex flex-col items-center gap-2 p-3 rounded-sm border transition-all",
                                    triggerType === 'below'
                                        ? "bg-red-500/10 border-red-500 text-red-400"
                                        : "bg-white/5 border-transparent text-foreground/40 hover:bg-white/10"
                                )}
                            >
                                <ArrowDownCircle className="w-5 h-5" />
                                <span className="font-mono text-xs font-bold">DROPS BELOW</span>
                            </button>
                        </div>

                        <div className="p-4 bg-black/40 rounded-sm border border-sidebar-border space-y-4">
                            <div className="flex justify-between text-sm font-rajdhani">
                                <span>THRESHOLD</span>
                                <span className={cn(
                                    "font-bold text-lg",
                                    triggerType === 'above' ? "text-green-400" : "text-red-400"
                                )}>{threshold}%</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="99"
                                value={threshold}
                                onChange={(e) => setThreshold(Number(e.target.value))}
                                className={cn(
                                    "w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer",
                                    triggerType === 'above' ? "accent-green-500" : "accent-red-500"
                                )}
                            />
                            <div className="flex justify-between text-xs font-mono text-foreground/40">
                                <span>1%</span>
                                <span>50%</span>
                                <span>99%</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Channels */}
                    <div className="space-y-4">
                        <label className="text-xs font-mono text-foreground/40 uppercase">Notification Channels</label>

                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={() => toggleChannel('app')}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-sm border transition-all",
                                    channels.includes('app')
                                        ? "bg-primary/10 border-primary text-foreground"
                                        : "bg-white/5 border-transparent text-foreground/60 opacity-50 hover:opacity-100"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border", channels.includes('app') ? "bg-primary border-primary" : "border-foreground/40")} />
                                <Bell className="w-4 h-4" />
                                <span className="font-mono text-sm">IN-APP NOTIFICATION</span>
                            </button>

                            <button
                                onClick={() => toggleChannel('telegram')}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-sm border transition-all",
                                    channels.includes('telegram')
                                        ? "bg-[#0088cc]/20 border-[#0088cc] text-[#0088cc]"
                                        : "bg-white/5 border-transparent text-foreground/60 opacity-50 hover:opacity-100"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border", channels.includes('telegram') ? "bg-[#0088cc] border-[#0088cc]" : "border-foreground/40")} />
                                <Zap className="w-4 h-4" />
                                <span className="font-mono text-sm">TELEGRAM ALERTS</span>
                            </button>

                            <button
                                onClick={() => toggleChannel('discord')}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-sm border transition-all",
                                    channels.includes('discord')
                                        ? "bg-[#5865F2]/20 border-[#5865F2] text-[#5865F2]"
                                        : "bg-white/5 border-transparent text-foreground/60 opacity-50 hover:opacity-100"
                                )}
                            >
                                <div className={cn("w-4 h-4 rounded-full border", channels.includes('discord') ? "bg-[#5865F2] border-[#5865F2]" : "border-foreground/40")} />
                                <Volume2 className="w-4 h-4" />
                                <span className="font-mono text-sm">DISCORD WEBHOOK</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-sidebar-border bg-black/20">
                    <button
                        onClick={() => onSave({ type: triggerType, threshold, channels })}
                        className="w-full py-3 bg-primary text-black font-bold font-orbitron tracking-widest rounded-sm shadow-neon hover:bg-white transition-colors"
                    >
                        ACTIVATE MONITORING
                    </button>
                </div>
            </div>
        </div>
    );
}
