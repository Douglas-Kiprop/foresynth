
"use client";

import { useState, useEffect } from "react";
import { Shield, Bell, Send, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";

export default function AccountPage() {
    const { user } = useAuth();
    const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        fetchUserProfile();
    }, [user]);

    const fetchUserProfile = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("users")
                .select("telegram_chat_id")
                .eq("id", user.id)
                .single();

            if (error) throw error;
            setTelegramStatus(data?.telegram_chat_id || null);
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("Failed to load account settings");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectTelegram = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/telegram/connect`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) throw new Error("Failed to get connection token");

            const { token, bot_username } = await response.json();

            // Redirect to Telegram
            window.open(`https://t.me/${bot_username}?start=${token}`, "_blank");

            // Start polling for status update or show instruction
            setTelegramStatus("pending");

        } catch (err) {
            console.error("Error connecting telegram:", err);
            setError("Failed to initiate Telegram connection");
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Shield className="text-primary" size={24} />
                    </div>
                    <h1 className="text-3xl font-orbitron font-bold tracking-wider">COMMAND CENTER</h1>
                </div>
                <p className="text-foreground/60 font-mono text-sm tracking-tight uppercase">
                    Manage session security and tactical notification parameters
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Section */}
                <section className="p-6 rounded-sm bg-black/40 border border-white/5 space-y-4">
                    <h2 className="text-sm font-mono text-foreground/40 uppercase tracking-widest border-b border-white/5 pb-2">
                        OPERATOR PROFILE
                    </h2>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-foreground/40 font-mono uppercase">ID</span>
                            <span className="text-sm font-mono truncate">{user?.id}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-foreground/40 font-mono uppercase">EMAIL</span>
                            <span className="text-sm font-bold text-primary">{user?.email}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-foreground/40 font-mono uppercase">ACCESS LEVEL</span>
                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/20 self-start">
                                COMMANDER
                            </span>
                        </div>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="p-6 rounded-sm bg-black/40 border border-white/5 space-y-4">
                    <h2 className="text-sm font-mono text-foreground/40 uppercase tracking-widest border-b border-white/5 pb-2">
                        EXTERNAL INTEL CHANNELS
                    </h2>

                    <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Send size={18} className={telegramStatus ? "text-primary" : "text-foreground/20 text-white/5"} />
                                    <span className="font-bold">Telegram Bot</span>
                                </div>
                                <p className="text-xs text-foreground/40 leading-relaxed">
                                    Receive real-time tactical alerts for wallet movements and price targets.
                                </p>
                            </div>

                            {telegramStatus && telegramStatus !== "pending" ? (
                                <div className="flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-1.5 text-primary text-xs font-mono">
                                        <CheckCircle2 size={14} />
                                        CONNECTED
                                    </div>
                                    <button
                                        className="text-[10px] text-foreground/40 hover:text-red-500 font-mono uppercase transition-colors"
                                        onClick={() => setTelegramStatus(null)} // Local UI optimistic update
                                    >
                                        DISCONNECT
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectTelegram}
                                    disabled={isConnecting}
                                    className={cn(
                                        "px-4 py-2 rounded-sm bg-primary text-black font-orbitron font-bold text-xs hover:shadow-neon transition-all flex items-center gap-2 shrink-0 disabled:opacity-50",
                                        telegramStatus === "pending" && "bg-amber-500 hover:shadow-none"
                                    )}
                                >
                                    {isConnecting ? (
                                        <RefreshCw size={14} className="animate-spin" />
                                    ) : (
                                        <Send size={14} />
                                    )}
                                    {telegramStatus === "pending" ? "RETRY HANDSHAKE" : "CONNECT BOT"}
                                </button>
                            )}
                        </div>

                        {telegramStatus === "pending" && (
                            <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/20 space-y-2">
                                <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                                    <AlertTriangle size={14} />
                                    HANDSHAKE PENDING
                                </div>
                                <p className="text-[10px] text-foreground/60 leading-tight">
                                    Click "Start" in the Telegram chat to complete your tactical link. Once linked, refresh this page.
                                </p>
                            </div>
                        )}

                        <div className="flex items-start justify-between gap-4 opacity-40 grayscale">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Bell size={18} />
                                    <span className="font-bold">Discord Webhook</span>
                                </div>
                                <p className="text-xs text-foreground/40 leading-relaxed">
                                    Broadcast signals to your private command center or alpha group.
                                </p>
                            </div>
                            <span className="text-[10px] font-mono border border-white/10 px-2 py-1 uppercase self-start">
                                COMING SOON
                            </span>
                        </div>
                    </div>
                </section>
            </div>

            {error && (
                <div className="p-4 rounded-sm bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono">
                    ERROR: {error}
                </div>
            )}

            <section className="p-6 rounded-sm bg-black/40 border border-white/5 space-y-4">
                <h2 className="text-sm font-mono text-foreground/40 uppercase tracking-widest border-b border-white/5 pb-2">
                    TACTICAL PREFERENCES
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 opacity-60">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-foreground/40 uppercase">Default Sensitivity</label>
                        <div className="p-3 border border-white/10 rounded-sm font-mono text-sm">
                            $1,000+ TRADES
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-foreground/40 uppercase">Signal Priority</label>
                        <div className="p-3 border border-white/10 rounded-sm font-mono text-sm">
                            HIGH INTENSITY
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-foreground/40 uppercase">Auto-Acknowledge</label>
                        <div className="p-3 border border-white/10 rounded-sm font-mono text-sm">
                            DISABLED
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
