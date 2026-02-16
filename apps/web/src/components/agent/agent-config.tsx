"use client";

import { useEffect, useState } from "react";
import { Brain, Save, Settings2, Sliders, Zap } from "lucide-react";
import { AgentConfig, agentApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

const RISK_LEVELS = ["conservative", "moderate", "degen"] as const;
const FOCUS_AREAS = ["politics", "crypto", "pop_culture", "sports", "science", "business"];
const SOURCES = ["watchlists", "squads", "news"];
const FREQUENCIES = ["low", "medium", "high"];

export function AgentConfigPanel() {
    const { user } = useAuth();
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadConfig();
        }
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
        return list.includes(item)
            ? list.filter((i) => i !== item)
            : [...list, item];
    };

    if (loading) return <div className="p-8 text-center text-foreground/40 animate-pulse">Loading neural configuration...</div>;
    if (!config) return null;

    return (
        <div className="bg-sidebar border border-sidebar-border rounded-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
                        <Brain className="w-6 h-6 text-primary animate-pulse" />
                    </div>
                    <div>
                        <h2 className="font-orbitron font-bold text-lg text-foreground">NEURAL CONFIGURATION</h2>
                        <p className="text-xs text-foreground/60 font-mono">Customize your autonomous advisor</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${config.is_active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500"}`} />
                        <span className="text-xs font-mono text-foreground/60">{config.is_active ? "ACTIVE" : "OFFLINE"}</span>
                    </div>
                    <button
                        onClick={() => setConfig({ ...config, is_active: !config.is_active })}
                        className={`text-xs px-3 py-1 rounded-sm border transition-all ${config.is_active
                            ? "border-green-500/50 text-green-500 hover:bg-green-500/10"
                            : "border-red-500/50 text-red-500 hover:bg-red-500/10"
                            }`}
                    >
                        {config.is_active ? "PAUSE" : "ACTIVATE"}
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {/* Risk Profile */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-mono text-foreground/60 uppercase">
                        <Sliders className="w-4 h-4" /> Risk Tolerance
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {RISK_LEVELS.map((level) => {
                            const isSelected = config.risk_profile === level;
                            return (
                                <button
                                    key={level}
                                    onClick={() => setConfig({ ...config, risk_profile: level })}
                                    className={`
                                        p-4 border rounded-sm text-center transition-all relative overflow-hidden group
                                        ${isSelected
                                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                                            : "border-sidebar-border bg-black/40 text-foreground/40 hover:border-sidebar-border/80 hover:text-foreground/80"}
                                    `}
                                >
                                    <div className="font-orbitron font-bold uppercase text-sm mb-1">{level}</div>
                                    <div className="text-[10px] opacity-60">
                                        {level === "conservative" && "High confidence only"}
                                        {level === "moderate" && "Balanced growth"}
                                        {level === "degen" && "Max volatility"}
                                    </div>
                                    {isSelected && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Focus Areas */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-mono text-foreground/60 uppercase">
                        <Settings2 className="w-4 h-4" /> Focus Sectors
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {FOCUS_AREAS.map((area) => {
                            const isSelected = config.focus_sectors.includes(area);
                            return (
                                <button
                                    key={area}
                                    onClick={() => setConfig({ ...config, focus_sectors: toggleList(config.focus_sectors, area) })}
                                    className={`
                                        px-4 py-2 rounded-full text-xs font-mono uppercase border transition-all
                                        ${isSelected
                                            ? "bg-foreground text-background border-foreground font-bold"
                                            : "bg-transparent text-foreground/60 border-sidebar-border hover:border-foreground/40"}
                                    `}
                                >
                                    {area.replace("_", " ")}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Data Sources */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-mono text-foreground/60 uppercase">
                        <Brain className="w-4 h-4" /> Intelligence Sources
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {SOURCES.map((source) => {
                            const isSelected = config.sources.includes(source);
                            return (
                                <button
                                    key={source}
                                    onClick={() => setConfig({ ...config, sources: toggleList(config.sources, source) })}
                                    className={`
                                        flex items-center justify-between p-3 rounded-sm border transition-all
                                        ${isSelected
                                            ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                                            : "bg-black/40 border-sidebar-border text-foreground/40"}
                                    `}
                                >
                                    <span className="font-mono text-xs uppercase">{source}</span>
                                    <div className={`w-3 h-3 rounded-sm border ${isSelected ? "bg-blue-500 border-blue-500" : "border-foreground/20"}`} />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Alert Frequency */}
                <div className="space-y-4">
                    <label className="flex items-center gap-2 text-sm font-mono text-foreground/60 uppercase">
                        <Zap className="w-4 h-4" /> Alert Frequency
                    </label>
                    <div className="flex gap-2">
                        {FREQUENCIES.map((freq) => {
                            const isSelected = config.alert_frequency === freq;
                            return (
                                <button
                                    key={freq}
                                    onClick={() => setConfig({ ...config, alert_frequency: freq })}
                                    className={`
                                        flex-1 py-2 text-xs font-mono uppercase rounded-sm border transition-all
                                        ${isSelected
                                            ? "bg-yellow-500/10 border-yellow-500 text-yellow-500 font-bold"
                                            : "bg-black/40 border-sidebar-border text-foreground/40 hover:border-foreground/40"}
                                    `}
                                >
                                    {freq}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-sidebar-border bg-black/40 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-bold font-orbitron hover:bg-white transition-colors disabled:opacity-50"
                >
                    {saving ? (
                        <>SAVING...</>
                    ) : (
                        <>
                            <Save className="w-4 h-4" /> SAVE CONFIGURATION
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
