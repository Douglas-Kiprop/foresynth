import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';

export type AlertConfig = {
    minTradeSize: number; // in USD
    onlyBuyOrders: boolean;
    assetClassFilter?: string[]; // e.g. ["Politics", "Crypto"]
    channels?: ("in-app" | "telegram" | "discord")[];
};

export type TargetSquad = {
    id: string;
    name: string;
    globalAlertEnabled: boolean;
    targets: {
        address: string;
        name?: string;
        traderId?: string;
        alertConfig: AlertConfig;
    }[];
};

type SmartMoneyState = {
    squads: TargetSquad[];
    isLoading: boolean;
    loadSquads: () => Promise<void>;
    createSquad: (name: string) => Promise<string | undefined>;
    deleteSquad: (id: string) => Promise<void>;
    addTargetToSquad: (squadId: string, address: string, config?: AlertConfig, name?: string, traderId?: string) => Promise<void>;
    removeTargetFromSquad: (squadId: string, address: string) => Promise<void>;
    toggleSquadAlerts: (squadId: string) => Promise<void>;
};

const DEFAULT_ALERT: AlertConfig = {
    minTradeSize: 1000,
    onlyBuyOrders: true,
    assetClassFilter: [],
    channels: ["in-app"]
};

export const useSmartMoneyStore = create<SmartMoneyState>((set, get) => ({
    squads: [],
    isLoading: false,

    loadSquads: async () => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
            // 1. Load Squads
            const { data: squadsData, error: squadsError } = await supabase
                .from('squads')
                .select('*')
                .order('created_at', { ascending: true });

            if (squadsError) throw squadsError;

            // 2. Load Targets for these squads
            const squadIds = squadsData.map(s => s.id);
            const { data: targetsData, error: targetsError } = await supabase
                .from('tracked_targets')
                .select('*')
                .in('squad_id', squadIds);

            if (targetsError) throw targetsError;

            // 3. Assemble state
            const squads: TargetSquad[] = squadsData.map(s => ({
                id: s.id,
                name: s.name,
                globalAlertEnabled: s.is_active,
                targets: (targetsData || [])
                    .filter(t => t.squad_id === s.id)
                    .map(t => ({
                        address: t.wallet_address,
                        name: t.nickname,
                        alertConfig: {
                            minTradeSize: t.alert_config?.min_trade_size || 1000,
                            onlyBuyOrders: t.alert_config?.only_buy_orders ?? true,
                            assetClassFilter: t.alert_config?.asset_class_filter || [],
                            channels: t.alert_config?.channels || ["in-app"]
                        }
                    }))
            }));

            set({ squads, isLoading: false });
        } catch (err) {
            console.error("Failed to load squads:", err);
            set({ isLoading: false });
        }
    },

    createSquad: async (name) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('squads')
                .insert({ name, user_id: user.id, is_active: true })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                squads: [...state.squads, { id: data.id, name, globalAlertEnabled: true, targets: [] }]
            }));
            return data.id;
        } catch (err: any) {
            console.error("Failed to create squad:", err.message || err);
        }
    },

    deleteSquad: async (id) => {
        const supabase = createClient();
        try {
            const { error } = await supabase.from('squads').delete().eq('id', id);
            if (error) throw error;

            set((state) => ({
                squads: state.squads.filter(s => s.id !== id)
            }));
        } catch (err) {
            console.error("Failed to delete squad:", err);
        }
    },

    addTargetToSquad: async (squadId, address, config = DEFAULT_ALERT, name, traderId) => {
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('tracked_targets')
                .insert({
                    squad_id: squadId,
                    wallet_address: address,
                    nickname: name,
                    alert_config: {
                        min_trade_size: config.minTradeSize,
                        only_buy_orders: config.onlyBuyOrders,
                        asset_class_filter: config.assetClassFilter,
                        channels: config.channels
                    }
                });

            if (error) throw error;

            set((state) => ({
                squads: state.squads.map(s =>
                    s.id === squadId
                        ? { ...s, targets: [...s.targets, { address, alertConfig: config, name, traderId }] }
                        : s
                )
            }));
        } catch (err: any) {
            console.error("Failed to add target:", err.message || err);
        }
    },

    removeTargetFromSquad: async (squadId, address) => {
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('tracked_targets')
                .delete()
                .eq('squad_id', squadId)
                .eq('wallet_address', address);

            if (error) throw error;

            set((state) => ({
                squads: state.squads.map(s =>
                    s.id === squadId
                        ? { ...s, targets: s.targets.filter(t => t.address !== address) }
                        : s
                )
            }));
        } catch (err) {
            console.error("Failed to remove target:", err);
        }
    },

    toggleSquadAlerts: async (squadId) => {
        const supabase = createClient();
        const squad = get().squads.find(s => s.id === squadId);
        if (!squad) return;

        const newState = !squad.globalAlertEnabled;

        try {
            const { error } = await supabase
                .from('squads')
                .update({ is_active: newState })
                .eq('id', squadId);

            if (error) throw error;

            set((state) => ({
                squads: state.squads.map(s =>
                    s.id === squadId ? { ...s, globalAlertEnabled: newState } : s
                )
            }));
        } catch (err) {
            console.error("Failed to toggle alerts:", err);
        }
    }
}));
