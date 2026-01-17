"use client";

import { useState } from "react";
import { X, Radar, Check, Plus, Users, Library } from "lucide-react";
import { TraderProfile } from "@/lib/mock-traders";
import { AlertConfig, useSmartMoneyStore } from "@/stores/smart-money-store";
import { cn } from "@/lib/utils";

interface SignalInterceptDrawerProps {
    trader: TraderProfile;
    onClose: () => void;
    onSave: (config: AlertConfig, squadId: string) => void;
}

const CATEGORIES = ["Politics", "Crypto", "Sports", "Pop Culture", "Science"];

export function SignalInterceptDrawer({ trader, onClose, onSave }: SignalInterceptDrawerProps) {
    const [minSize, setMinSize] = useState(1000);
    const [onlyBuy, setOnlyBuy] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
    const [channels, setChannels] = useState<("in-app" | "telegram" | "discord")[]>(["in-app"]);

    const { squads, createSquad } = useSmartMoneyStore();
    const [selectedSquadId, setSelectedSquadId] = useState(squads[0]?.id || "default");
    const [isCreatingSquad, setIsCreatingSquad] = useState(false);
    const [newSquadName, setNewSquadName] = useState("");

    const toggleCategory = (cat: string) => {
        if (selectedCategories.includes(cat)) {
            setSelectedCategories(prev => prev.filter(c => c !== cat));
        } else {
            setSelectedCategories(prev => [...prev, cat]);
        }
    };

    const toggleChannel = (channel: "in-app" | "telegram" | "discord") => {
        if (channels.includes(channel)) {
            setChannels(prev => prev.filter(c => c !== channel));
        } else {
            setChannels(prev => [...prev, channel]);
        }
    };

    const handleCreateSquad = () => {
        if (newSquadName) {
            createSquad(newSquadName);
            // We assume the new squad is added to the store state. 
            // Ideally we would select it, but we need the ID. 
            // For simplicity/mock, user has to select it from dropdown after creation updates state.
            // But store update is instant in React.
            setNewSquadName("");
            setIsCreatingSquad(false);
        }
    };

    const handleConfirm = () => {
        onSave({
            minTradeSize: minSize,
            onlyBuyOrders: onlyBuy,
            assetClassFilter: selectedCategories.length > 0 ? selectedCategories : undefined,
            channels
        }, selectedSquadId);
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-sidebar border-l border-sidebar-border shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-sidebar-border bg-black/20 flex items-center justify-between">
                    <h2 className="font-orbitron font-bold text-primary flex items-center gap-2">
                        <Radar className="w-5 h-5" /> ACQUIRE TARGET
                    </h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-foreground/40 hover:text-foreground" /></button>
                </div>

                <div className="p-6 space-y-8 flex-1 overflow-y-auto">
                    {/* Profile Header */}
                    <div className="bg-primary/10 border border-primary/20 p-4 rounded-sm">
                        <h3 className="font-bold font-rajdhani text-lg">{trader.name || "Unknown Target"}</h3>
                        <p className="font-mono text-xs text-foreground/60">{trader.address}</p>
                    </div>

                    {/* Step 1: Assign to Squad */}
                    <div className="space-y-4">
                        <label className="text-xs font-mono text-foreground/40 uppercase flex items-center gap-2">
                            <Users className="w-3 h-3" /> 1. ASSIGN TO SQUAD
                        </label>

                        {!isCreatingSquad ? (
                            <div className="flex gap-2">
                                <select
                                    value={selectedSquadId}
                                    onChange={(e) => setSelectedSquadId(e.target.value)}
                                    className="flex-1 bg-black/40 border border-sidebar-border rounded-sm px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary"
                                >
                                    {squads.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => setIsCreatingSquad(true)}
                                    className="p-3 border border-sidebar-border rounded-sm hover:bg-white/5"
                                    title="Create New Squad"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2 animate-in fade-in">
                                <input
                                    type="text"
                                    placeholder="NEW SQUAD NAME"
                                    value={newSquadName}
                                    onChange={(e) => setNewSquadName(e.target.value)}
                                    className="flex-1 bg-black/40 border border-sidebar-border rounded-sm px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary"
                                    autoFocus
                                />
                                <button
                                    onClick={handleCreateSquad}
                                    className="p-3 bg-primary text-black rounded-sm font-bold disabled:opacity-50"
                                    disabled={!newSquadName}
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsCreatingSquad(false)}
                                    className="p-3 border border-sidebar-border rounded-sm hover:bg-white/5"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Filters */}
                    <div className="space-y-4">
                        <label className="text-xs font-mono text-foreground/40 uppercase">2. ALERT FILTERS (OPTIONAL)</label>

                        {/* Size */}
                        <div className="p-4 bg-black/40 border border-sidebar-border rounded-sm">
                            <div className="flex justify-between mb-4">
                                <span className="text-sm">IGNORE TRADES BELOW</span>
                                <span className="font-bold text-primary">${minSize.toLocaleString()}</span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="100000"
                                step="100"
                                value={minSize}
                                onChange={(e) => setMinSize(Number(e.target.value))}
                                className="w-full accent-primary h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>

                        {/* Categories */}
                        <div className="grid grid-cols-2 gap-2">
                            {CATEGORIES.map(cat => {
                                const isActive = selectedCategories.includes(cat);
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={cn(
                                            "px-3 py-2 text-xs font-mono rounded-sm border transition-all text-left",
                                            isActive
                                                ? "bg-white/10 border-foreground/40 text-foreground"
                                                : "bg-transparent border-sidebar-border text-foreground/40 hover:border-foreground/20"
                                        )}
                                    >
                                        {cat} {isActive && "✓"}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Direction */}
                        <button
                            onClick={() => setOnlyBuy(!onlyBuy)}
                            className={`w-full p-3 border rounded-sm flex items-center justify-between transition-all ${onlyBuy ? "bg-green-500/10 border-green-500 text-green-400" : "bg-black/40 border-sidebar-border text-foreground/60"}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 border rounded-sm flex items-center justify-center ${onlyBuy ? "bg-green-500 border-green-500 text-black" : "border-foreground/40"}`}>
                                    {onlyBuy && "✓"}
                                </div>
                                <span className="font-bold text-xs">ONLY NOTIFY BUY ORDERS</span>
                            </div>
                        </button>
                    </div>

                    {/* Step 3: Notification Channels */}
                    <div className="space-y-4">
                        <label className="text-xs font-mono text-foreground/40 uppercase">3. NOTIFICATION CHANNELS</label>
                        <div className="space-y-2">
                            {["in-app", "telegram", "discord"].map((channel) => {
                                const isSelected = channels.includes(channel as any);
                                return (
                                    <button
                                        key={channel}
                                        onClick={() => toggleChannel(channel as any)}
                                        className={cn(
                                            "w-full p-3 border rounded-sm flex items-center justify-between transition-all",
                                            isSelected ? "bg-primary/10 border-primary text-primary" : "bg-black/40 border-sidebar-border text-foreground/60"
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-3 h-3 border rounded-sm flex items-center justify-center", isSelected ? "bg-primary border-primary text-black" : "border-foreground/40")}>
                                                {isSelected && "✓"}
                                            </div>
                                            <span className="font-bold text-xs uppercase">{channel} {channel !== 'in-app' && "WEBHOOK"}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-sidebar-border bg-black/20">
                    <button
                        onClick={handleConfirm}
                        className="w-full py-3 bg-primary text-black font-bold font-orbitron tracking-widest rounded-sm shadow-neon hover:bg-white transition-colors"
                    >
                        CONFIRM TARGET
                    </button>
                </div>
            </div>
        </div>
    );
}
