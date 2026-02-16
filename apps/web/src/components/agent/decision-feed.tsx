"use client";

import { useEffect, useState } from "react";
import { AgentDecision, agentApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ArrowRight, ExternalLink, RefreshCw, Zap, TrendingUp, TrendingDown, Clock, Activity } from "lucide-react";

export function DecisionFeed() {
    const { user } = useAuth();
    const [decisions, setDecisions] = useState<AgentDecision[]>([]);
    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        if (user?.id) {
            loadDecisions();
        }
    }, [user?.id]);

    const loadDecisions = async () => {
        try {
            if (!user?.id) return;
            const data = await agentApi.getDecisions(user.id);
            setDecisions(data);
        } catch (error) {
            console.error("Failed to load decisions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!user?.id) return;
        setAnalyzing(true);
        try {
            await agentApi.triggerAnalysis(user.id);
            setTimeout(loadDecisions, 2000);
        } catch (error) {
            console.error("Analysis trigger failed:", error);
        } finally {
            setAnalyzing(false);
        }
    };

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case "BUY_YES": return "text-green-400 bg-green-400/10 border-green-400/20";
            case "BUY_NO": return "text-red-400 bg-red-400/10 border-red-400/20";
            case "HOLD": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
            default: return "text-gray-400 bg-gray-400/10 border-gray-400/20";
        }
    };

    const formatSignal = (signal: string) => signal.replace("BUY_", "").replace("_", " ");

    if (loading) return <div className="p-8 text-center text-foreground/40 font-mono animate-pulse border border-sidebar-border rounded-xl">Initializing Feed Protocol...</div>;

    return (
        <div className="bg-sidebar border border-sidebar-border rounded-xl overflow-hidden flex flex-col h-full min-h-[600px]">
            {/* Header */}
            <div className="p-6 border-b border-sidebar-border bg-black/40 flex items-center justify-between">
                <div>
                    <h3 className="font-orbitron font-bold text-lg text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" /> LIVE INTELLIGENCE
                    </h3>
                    <p className="text-xs text-foreground/60 font-mono">Real-time market analysis stream</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadDecisions}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors text-foreground/60 hover:text-foreground"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleAnalyze}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-50 rounded-sm"
                    >
                        {analyzing ? <span className="animate-pulse">SCANNING...</span> : "RUN SCAN"}
                    </button>
                </div>
            </div>

            {/* Feed List */}
            <div className="flex-1 overflow-auto divide-y divide-sidebar-border/50">
                {decisions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                        <div className="w-16 h-16 rounded-full bg-sidebar-border/30 flex items-center justify-center mb-4">
                            <Zap className="w-8 h-8 text-foreground/20" />
                        </div>
                        <p className="text-foreground/40 font-mono">No intelligence generated yet.</p>
                        <p className="text-xs text-foreground/30 mt-2">Activate the agent to begin autonomous market scanning.</p>
                    </div>
                ) : (
                    decisions.map((decision) => (
                        <div key={decision.id} className="p-5 hover:bg-black/20 transition-colors group relative">
                            {/* Left Border Indicator */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${decision.signal.includes("YES") ? "bg-green-500" :
                                    decision.signal.includes("NO") ? "bg-red-500" : "bg-yellow-500"
                                }`} />

                            <div className="flex flex-col gap-3">
                                {/* Top Row: Signal & Meta */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded textxs font-bold font-mono border ${getSignalColor(decision.signal)}`}>
                                            {formatSignal(decision.signal)}
                                        </span>
                                        <span className="text-[10px] text-foreground/40 font-mono flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(decision.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase text-foreground/40 font-mono">Confidence</span>
                                        <div className="w-16 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${decision.confidence > 0.7 ? "bg-primary" : "bg-yellow-500"}`}
                                                style={{ width: `${decision.confidence * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-foreground">{(decision.confidence * 100).toFixed(0)}%</span>
                                    </div>
                                </div>

                                {/* Content: Question & Reasoning */}
                                <div>
                                    <h4 className="font-bold text-foreground text-sm leading-tight mb-1 group-hover:text-primary transition-colors cursor-pointer">
                                        {decision.market_question}
                                    </h4>
                                    <p className="text-xs text-foreground/70 leading-relaxed font-mono">
                                        {decision.reasoning}
                                    </p>
                                </div>

                                {/* Footer: Factors & Actions */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex flex-wrap gap-1.5">
                                        {decision.key_factors.map((factor, i) => (
                                            <span key={i} className="px-1.5 py-0.5 bg-black/40 rounded border border-sidebar-border text-[9px] text-foreground/50 uppercase tracking-wide">
                                                {factor}
                                            </span>
                                        ))}
                                    </div>

                                    {decision.market_slug && (
                                        <a
                                            href={`https://polymarket.com/event/${decision.market_slug}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="ml-auto text-xs text-primary/80 hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all font-mono uppercase"
                                        >
                                            Market <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
