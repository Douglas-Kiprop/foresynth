"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Zap, Newspaper, Bot, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Context ---

type SidebarContextType = {
    isCollapsed: boolean;
    toggleSidebar: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
}

// --- Sidebar Component ---

const NAV_ITEMS = [
    { label: "WATCHLISTS", icon: LayoutDashboard, href: "/watchlists" },
    { label: "INSIDERS", icon: Users, href: "/insiders" },
    { label: "SMART MONEY", icon: Zap, href: "/smart-money" },
    { label: "NEWS", icon: Newspaper, href: "/news" },
    { label: "AI AGENT", icon: Bot, href: "/agent" },
];

function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen border-r border-sidebar-border bg-sidebar backdrop-blur-md z-50 flex flex-col transition-all duration-300 ease-in-out",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            <div className={cn("p-6 border-b border-sidebar-border flex items-center justify-between", isCollapsed && "px-4 justify-center")}>
                <Link href="/" className={cn("group flex items-center gap-2", isCollapsed && "hidden")}>
                    <div className="h-8 w-8 bg-primary rounded-sm shadow-neon group-hover:scale-110 transition-transform duration-300 shrink-0" />
                    <span className="text-2xl font-orbitron font-bold text-foreground tracking-widest group-hover:text-primary transition-all duration-300 whitespace-nowrap">
                        FORESYNTH
                    </span>
                </Link>
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
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 group relative overflow-hidden",
                                isActive ? "bg-primary/10 text-primary border-l-2 border-primary" : "text-foreground/60 hover:text-foreground hover:bg-white/5",
                                isCollapsed && "justify-center px-2"
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 shrink-0", isActive && "shadow-neon")} />
                            <span className={cn("font-orbitron tracking-wide text-sm whitespace-nowrap transition-all duration-300", isCollapsed ? "opacity-0 w-0 hidden" : "opacity-100")}>
                                {item.label}
                            </span>
                            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-sidebar-border">
                <div className={cn("p-4 rounded-sm bg-black/40 border border-sidebar-border overflow-hidden transition-all duration-300", isCollapsed && "p-2 justify-center items-center flex")}>
                    <p className={cn("text-xs text-foreground/40 font-mono mb-2 whitespace-nowrap", isCollapsed && "hidden")}>BUILDER STATUS</p>
                    <div className="flex items-center gap-2 text-primary text-sm font-bold justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary shadow-neon animate-pulse shrink-0" />
                        <span className={cn(isCollapsed && "hidden")}>ONLINE</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

// --- Main Shell Component ---

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved) setIsCollapsed(JSON.parse(saved));
    }, []);

    const toggleSidebar = () => {
        setIsCollapsed((prev) => {
            const newState = !prev;
            localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
            return newState;
        });
    };

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            <div className="flex min-h-screen bg-background text-foreground font-rajdhani">
                <Sidebar />
                <main className={cn("flex-1 p-8 overflow-y-auto h-screen relative transition-all duration-300 ease-in-out", isCollapsed ? "ml-20" : "ml-64")}>
                    <div className="fixed inset-0 pointer-events-none z-0">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative z-10 max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarContext.Provider>
    );
}
