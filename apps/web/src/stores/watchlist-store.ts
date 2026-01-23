import { create } from 'zustand';
import { createClient } from '@/utils/supabase/client';
import { Market } from '@/lib/mock-data';

export type Watchlist = {
    id: string;
    name: string;
    markets: Market[];
    createdAt: number;
};

export type PriceAlert = {
    id: string;
    market_id: string;
    condition: 'above' | 'below';
    threshold: number;
    is_active: boolean;
    channels: string[];
};

type WatchlistState = {
    watchlists: Watchlist[];
    alerts: PriceAlert[];
    isLoading: boolean;
    loadWatchlists: () => Promise<void>;
    loadPriceAlerts: () => Promise<void>;
    createWatchlist: (name: string, markets: Market[]) => Promise<void>;
    deleteWatchlist: (id: string) => Promise<void>;
    addMarketToWatchlist: (watchlistId: string, market: Market) => Promise<void>;
    removeMarketFromWatchlist: (watchlistId: string, marketId: string) => Promise<void>;

    // Price Alerts
    createPriceAlert: (marketId: string, condition: 'above' | 'below', threshold: number, channels: string[]) => Promise<void>;
    deletePriceAlert: (marketId: string) => Promise<void>;
};

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
    watchlists: [],
    alerts: [],
    isLoading: false,

    loadWatchlists: async () => {
        const supabase = createClient();
        set({ isLoading: true });

        try {
            const { data, error } = await supabase
                .from('watchlists')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const watchlists: Watchlist[] = data.map(w => ({
                id: w.id,
                name: w.name,
                markets: w.market_ids.map((id: string) => ({ id, question: `Market ${id}`, probability: 50 })),
                createdAt: new Date(w.created_at).getTime()
            }));

            set({ watchlists, isLoading: false });
        } catch (err) {
            console.error("Failed to load watchlists:", err);
            set({ isLoading: false });
        }
    },

    loadPriceAlerts: async () => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase
                .from('price_alerts')
                .select('*');

            if (error) throw error;
            set({ alerts: data || [] });
        } catch (err) {
            console.error("Failed to load price alerts:", err);
        }
    },

    createWatchlist: async (name, markets) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const marketIds = markets.map(m => m.id);

        try {
            const { data, error } = await supabase
                .from('watchlists')
                .insert({ name, user_id: user.id, market_ids: marketIds })
                .select()
                .single();

            if (error) throw error;

            set((state) => ({
                watchlists: [...state.watchlists, {
                    id: data.id,
                    name,
                    markets,
                    createdAt: Date.now()
                }]
            }));
        } catch (err) {
            console.error("Failed to create watchlist:", err);
        }
    },

    deleteWatchlist: async (id) => {
        const supabase = createClient();
        try {
            const { error } = await supabase.from('watchlists').delete().eq('id', id);
            if (error) throw error;

            set((state) => ({
                watchlists: state.watchlists.filter(w => w.id !== id)
            }));
        } catch (err) {
            console.error("Failed to delete watchlist:", err);
        }
    },

    addMarketToWatchlist: async (watchlistId, market) => {
        const supabase = createClient();
        const watchlist = get().watchlists.find(w => w.id === watchlistId);
        if (!watchlist) return;

        const newMarketIds = Array.from(new Set([...watchlist.markets.map(m => m.id), market.id]));

        try {
            const { error } = await supabase
                .from('watchlists')
                .update({ market_ids: newMarketIds })
                .eq('id', watchlistId);

            if (error) throw error;

            set((state) => ({
                watchlists: state.watchlists.map(w =>
                    w.id === watchlistId
                        ? { ...w, markets: w.markets.find(m => m.id === market.id) ? w.markets : [...w.markets, market] }
                        : w
                )
            }));
        } catch (err) {
            console.error("Failed to add market to watchlist:", err);
        }
    },

    removeMarketFromWatchlist: async (watchlistId, marketId) => {
        const supabase = createClient();
        const watchlist = get().watchlists.find(w => w.id === watchlistId);
        if (!watchlist) return;

        const newMarketIds = watchlist.markets.map(m => m.id).filter(id => id !== marketId);

        try {
            const { error } = await supabase
                .from('watchlists')
                .update({ market_ids: newMarketIds })
                .eq('id', watchlistId);

            if (error) throw error;

            set((state) => ({
                watchlists: state.watchlists.map(w =>
                    w.id === watchlistId
                        ? { ...w, markets: w.markets.filter(m => m.id !== marketId) }
                        : w
                )
            }));
        } catch (err) {
            console.error("Failed to remove market from watchlist:", err);
        }
    },

    createPriceAlert: async (marketId, condition, threshold, channels) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('price_alerts')
                .insert({
                    user_id: user.id,
                    market_id: marketId,
                    condition,
                    threshold,
                    is_active: true,
                    channels
                })
                .select()
                .single();

            if (error) throw error;

            set(state => ({
                alerts: [...state.alerts, data]
            }));
        } catch (err) {
            console.error("Failed to create price alert:", err);
        }
    },

    deletePriceAlert: async (marketId) => {
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('price_alerts')
                .delete()
                .eq('market_id', marketId);

            if (error) throw error;

            set(state => ({
                alerts: state.alerts.filter(a => a.market_id !== marketId)
            }));
        } catch (err) {
            console.error("Failed to delete price alert:", err);
        }
    }
}));
