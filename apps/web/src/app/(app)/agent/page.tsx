import { AgentConfigWizard } from "@/components/agent/agent-config-wizard";
import { DecisionFeed } from "@/components/agent/decision-feed";

export default function AgentPage() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-orbitron font-bold text-foreground tracking-wide">
                    INTELLIGENT <span className="text-primary">ADVISOR</span>
                </h1>
                <p className="text-foreground/60 font-mono">
                    Autonomous market analysis engine fueled by LangGraph & Polymarket data.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration (1/3 width on large screens) */}
                <div className="lg:col-span-1 space-y-6">
                    <AgentConfigWizard />

                    {/* Helper info card */}
                    <div className="p-6 border border-sidebar-border rounded-lg bg-black/20 space-y-4">
                        <h4 className="font-bold text-sm text-foreground uppercase tracking-wider">How it works</h4>
                        <ul className="space-y-3 text-xs text-foreground/60">
                            <li className="flex gap-2">
                                <span className="text-primary">01.</span>
                                <span>The Supervisor node scans your <strong>Watchlists</strong> and <strong>Trapped Squads</strong>.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">02.</span>
                                <span>Specific markets are analyzed for price inefficiencies vs. news sentiment.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-primary">03.</span>
                                <span>High-confidence opportunities are pushed to this feed and your Telegram.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column: Decision Feed (2/3 width on large screens) */}
                <div className="lg:col-span-2">
                    <DecisionFeed />
                </div>
            </div>
        </div>
    );
}
