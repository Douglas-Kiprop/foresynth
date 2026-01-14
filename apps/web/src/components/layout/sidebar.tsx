"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Zap, Newspaper, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "WATCHLISTS", icon: LayoutDashboard, href: "/watchlists" },
    { label: "INSIDERS", icon: Users, href: "/insiders" },
    { label: "SMART MONEY", icon: Zap, href: "/smart-money" },
    { label: "NEWS", icon: Newspaper, href: "/news" },
    { label: "AI AGENT", icon: Bot, href: "/agent" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 border-r border-sidebar-border bg-sidebar backdrop-blur-md z-50 flex flex-col">
            <div className="p-6 border-b border-sidebar-border">
                <Link href="/" className="group flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary rounded-sm shadow-neon group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-2xl font-orbitron font-bold text-foreground tracking-widest group-hover:text-primary transition-colors">
                        FORESYNTH
                    </span>
                </Link>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-sm transition-all duration-200 group relative overflow-hidden",
                                isActive
                                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                                    : "text-foreground/60 hover:text-foreground hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "shadow-neon")} />
                            <span className="font-orbitron tracking-wide text-sm">{item.label}</span>

                            {isActive && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <div className="p-4 rounded-sm bg-black/40 border border-sidebar-border">
                    <p className="text-xs text-foreground/40 font-mono mb-2">BUILDER STATUS</p>
                    <div className="flex items-center gap-2 text-primary text-sm font-bold">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-neon animate-pulse" />
                        ONLINE
                    </div>
                </div>
            </div>
        </aside>
    );
}
