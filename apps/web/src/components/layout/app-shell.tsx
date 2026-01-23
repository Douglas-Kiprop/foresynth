"use client";

import React from "react";
import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

// --- Main Shell Component ---

function ShellContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen bg-background text-foreground font-rajdhani">
            <Sidebar />
            <main
                className={cn(
                    "flex-1 p-8 overflow-y-auto h-screen relative transition-all duration-300 ease-in-out",
                    isCollapsed ? "ml-20" : "ml-64"
                )}
            >
                {/* Background effects */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

export function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <ShellContent>
                {children}
            </ShellContent>
        </SidebarProvider>
    );
}

