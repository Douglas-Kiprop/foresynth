export type TraderProfile = {
    id: string;
    address: string; // 0x...
    name?: string; // Optional ENS or pseudonym
    profileImage?: string;
    rank: number;
    totalProfit: number;
    volume: number;
    winRate: number; // 0-100
    totalBets: number;
    topCategory: string; // e.g. "Politics", "Crypto"
    lastActive: string; // ISO date
    history: { value: number; timestamp: number }[]; // Profit history
    wins?: number;
    losses?: number;
};

export const MOCK_TRADERS: TraderProfile[] = [
    {
        id: "t1",
        address: "0x7a2...9f3a",
        name: "GCR_Prime",
        rank: 1,
        totalProfit: 2450000,
        volume: 15000000,
        winRate: 68.5,
        totalBets: 450,
        topCategory: "Crypto",
        lastActive: "2024-05-15T14:30:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({ value: 2000000 + Math.random() * 500000, timestamp: i }))
    },
    {
        id: "t2",
        address: "0x1b4...2c9d",
        name: "TrumpWhale",
        rank: 2,
        totalProfit: 1890000,
        volume: 8200000,
        winRate: 55.2,
        totalBets: 120,
        topCategory: "Politics",
        lastActive: "2024-05-14T09:15:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({ value: 1500000 + Math.random() * 400000, timestamp: i }))
    },
    {
        id: "t3",
        address: "0x9c8...4e1f",
        rank: 3,
        totalProfit: 1200000,
        volume: 35000000, // High volume, lower margin
        winRate: 51.5,
        totalBets: 2400, // HFT-ish
        topCategory: "Sports",
        lastActive: "2024-05-15T16:45:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({ value: 1000000 + Math.random() * 300000, timestamp: i }))
    },
    {
        id: "t4",
        address: "0x3d2...8a7b",
        name: "Sniper_Elite",
        rank: 15,
        totalProfit: 450000,
        volume: 800000,
        winRate: 92.4, // Sniper
        totalBets: 45,
        topCategory: "Politics",
        lastActive: "2024-05-10T11:00:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({ value: 300000 + Math.random() * 200000, timestamp: i }))
    },
    {
        id: "t5",
        address: "0x5e6...1f2a",
        rank: 42,
        totalProfit: 120000,
        volume: 250000,
        winRate: 88.0, // Sniper
        totalBets: 25,
        topCategory: "Crypto",
        lastActive: "2024-05-12T13:20:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({ value: 50000 + Math.random() * 100000, timestamp: i }))
    }
];

export function getTopTraders(sortBy: 'profit' | 'winrate' = 'profit') {
    if (sortBy === 'winrate') {
        return [...MOCK_TRADERS].sort((a, b) => b.winRate - a.winRate);
    }
    return [...MOCK_TRADERS].sort((a, b) => b.totalProfit - a.totalProfit);
}
