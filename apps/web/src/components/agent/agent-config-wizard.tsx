"use client";

import { useEffect, useState } from "react";
import { Brain, Save, ArrowRight, ArrowLeft, Zap, Shield, Globe, Activity, CheckCircle2, Circle } from "lucide-react";
import { AgentConfig, agentApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const STEPS = [
    { id: "identity", label: "Identity & Status" },
    { id: "intelligence", label: "Intelligence" },
    { id: "strategy", label: "Strategy & Risk" },
];

const RISK_LEVELS = [
    { id: "conservative", label: "Conservative", desc: "High confidence trades only. Preserves capital." },
    { id: "moderate", label: "Moderate", desc: "Balanced approach. Seeks consistent growth." },
    { id: "degen", label: "Degen", desc: "High volatility. Maximizes potential alpha." },
] as const;

const SOURCES = [
    { id: "watchlists", label: "Watchlists", desc: "Monitor markets in your saved lists." },
    { id: "squads", label: "Squads", desc: "Track smart money wallets in your squads." },
    { id: "news", label: "Global News", desc: "Scan global news for market-moving events." },
];

export function AgentConfigWizard() {
    const { user } = useAuth();
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (user?.id) loadConfig();
    }, [user?.id]);

    const loadConfig = async () => {
        try {
            if (!user?.id) return;
            const data = await agentApi.getConfig(user.id);
            setConfig(data);
        } catch (error) {
            console.error("Failed to load agent config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.id || !config) return;
        setSaving(true);
        try {
            const updated = await agentApi.updateConfig(user.id, config);
            setConfig(updated);
        } catch (error) {
            console.error("Failed to save config:", error);
        } finally {
            setSaving(false);
        }
    };

    const toggleList = (list: string[], item: string) => {
        return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
    };

    if (loading) return <div className="p-12 text-center text-foreground/40 animate-pulse font-mono">Initializing Neural Core...</div>;
    if (!config) return null;

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-8 px-4">
            {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                return (
                    <div key={step.id} className="flex flex-col items-center relative z-10 w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 
                            ${isActive ? "bg-primary border-primary text-black scale-110 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" :
                                isCompleted ? "bg-primary/20 border-primary text-primary" : "bg-sidebar border-sidebar-border text-foreground/40"}`}>
                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`text-[10px] mt-2 uppercase tracking-wider font-mono transition-colors duration-300 ${isActive ? "text-primary font-bold" : "text-foreground/40"}`}>
                            {step.label}
                        </span>
                        {index < STEPS.length - 1 && (
                            <div className="absolute top-4 left-1/2 w-full h-[2px] -z-10 bg-sidebar-border">
                                <div className="h-full bg-primary transition-all duration-500" style={{ width: isCompleted ? "100%" : "0%" }} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="bg-sidebar/50 border border-sidebar-border rounded-xl backdrop-blur-sm overflow-hidden flex flex-col min-h-[500px]">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border bg-black/40 flex justify-between items-center">
                <h2 className="font-orbitron font-bold text-xl flex items-center gap-2">
                    <Brain className="w-5 h-5 text-primary" /> AGENT CONFIGURATION
                </h2>
                <div className={`px-3 py-1 rounded-full text-xs font-mono border ${config.is_active ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
                    {config.is_active ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
                </div>
            </div>

            <div className="flex-1 p-8">
                {renderStepIndicator()}

                <div className="max-w-2xl mx-auto min-h-[300px]">
                    {/* STEP 1: IDENTITY */}
                    {currentStep === 0 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground">Agent Status</h3>
                                <div className="p-4 border border-sidebar-border rounded-lg bg-black/20 flex items-center justify-between group hover:border-sidebar-border/80 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.is_active ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}>
                                            <Activity className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-foreground">Active Status</div>
                                            <div className="text-xs text-foreground/60">Pause or resume all autonomous operations.</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setConfig({ ...config, is_active: !config.is_active })}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${config.is_active ? "bg-green-500" : "bg-sidebar-border"}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${config.is_active ? "translate-x-6" : "translate-x-0"}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: INTELLIGENCE */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground">Data Sources</h3>
                                <div className="grid gap-3">
                                    {SOURCES.map((source) => {
                                        const isSelected = config.sources.includes(source.id);
                                        return (
                                            <div
                                                key={source.id}
                                                onClick={() => setConfig({ ...config, sources: toggleList(config.sources, source.id) })}
                                                className={`cursor-pointer p-4 border rounded-lg flex items-center gap-4 transition-all duration-200
                                                    ${isSelected ? "bg-primary/5 border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]" : "bg-black/20 border-sidebar-border hover:border-foreground/50"}
                                                `}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-foreground/40"}`}>
                                                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>{source.label}</div>
                                                    <div className="text-xs text-foreground/60">{source.desc}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <h3 className="text-lg font-bold text-foreground">Focus Sectors</h3>
                                <div className="flex flex-wrap gap-2">
                                    {["politics", "crypto", "pop_culture", "sports", "science", "business"].map((sector) => {
                                        const isSelected = config.focus_sectors.includes(sector);
                                        return (
                                            <button
                                                key={sector}
                                                onClick={() => setConfig({ ...config, focus_sectors: toggleList(config.focus_sectors, sector) })}
                                                className={`px-4 py-2 rounded-md text-xs font-mono uppercase border transition-all
                                                    ${isSelected ? "bg-foreground text-background border-foreground font-bold" : "bg-transparent text-foreground/60 border-sidebar-border hover:border-foreground/40"}
                                                `}
                                            >
                                                {sector.replace("_", " ")}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: STRATEGY */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground">Risk Profile</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {RISK_LEVELS.map((level) => {
                                        const isSelected = config.risk_profile === level.id;
                                        return (
                                            <div
                                                key={level.id}
                                                onClick={() => setConfig({ ...config, risk_profile: level.id })}
                                                className={`cursor-pointer p-4 border rounded-lg flex flex-col gap-2 transition-all relative overflow-hidden
                                                    ${isSelected ? "bg-primary/10 border-primary" : "bg-black/20 border-sidebar-border hover:border-foreground/50"}
                                                `}
                                            >
                                                <div className="font-orbitron font-bold text-sm uppercase">{level.label}</div>
                                                <div className="text-[10px] text-foreground/60 leading-tight">{level.desc}</div>
                                                {isSelected && <div className="absolute top-0 right-0 p-1"><CheckCircle2 className="w-4 h-4 text-primary" /></div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <h3 className="text-lg font-bold text-foreground">Alert Frequency</h3>
                                <div className="flex items-center gap-4 bg-black/20 p-4 rounded-lg border border-sidebar-border">
                                    <Zap className="w-5 h-5 text-yellow-500" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="1"
                                        value={["low", "medium", "high"].indexOf(config.alert_frequency)}
                                        onChange={(e) => setConfig({ ...config, alert_frequency: ["low", "medium", "high"][parseInt(e.target.value)] })}
                                        className="flex-1 h-2 bg-sidebar-border rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="font-mono text-xs uppercase w-16 text-right font-bold text-primary">{config.alert_frequency}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-sidebar-border bg-black/40 flex justify-between">
                <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase text-foreground/60 hover:text-foreground disabled:opacity-0 transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {currentStep < STEPS.length - 1 ? (
                    <button
                        onClick={() => setCurrentStep(currentStep + 1)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary/10 border border-primary/50 text-primary hover:bg-primary hover:text-black font-bold font-orbitron transition-all rounded-sm"
                    >
                        Next Channel <ArrowRight className="w-4 h-4" />
                    </button>
                ) : (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-black font-bold font-orbitron hover:bg-white transition-all rounded-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                    >
                        {saving ? "SAVING..." : (
                            <>
                                <Save className="w-4 h-4" /> DEPLOY CONFIG
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
