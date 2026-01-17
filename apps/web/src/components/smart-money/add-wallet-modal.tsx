"use client";

import { useState } from "react";
import { X, Plus, Wallet, ShieldAlert } from "lucide-react";
import { AlertConfig } from "@/stores/smart-money-store";
import { cn } from "@/lib/utils";

interface AddWalletModalProps {
    squadId: string;
    onClose: () => void;
    onAdd: (address: string, config: AlertConfig, name?: string) => void;
}

const CATEGORIES = ["Politics", "Crypto", "Sports", "Pop Culture", "Science"];

export function AddWalletModal({ squadId, onClose, onAdd }: AddWalletModalProps) {
    const [address, setAddress] = useState("");
    const [name, setName] = useState("");

    // Config state
    const [minSize, setMinSize] = useState(1000);
    const [onlyBuy, setOnlyBuy] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES);
    const [channels, setChannels] = useState<("in-app" | "telegram" | "discord")[]>(["in-app"]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (address.trim()) {
            onAdd(address, {
                minTradeSize: minSize,
                onlyBuyOrders: onlyBuy,
                assetClassFilter: selectedCategories,
                channels
            }, name);
            onClose();
        }
    };

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

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-sidebar border-l border-sidebar-border shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-sidebar-border bg-black/20 flex items-center justify-between">
                    <h2 className="font-orbitron font-bold text-primary flex items-center gap-2">
                        <Wallet className="w-5 h-5" /> ADD MANUAL TARGET
                    </h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-foreground/40 hover:text-foreground" /></button>
                </div>

                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                    <form id="add-wallet-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <label className="text-xs font-mono text-foreground/40 uppercase">1. Wallet Details</label>
                            <input
                                required
                                autoFocus
                                type="text"
                                placeholder="0x... Wallet Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full bg-black/40 border border-sidebar-border rounded-sm px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary text-foreground"
                            />
                            <input
                                type="text"
                                placeholder="Nickname (Optional)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-black/40 border border-sidebar-border rounded-sm px-4 py-3 font-rajdhani font-bold text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-mono text-foreground/40 uppercase">2. Alert Filters</label>

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
                                            type="button"
                                            key={cat}
                                            onClick={() => toggleCategory(cat)}
                                            className={`px-3 py-2 text-xs font-mono rounded-sm border transition-all text-left ${isActive ? "bg-white/10 border-foreground/40 text-foreground" : "bg-transparent border-sidebar-border text-foreground/40 hover:border-foreground/20"}`}
                                        >
                                            {cat} {isActive && "✓"}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Direction */}
                            <button
                                type="button"
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

                        {/* Notification Channels */}
                        <div className="space-y-4">
                            <label className="text-xs font-mono text-foreground/40 uppercase">3. NOTIFICATION CHANNELS</label>
                            <div className="space-y-2">
                                {["in-app", "telegram", "discord"].map((channel) => {
                                    const isSelected = channels.includes(channel as any);
                                    return (
                                        <button
                                            type="button"
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
                    </form>
                </div>

                <div className="p-6 border-t border-sidebar-border bg-black/20">
                    <button
                        form="add-wallet-form"
                        type="submit"
                        disabled={!address.trim()}
                        className="w-full py-3 bg-primary text-black font-bold font-orbitron tracking-widest rounded-sm shadow-neon hover:bg-white transition-colors disabled:opacity-50"
                    >
                        START TRACKING
                    </button>
                </div>
            </div>
        </div>
    );
}
