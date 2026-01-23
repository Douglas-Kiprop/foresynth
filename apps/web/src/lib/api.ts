/**
 * Foresynth API Client
 * 
 * Centralized client for all backend API calls.
 * Handles base URL configuration, error handling, and type safety.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
            response.status,
            errorData.detail || `API Error: ${response.status}`
        );
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return null as T;
    }

    return response.json();
}

// ============================================================================
// MARKETS API
// ============================================================================

export interface Market {
    id: string;
    question: string;
    slug: string;
    volume: number;
    liquidity: number;
    yes_price: number;
    no_price: number;
    end_date?: string;
    image?: string;
    category?: string;
    clob_token_id?: string;
}

export const marketsApi = {
    search: async (query: string, limit = 20): Promise<{ markets: Market[]; count: number }> => {
        return fetchApi(`/markets/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    },

    get: async (marketId: string): Promise<Market> => {
        return fetchApi(`/markets/${marketId}`);
    },

    trending: async (limit = 10): Promise<{ markets: Market[] }> => {
        return fetchApi(`/markets/trending/?limit=${limit}`);
    },
};

// ============================================================================
// WATCHLISTS API
// ============================================================================

export interface Watchlist {
    id: string;
    user_id: string;
    name: string;
    market_ids: string[];
    created_at: string;
}

export const watchlistsApi = {
    list: async (userId: string): Promise<{ watchlists: Watchlist[] }> => {
        return fetchApi(`/watchlists/?user_id=${userId}`);
    },

    create: async (userId: string, name: string, marketIds: string[] = []): Promise<Watchlist> => {
        return fetchApi(`/watchlists/?user_id=${userId}`, {
            method: "POST",
            body: JSON.stringify({ name, market_ids: marketIds }),
        });
    },

    get: async (watchlistId: string): Promise<Watchlist> => {
        return fetchApi(`/watchlists/${watchlistId}`);
    },

    update: async (watchlistId: string, data: Partial<Pick<Watchlist, "name" | "market_ids">>): Promise<Watchlist> => {
        return fetchApi(`/watchlists/${watchlistId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    delete: async (watchlistId: string): Promise<void> => {
        return fetchApi(`/watchlists/${watchlistId}`, { method: "DELETE" });
    },

    addMarket: async (watchlistId: string, marketId: string): Promise<Watchlist> => {
        return fetchApi(`/watchlists/${watchlistId}/markets/${marketId}`, { method: "POST" });
    },

    removeMarket: async (watchlistId: string, marketId: string): Promise<Watchlist> => {
        return fetchApi(`/watchlists/${watchlistId}/markets/${marketId}`, { method: "DELETE" });
    },
};

// ============================================================================
// SQUADS API (Smart Money)
// ============================================================================

export interface AlertConfig {
    min_trade_size: number;
    only_buy_orders: boolean;
    asset_class_filter: string[];
    channels: ("in-app" | "telegram" | "discord")[];
}

export interface TrackedTarget {
    id: string;
    squad_id: string;
    wallet_address: string;
    nickname?: string;
    alert_config: AlertConfig;
    created_at: string;
}

export interface Squad {
    id: string;
    user_id: string;
    name: string;
    is_active: boolean;
    targets: TrackedTarget[];
    created_at: string;
}

export const squadsApi = {
    list: async (userId: string): Promise<{ squads: Squad[] }> => {
        return fetchApi(`/squads/?user_id=${userId}`);
    },

    create: async (userId: string, name: string): Promise<Squad> => {
        return fetchApi(`/squads/?user_id=${userId}`, {
            method: "POST",
            body: JSON.stringify({ name }),
        });
    },

    get: async (squadId: string): Promise<Squad> => {
        return fetchApi(`/squads/${squadId}`);
    },

    update: async (squadId: string, data: Partial<Pick<Squad, "name" | "is_active">>): Promise<Squad> => {
        return fetchApi(`/squads/${squadId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        });
    },

    delete: async (squadId: string): Promise<void> => {
        return fetchApi(`/squads/${squadId}`, { method: "DELETE" });
    },

    addTarget: async (squadId: string, walletAddress: string, nickname?: string, alertConfig?: AlertConfig): Promise<TrackedTarget> => {
        return fetchApi(`/squads/${squadId}/targets`, {
            method: "POST",
            body: JSON.stringify({
                wallet_address: walletAddress,
                nickname,
                alert_config: alertConfig,
            }),
        });
    },

    removeTarget: async (squadId: string, targetId: string): Promise<void> => {
        return fetchApi(`/squads/${squadId}/targets/${targetId}`, { method: "DELETE" });
    },

    getLeaderboard: async (timeframe = "monthly"): Promise<any[]> => {
        return fetchApi(`/squads/leaderboard?window=${timeframe}`);
    },
};

// ============================================================================
// SIGNALS API (Insiders)
// ============================================================================

export interface InsiderSignal {
    id: string;
    wallet_address: string;
    market_id: string;
    trade_size: number;
    radar_score: number;
    metadata: {
        wallet_age_days?: number;
        wake_time?: string;
        speed_ratio?: number;
        side?: "YES" | "NO";
        market_title?: string;
    };
    created_at: string;
}

export const signalsApi = {
    feed: async (minScore = 0, maxAgeDays = 30, limit = 50): Promise<{ signals: InsiderSignal[]; count: number }> => {
        return fetchApi(`/signals/feed?min_score=${minScore}&max_age_days=${maxAgeDays}&limit=${limit}`);
    },

    get: async (signalId: string): Promise<InsiderSignal> => {
        return fetchApi(`/signals/${signalId}`);
    },

    byWallet: async (walletAddress: string): Promise<{ signals: InsiderSignal[]; count: number }> => {
        return fetchApi(`/signals/wallet/${walletAddress}`);
    },
};

// ============================================================================
// INTEL API (News)
// ============================================================================

export interface IntelItem {
    id: string;
    source: string;
    title: string;
    url: string;
    published_at: string;
    domain?: string;
    kind?: string;
}

export const intelApi = {
    feed: async (filter = "all", kind = "all", limit = 30): Promise<{ items: IntelItem[]; count: number }> => {
        return fetchApi(`/intel/feed?filter=${filter}&kind=${kind}&limit=${limit}`);
    },

    sources: async (): Promise<{ sources: Array<{ id: string; name: string; type: string }> }> => {
        return fetchApi(`/intel/sources`);
    },
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: "price_alert" | "wallet_alert" | "system";
    is_read: boolean;
    metadata?: Record<string, unknown>;
    created_at: string;
}

export const notificationsApi = {
    list: async (userId: string, unreadOnly = false): Promise<{ notifications: Notification[]; count: number }> => {
        return fetchApi(`/notifications/?user_id=${userId}&unread_only=${unreadOnly}`);
    },

    create: async (userId: string, title: string, message: string, type: Notification["type"]): Promise<Notification> => {
        return fetchApi(`/notifications/?user_id=${userId}`, {
            method: "POST",
            body: JSON.stringify({ title, message, type }),
        });
    },

    markAsRead: async (notificationId: string): Promise<Notification> => {
        return fetchApi(`/notifications/${notificationId}/read`, { method: "PATCH" });
    },

    markAllAsRead: async (userId: string): Promise<{ updated: number }> => {
        return fetchApi(`/notifications/read-all?user_id=${userId}`, { method: "POST" });
    },

    unreadCount: async (userId: string): Promise<{ count: number }> => {
        return fetchApi(`/notifications/unread-count?user_id=${userId}`);
    },

    delete: async (notificationId: string): Promise<void> => {
        return fetchApi(`/notifications/${notificationId}`, { method: "DELETE" });
    },
};
