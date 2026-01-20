import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Market } from '@/lib/mock-data';

export type Watchlist = {
    id: string;
    name: string;
    markets: Market[];
    createdAt: number;
};

type WatchlistState = {
    watchlists: Watchlist[];
    createWatchlist: (name: string, markets: Market[]) => void;
    deleteWatchlist: (id: string) => void;
    addMarketToWatchlist: (watchlistId: string, market: Market) => void;
    removeMarketFromWatchlist: (watchlistId: string, marketId: string) => void;
};

export const useWatchlistStore = create<WatchlistState>()(
    persist(
        (set) => ({
            watchlists: [],
            createWatchlist: (name, markets) => set((state) => {
                // Ensure unique market IDs
                const uniqueMarkets = Array.from(new Map(markets.map(m => [m.id, m])).values());
                return {
                    watchlists: [
                        ...state.watchlists,
                        {
                            id: crypto.randomUUID(),
                            name,
                            markets: uniqueMarkets,
                            createdAt: Date.now()
                        }
                    ]
                };
            }),
            deleteWatchlist: (id) => set((state) => ({
                watchlists: state.watchlists.filter(w => w.id !== id)
            })),
            addMarketToWatchlist: (watchlistId, market) => set((state) => ({
                watchlists: state.watchlists.map(w =>
                    w.id === watchlistId
                        ? {
                            ...w,
                            markets: w.markets.find(m => m.id === market.id)
                                ? w.markets
                                : [...w.markets, market]
                        }
                        : w
                )
            })),
            removeMarketFromWatchlist: (watchlistId, marketId) => set((state) => ({
                watchlists: state.watchlists.map(w =>
                    w.id === watchlistId
                        ? { ...w, markets: w.markets.filter(m => m.id !== marketId) }
                        : w
                )
            })),
        }),
        {
            name: 'foresynth-watchlists',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
