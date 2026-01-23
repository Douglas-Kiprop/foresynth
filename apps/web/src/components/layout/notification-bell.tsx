"use client";

import { useEffect, useState } from "react";
import { Bell, X, Info, TrendingUp, Zap, Check } from "lucide-react";
import { useNotificationStore } from "@/stores/notification-store";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export function NotificationBell({ isCollapsed }: { isCollapsed: boolean }) {
    const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead } = useNotificationStore();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        loadNotifications();
        // Set up real-time polling or subscription here if needed
        const interval = setInterval(loadNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const toggleOpen = () => setIsOpen(!isOpen);

    const getIcon = (type: string) => {
        switch (type) {
            case 'price_alert': return <TrendingUp className="w-4 h-4 text-primary" />;
            case 'wallet_alert': return <Zap className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={toggleOpen}
                className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 group relative",
                    isOpen ? "bg-primary/10 text-primary" : "text-foreground/60 hover:text-foreground hover:bg-white/5",
                    isCollapsed && "justify-center px-2"
                )}
            >
                <div className="relative">
                    <Bell className={cn("h-5 w-5 shrink-0", isOpen && "shadow-neon")} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border border-sidebar shadow-neon"></span>
                        </span>
                    )}
                </div>
                {!isCollapsed && (
                    <span className="font-orbitron tracking-wide text-sm whitespace-nowrap">
                        NOTIFICATIONS
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={cn(
                    "fixed z-50 bg-sidebar border border-sidebar-border shadow-2xl rounded-sm flex flex-col animate-in fade-in slide-in-from-top-2 duration-200",
                    isCollapsed ? "left-24 top-20 w-80" : "left-64 top-20 w-80 lg:left-72"
                )} style={{ maxHeight: '500px' }}>
                    <div className="p-4 border-b border-sidebar-border flex items-center justify-between bg-black/20">
                        <h3 className="text-xs font-orbitron font-bold tracking-widest text-primary flex items-center gap-2">
                            <Bell className="w-3 h-3" /> INTEL FEED
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsRead()}
                                    className="text-[10px] font-mono text-foreground/40 hover:text-primary transition-colors flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> READ ALL
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)}>
                                <X className="w-4 h-4 text-foreground/40 hover:text-foreground" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <p className="text-xs font-mono text-foreground/20 italic">No tactical signals detected.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={cn(
                                            "p-4 transition-colors relative group cursor-default hover:bg-white/5",
                                            !n.is_read && "bg-primary/5 border-l-2 border-primary"
                                        )}
                                        onClick={() => !n.is_read && markAsRead(n.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1">{getIcon(n.type)}</div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-orbitron font-bold text-foreground tracking-tight line-clamp-1">{n.title}</span>
                                                    <span className="text-[9px] font-mono text-foreground/40 shrink-0">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] leading-relaxed text-foreground/60 font-mono" dangerouslySetInnerHTML={{ __html: n.message }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t border-sidebar-border text-center bg-black/10">
                        <button className="text-[10px] font-orbitron font-bold tracking-widest text-foreground/40 hover:text-primary transition-all">
                            VIEW ALL TACTICAL LOGS
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
