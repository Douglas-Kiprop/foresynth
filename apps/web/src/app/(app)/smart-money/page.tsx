"use client";

import { useState } from "react";
import { Trophy, TrendingUp, Users, Crosshair } from "lucide-react";
import { GlobalRadar } from "@/components/smart-money/global-radar";
import { SmartMoneyList } from "@/components/smart-money/smart-money-list";
import { SignalInterceptDrawer } from "@/components/smart-money/signal-drawer";
import { TargetSquadList } from "@/components/smart-money/target-squad-list";
import { useSmartMoneyStore } from "@/stores/smart-money-store";
import { TraderProfile } from "@/lib/mock-traders";
import { cn } from "@/lib/utils";

type ViewMode = 'radar' | 'smart-money' | 'squad';

export default function SmartMoneyPage() {
    const [view, setView] = useState<ViewMode>('radar');
    const [selectedTarget, setSelectedTarget] = useState<TraderProfile | null>(null);

    const { addTargetToSquad } = useSmartMoneyStore();

    const handleSaveTarget = (config: any, squadId: string) => {
        if (selectedTarget && squadId) {
            addTargetToSquad(squadId, selectedTarget.address, config, selectedTarget.name, selectedTarget.id);
            setSelectedTarget(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-orbitron font-bold text-foreground drop-shadow-lg flex items-center gap-3">
                    <Crosshair className="w-8 h-8 text-primary animate-pulse" /> THE HUNTER'S CONSOLE
                </h1>
                <p className="text-foreground/60 font-light mt-2 max-w-xl">
                    Track whales, identify snipers, and configure automated signal intercepts.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-sidebar-border overflow-x-auto">
                <button
                    onClick={() => setView('radar')}
                    className={cn(
                        "px-6 py-3 flex items-center gap-2 border-b-2 transition-all font-rajdhani font-bold whitespace-nowrap",
                        view === 'radar' ? "border-primary text-primary bg-primary/5" : "border-transparent text-foreground/40 hover:text-foreground"
                    )}
                >
                    <Trophy className="w-4 h-4" /> LEADERBOARD
                </button>
                <button
                    onClick={() => setView('smart-money')}
                    className={cn(
                        "px-6 py-3 flex items-center gap-2 border-b-2 transition-all font-rajdhani font-bold whitespace-nowrap",
                        view === 'smart-money' ? "border-primary text-primary bg-primary/5" : "border-transparent text-foreground/40 hover:text-foreground"
                    )}
                >
                    <TrendingUp className="w-4 h-4" /> SMART MONEY
                </button>
                <button
                    onClick={() => setView('squad')}
                    className={cn(
                        "px-6 py-3 flex items-center gap-2 border-b-2 transition-all font-rajdhani font-bold whitespace-nowrap",
                        view === 'squad' ? "border-primary text-primary bg-primary/5" : "border-transparent text-foreground/40 hover:text-foreground"
                    )}
                >
                    <Users className="w-4 h-4" /> MY TARGETS
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {view === 'radar' && <GlobalRadar onAddTarget={setSelectedTarget} />}
                {view === 'smart-money' && <SmartMoneyList onAddTarget={setSelectedTarget} />}
                {view === 'squad' && <TargetSquadList />}
            </div>

            {/* Intercept Drawer */}
            {selectedTarget && (
                <SignalInterceptDrawer
                    trader={selectedTarget}
                    onClose={() => setSelectedTarget(null)}
                    onSave={handleSaveTarget}
                />
            )}
        </div>
    );
}
