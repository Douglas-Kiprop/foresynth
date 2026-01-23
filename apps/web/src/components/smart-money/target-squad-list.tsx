import { useState, useEffect } from "react";
import { useSmartMoneyStore } from "@/stores/smart-money-store";
import { MOCK_TRADERS, TraderProfile } from "@/lib/mock-traders";
import { Trash2, ShieldAlert, Bell, BellOff, Plus, FilePlus2, Wallet, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSquadModal } from "@/components/smart-money/create-squad-modal";
import { AddWalletModal } from "@/components/smart-money/add-wallet-modal";

export function TargetSquadList() {
    const {
        squads, isLoading, loadSquads, removeTargetFromSquad,
        deleteSquad, toggleSquadAlerts, createSquad, addTargetToSquad
    } = useSmartMoneyStore();

    const [isCreatingSquad, setIsCreatingSquad] = useState(false);
    const [addingToSquadId, setAddingToSquadId] = useState<string | null>(null);

    useEffect(() => {
        loadSquads();
    }, []);

    if (isLoading && squads.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-foreground/40 font-mono text-sm">LOADING TACTICAL SQUADS...</p>
            </div>
        );
    }

    // Helper to rehydrate trader data or use manual data
    /* const getProfile = (target: any) => {
      if (target.traderId) {
        return MOCK_TRADERS.find(t => t.id === target.traderId);
      }
      return null;
    }; */

    return (
        <div className="space-y-8 animate-fade-in relative min-h-[400px]">

            {/* Empty State / Create Fab */}
            {squads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-sidebar-border rounded-lg bg-black/20">
                    <div className="p-4 rounded-full bg-sidebar border border-sidebar-border mb-4">
                        <FilePlus2 className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-orbitron font-bold text-foreground mb-2">NO TRACKING SQUADS</h3>
                    <p className="text-foreground/40 font-mono text-sm max-w-xs text-center mb-6">Create a squad to start organizing your smart money targets.</p>
                    <button
                        onClick={() => setIsCreatingSquad(true)}
                        className="px-6 py-3 bg-primary text-black font-bold font-mono text-xs rounded-sm hover:bg-white transition-colors"
                    >
                        CREATE NEW SQUAD
                    </button>
                </div>
            ) : (
                <div className="flex justify-end mb-4">
                    <button
                        onClick={() => setIsCreatingSquad(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-sidebar border border-sidebar-border hover:border-primary/50 text-foreground font-mono text-xs rounded-sm transition-all"
                    >
                        <Plus className="w-4 h-4" /> NEW SQUAD
                    </button>
                </div>
            )}

            {squads.map(squad => (
                <div key={squad.id} className="space-y-4 border border-sidebar-border/50 rounded-lg p-6 bg-sidebar/10">
                    {/* Squad Header */}
                    <div className="flex items-center justify-between border-b border-sidebar-border/50 pb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => toggleSquadAlerts(squad.id)}
                                className={cn(
                                    "p-2 rounded-full transition-colors",
                                    squad.globalAlertEnabled ? "bg-primary/20 text-primary" : "bg-white/5 text-foreground/20"
                                )}
                                title={squad.globalAlertEnabled ? "Squad Alerts ON" : "Squad Alerts OFF"}
                            >
                                {squad.globalAlertEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                            </button>
                            <div>
                                <h3 className="text-xl font-orbitron font-bold text-foreground">{squad.name}</h3>
                                <p className="text-xs font-mono text-foreground/40">{squad.targets.length} TARGETS ACQUIRED</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setAddingToSquadId(squad.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-mono font-bold rounded-sm border border-primary/20 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> ADD WALLET
                            </button>
                            <button
                                onClick={() => confirm("Delete this squad and all its targets?") && deleteSquad(squad.id)}
                                className="p-2 hover:bg-red-500/10 text-foreground/20 hover:text-red-400 rounded-sm transition-colors"
                                title="Delete Squad"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {squad.targets.length === 0 ? (
                        <div className="p-8 border border-dashed border-sidebar-border/50 rounded-lg bg-black/20 text-center">
                            <p className="text-foreground/40 font-mono text-xs">SQUAD EMPTY. ADD MANUAL WALLETS OR ACQUIRE FROM RADAR.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {squad.targets.map(target => {
                                // Try to hydrate if it's a known trader, else use manual data
                                const profile = target.traderId ? MOCK_TRADERS.find(t => t.id === target.traderId) : null;
                                const displayName = target.name || profile?.name || "Unknown Target";
                                const displayAddress = target.address || profile?.address || "0x???";

                                return (
                                    <div key={target.address} className="flex flex-col p-4 bg-black/40 border border-sidebar-border rounded-sm hover:border-primary/30 transition-all gap-4 group">
                                        <div className="flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-full bg-sidebar border border-sidebar-border flex items-center justify-center shrink-0 text-foreground/20">
                                                <Wallet className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-foreground truncate text-sm">{displayName}</div>
                                                <div className="text-[10px] font-mono text-foreground/40 truncate">{displayAddress}</div>
                                            </div>
                                            <button
                                                onClick={() => removeTargetFromSquad(squad.id, target.address)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 hover:text-red-400 text-foreground/20 rounded-sm transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>

                                        {/* Alert Config Pills */}
                                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary text-[9px] font-mono font-bold">
                                                <ShieldAlert className="w-2.5 h-2.5" /> &gt;${target.alertConfig.minTradeSize}
                                            </span>
                                            {target.alertConfig.onlyBuyOrders && (
                                                <span className="px-1.5 py-0.5 rounded-sm bg-green-500/10 text-green-400 text-[9px] font-mono font-bold">
                                                    BUY ONLY
                                                </span>
                                            )}
                                            {target.alertConfig.assetClassFilter && target.alertConfig.assetClassFilter.length < 5 && target.alertConfig.assetClassFilter.map(cat => (
                                                <span key={cat} className="px-1.5 py-0.5 rounded-sm bg-white/5 text-foreground/60 text-[9px] font-mono">
                                                    {cat}
                                                </span>
                                            ))}
                                            {target.alertConfig.assetClassFilter && target.alertConfig.assetClassFilter.length === 5 && (
                                                <span className="px-1.5 py-0.5 rounded-sm bg-white/5 text-foreground/60 text-[9px] font-mono">
                                                    ALL MARKETS
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}

            {/* Modals */}
            {isCreatingSquad && (
                <CreateSquadModal
                    onClose={() => setIsCreatingSquad(false)}
                    onCreate={createSquad}
                />
            )}

            {addingToSquadId && (
                <AddWalletModal
                    squadId={addingToSquadId}
                    onClose={() => setAddingToSquadId(null)}
                    onAdd={(address, config, name) => addTargetToSquad(addingToSquadId, address, config, name)}
                />
            )}
        </div>
    );
}
