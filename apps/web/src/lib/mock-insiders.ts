import { faker } from '@faker-js/faker';
import { format, subDays, subHours } from 'date-fns';

export interface InsiderTrade {
    id: string;
    // Identity
    walletAddress: string;
    walletName?: string;
    profileUrl: string;
    radarScore: number; // 0-100 confidence

    // Trade Info
    marketTitle: string;
    marketUrl: string;
    side: "YES" | "NO";
    size: number; // USDC
    priceEntry: number;
    priceAverage: number;
    priceCurrent: number;
    timeSinceTrade: string; // e.g. "2h ago" (pre-calculated string for UI or use Date)
    timestamp: Date;

    // Wallet Analytics (The "Tell")
    walletAgeDays: number;
    wakeTimeDelta: string; // "2h 5m" between creation and trade
    wakeTimeSeconds: number; // for sorting
    speedRatio: number; // WC/TX %

    // Concentration
    marketTradesCount: number;
    marketVolume: number;
    volumeConcentration: number; // % of total portfolio
    marketPnL: number;

    // Totals
    totalTrades: number;
    uniqueMarkets: number;
    tradeConcentration: number;
    openPositions: number;
    openPositionsValue: number;
    totalPnL: number;
    totalVolume: number;

    // Verification
    activeMarket: boolean;
    activeHold: boolean;
    txHash: string;
}

const CATEGORIES = ["Politics", "Crypto", "Pop Culture", "Sports", "Science"];

export function generateInsiders(count: number = 20): InsiderTrade[] {
    return Array.from({ length: count }).map(() => {
        const isRookie = Math.random() > 0.4;
        const walletAge = isRookie ? faker.number.int({ min: 1, max: 20 }) : faker.number.int({ min: 30, max: 365 });

        // Low wake time for rookies = suspicious
        const wakeTimeSeconds = isRookie ? faker.number.int({ min: 300, max: 86400 }) : faker.number.int({ min: 86400, max: 1000000 });
        const speedRatio = isRookie ? (wakeTimeSeconds / (walletAge * 86400)) * 100 : Math.random() * 50;

        const size = faker.number.int({ min: 500, max: 50000 });
        const priceEntry = faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 });
        // Average price usually close to entry but maybe slightly different due to scaling
        const priceAverage = priceEntry * faker.number.float({ min: 0.95, max: 1.05, fractionDigits: 2 });
        const priceCurrent = priceEntry * faker.number.float({ min: 0.8, max: 1.5, fractionDigits: 2 });

        // High radar score for fast rookies with big volume
        let score = 50;
        if (walletAge < 7) score += 20;
        if (size > 10000) score += 15;
        if (wakeTimeSeconds < 3600) score += 15;

        // Cap score at 99
        score = Math.min(99, Math.floor(score));

        return {
            id: faker.string.uuid(),
            walletAddress: `0x${faker.string.hexadecimal({ length: 4 }).slice(2)}...${faker.string.hexadecimal({ length: 4 }).slice(2)}`,
            walletName: Math.random() > 0.7 ? faker.internet.username() : undefined,
            profileUrl: "#",
            radarScore: score,

            marketTitle: faker.helpers.arrayElement([
                "Trump to announce Bitcoin Startiegic Reserve?",
                "Will Fed cut rates in March?",
                "Bitcoin > $100k before 2026?",
                "Taylor Swift vs Kanye West Debate?",
                "GPT-5 Release Date?",
                "ETH ETF Approval Odds"
            ]),
            marketUrl: "#",
            side: Math.random() > 0.5 ? "YES" : "NO",
            size: size,
            priceEntry,
            priceAverage: Math.min(0.99, priceAverage),
            priceCurrent: Math.min(0.99, priceCurrent),
            timeSinceTrade: `${faker.number.int({ min: 1, max: 23 })}h ago`,
            timestamp: subHours(new Date(), faker.number.int({ min: 1, max: 48 })),

            walletAgeDays: walletAge,
            wakeTimeDelta: `${Math.floor(wakeTimeSeconds / 3600)}h ${Math.floor((wakeTimeSeconds % 3600) / 60)}m`,
            wakeTimeSeconds,
            speedRatio: Number(speedRatio.toFixed(1)),

            marketTradesCount: faker.number.int({ min: 1, max: 50 }),
            marketVolume: size * 1.2,
            volumeConcentration: faker.number.int({ min: 10, max: 90 }),
            marketPnL: (priceCurrent - priceEntry) * size,

            totalTrades: faker.number.int({ min: 5, max: 500 }),
            uniqueMarkets: faker.number.int({ min: 1, max: 20 }),
            tradeConcentration: faker.number.int({ min: 5, max: 50 }),
            openPositions: faker.number.int({ min: 1, max: 10 }),
            openPositionsValue: faker.number.int({ min: 1000, max: 100000 }),
            totalPnL: faker.number.int({ min: -5000, max: 50000 }),
            totalVolume: faker.number.int({ min: 10000, max: 1000000 }),

            activeMarket: true,
            activeHold: Math.random() > 0.2,
            txHash: `https://polygonscan.com/tx/0x...`,
        };
    }).sort((a, b) => b.radarScore - a.radarScore); // Sort by highest score default
}
