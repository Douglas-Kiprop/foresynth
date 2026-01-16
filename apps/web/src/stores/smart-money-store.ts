import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AlertConfig = {
    minTradeSize: number; // in USD
    onlyBuyOrders: boolean;
    assetClassFilter?: string[]; // e.g. ["Politics", "Crypto"]
};

export type TargetSquad = {
    id: string;
    name: string;
    globalAlertEnabled: boolean;
    targets: {
        address: string; // Changed from traderId to address to support arbitrary wallets
        name?: string; // Optional nickname for manual adds
        traderId?: string; // Optional link to mock profile if from leaderboard
        alertConfig: AlertConfig;
    }[];
};

type SmartMoneyState = {
    squads: TargetSquad[];
    createSquad: (name: string) => void;
    deleteSquad: (id: string) => void;
    addTargetToSquad: (squadId: string, address: string, config?: AlertConfig, name?: string, traderId?: string) => void;
    removeTargetFromSquad: (squadId: string, address: string) => void;
    toggleSquadAlerts: (squadId: string) => void;
};

const DEFAULT_ALERT: AlertConfig = {
    minTradeSize: 1000,
    onlyBuyOrders: true,
    assetClassFilter: []
};

// Default state is now EMPTY, no forced "Alpha Squad"
export const useSmartMoneyStore = create<SmartMoneyState>()(
    persist(
        (set) => ({
            squads: [],
            createSquad: (name) => set((state) => ({
                squads: [...state.squads, { id: crypto.randomUUID(), name, globalAlertEnabled: true, targets: [] }]
            })),
            deleteSquad: (id) => set((state) => ({
                squads: state.squads.filter(s => s.id !== id)
            })),
            addTargetToSquad: (squadId, address, config = DEFAULT_ALERT, name, traderId) => set((state) => ({
                squads: state.squads.map(s =>
                    s.id === squadId
                        ? { ...s, targets: [...s.targets, { address, alertConfig: config, name, traderId }] }
                        : s
                )
            })),
            removeTargetFromSquad: (squadId, address) => set((state) => ({
                squads: state.squads.map(s =>
                    s.id === squadId
                        ? { ...s, targets: s.targets.filter(t => t.address !== address) }
                        : s
                )
            })),
            toggleSquadAlerts: (squadId) => set((state) => ({
                squads: state.squads.map(s =>
                    s.id === squadId ? { ...s, globalAlertEnabled: !s.globalAlertEnabled } : s
                )
            }))
        }),
        {
            name: 'foresynth-smart-money-v2', // Version bumped to reset storage
            storage: createJSONStorage(() => localStorage),
        }
    )
);
