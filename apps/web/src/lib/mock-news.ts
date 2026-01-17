import { faker } from '@faker-js/faker';
import { subMinutes } from 'date-fns';

export interface NewsItem {
    id: string;
    source: "Reuters" | "CoinDesk" | "Polymarket" | "X (Twitter)" | "Bloomberg" | "Financial Times";
    headline: string;
    summary: string;
    url: string;
    timestamp: Date;
    timeAgo: string; // "2m ago"
    topics: string[];
    sentiment: "bullish" | "bearish" | "neutral";
    impactScore: number; // 0-100
    imageUrl: string;
}

const TOPICS = ["US Election", "Fed", "Crypto", "Geopolitics", "AI", "Climate", "Tech"];

export function generateNews(count: number = 20): NewsItem[] {
    return Array.from({ length: count }).map(() => {
        const timestamp = subMinutes(new Date(), faker.number.int({ min: 1, max: 120 }));

        return {
            id: faker.string.uuid(),
            source: faker.helpers.arrayElement(["Reuters", "CoinDesk", "Polymarket", "X (Twitter)", "Bloomberg", "Financial Times"]),
            headline: faker.helpers.arrayElement([
                "Fed Chair Powell signals potential rate cut in March meeting due to cooling inflation data.",
                "Bitcoin surges past $105k as institutional inflows reach record highs.",
                "Trump leads in latest swing state polls by 4 points, betting markets react.",
                "OpenAI announces GPT-5 release date, aiming for Q3 2025.",
                "China announces new economic stimulus package to boost manufacturing sector.",
                "SEC approves Ethereum ETF staking, sparking rally in DeFi tokens.",
                "SpaceX Starship successfully reaches orbit conformably, Mars mission timeline accelerated.",
                "European Central Bank holds rates steady, warns of persistent service inflation."
            ]),
            summary: faker.lorem.sentence({ min: 10, max: 20 }),
            url: "#", // In real app, external link
            timestamp,
            timeAgo: `${faker.number.int({ min: 2, max: 59 })}m ago`,
            topics: faker.helpers.arrayElements(TOPICS, faker.number.int({ min: 1, max: 2 })),
            sentiment: faker.helpers.arrayElement(["bullish", "bearish", "neutral"]),
            impactScore: faker.number.int({ min: 10, max: 99 }),
            imageUrl: faker.image.urlLoremFlickr({ category: 'business', width: 200, height: 200 })
        };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}
