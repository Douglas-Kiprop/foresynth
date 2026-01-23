"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Zap, Newspaper, Bot, ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";

const NAV_ITEMS = [
    { label: "WATCHLISTS", icon: LayoutDashboard, href: "/watchlists" },
    { label: "INSIDERS", icon: Users, href: "/insiders" },
    { label: "SMART MONEY", icon: Zap, href: "/smart-money" },
    { label: "NEWS", icon: Newspaper, href: "/news" },
    { label: "ACCOUNT", icon: Settings, href: "/account" },
    { label: "AI AGENT", icon: Bot, href: "/agent" },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        router.refresh();
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar backdrop-blur-md z-50 flex flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header with Logo and Toggle */}
            <div className={cn("p-6 border-b border-sidebar-border flex items-center justify-between", isCollapsed && "px-4 justify-center")}>
                <Link href="/" className={cn("group flex items-center gap-2", isCollapsed && "hidden")}>
                    <div className="h-8 w-8 bg-primary rounded-sm shadow-neon group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    <span className="text-2xl font-orbitron font-bold text-foreground tracking-widest group-hover:text-primary transition-all duration-300 whitespace-nowrap">
                        FORESYNTH
                    </span>
                </Link>

                {/* Logo Icon Only when collapsed */}
                <div className={cn("h-8 w-8 bg-primary rounded-sm shadow-neon shrink-0 hidden", isCollapsed && "block")} />

                <button
                    onClick={toggleSidebar}
                    className={cn(
                        "text-foreground/40 hover:text-primary hover:bg-white/5 rounded-sm transition-colors p-1",
                        isCollapsed && "absolute -right-3 top-8 bg-sidebar border border-sidebar-border text-primary shadow-neon z-50 rounded-full"
                    )}
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-2">
                <NotificationBell isCollapsed={isCollapsed} />

                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                                    : "text-foreground/60 hover:text-foreground hover:bg-white/5",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0", isActive && "shadow-neon")} />
                            <span
                                className={cn(
                                    "font-orbitron tracking-wide text-sm whitespace-nowrap transition-all duration-300",
                                    isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100"
                                )}
                            >
                                {item.label}
                            </span>

                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-sidebar-border space-y-4">
                {!isCollapsed && (
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-purple-500 border border-white/10" />
                        <div className="flex-1 overflow-hidden">
                            <div className="font-bold text-sm truncate">{user?.email?.split('@')[0] || "Operator"}</div>
                            <div className="text-xs text-foreground/40 font-mono truncate">Online</div>
                        </div>
                        <button onClick={handleLogout} className="text-foreground/40 hover:text-red-500 transition-colors">
                            <LogOut size={16} />
                        </button>
                    </div>
                )}

                <div
                    className={cn(
                        "p-4 rounded-sm bg-black/40 border border-sidebar-border overflow-hidden transition-all duration-300",
                        isCollapsed && "p-2 justify-center items-center flex"
                    )}
                >
                    <p
                        className={cn(
                            "text-xs text-foreground/40 font-mono mb-2 whitespace-nowrap",
                            isCollapsed && "hidden"
                        )}
                    >
                        SYSTEM STATUS
                    </p>
                    <div className="flex items-center gap-2 text-primary text-sm font-bold justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-neon animate-pulse shrink-0" />
                        <span className={cn(isCollapsed && "hidden")}>OPERATIONAL</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
