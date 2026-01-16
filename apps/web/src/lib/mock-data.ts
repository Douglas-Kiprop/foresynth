export type Market = {
    id: string;
    question: string;
    outcome: string; // e.g., "Yes" or "Trump"
    probability: number; // 0-100
    volume: number;
    endDate: string; // ISO date
    createdDate: string; // ISO date
    history: { value: number; timestamp: number }[]; // For sparklines
};

export const MOCK_MARKETS: Market[] = [
    {
        id: "m1",
        question: "Donald Trump to win 2024 Presidential Election?",
        outcome: "Yes",
        probability: 52.4,
        volume: 342000000,
        createdDate: "2023-01-15T00:00:00Z",
        endDate: "2024-11-05T00:00:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({
            value: 45 + Math.random() * 15,
            timestamp: Date.now() - (20 - i) * 86400000
        }))
    },
    {
        id: "m2",
        question: "Bitcoin to hit $100k in 2024?",
        outcome: "Yes",
        probability: 12.8,
        volume: 45000000,
        createdDate: "2024-01-01T00:00:00Z",
        endDate: "2024-12-31T00:00:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({
            value: 10 + Math.random() * 5,
            timestamp: Date.now() - (20 - i) * 86400000
        }))
    },
    {
        id: "m3",
        question: "Fed interest rate cut in March?",
        outcome: "No",
        probability: 89.2,
        volume: 12000000,
        createdDate: "2023-12-01T00:00:00Z",
        endDate: "2024-03-20T00:00:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({
            value: 80 + Math.random() * 19,
            timestamp: Date.now() - (20 - i) * 86400000
        }))
    },
    {
        id: "m4",
        question: "Taylor Swift to endorse Biden?",
        outcome: "Yes",
        probability: 35.0,
        volume: 5600000,
        createdDate: "2024-02-10T00:00:00Z",
        endDate: "2024-11-04T00:00:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({
            value: 30 + Math.random() * 10,
            timestamp: Date.now() - (20 - i) * 86400000
        }))
    },
    {
        id: "m5",
        question: "Will GPT-5 be released in 2024?",
        outcome: "Yes",
        probability: 22.1,
        volume: 8900000,
        createdDate: "2023-11-15T00:00:00Z",
        endDate: "2024-12-31T00:00:00Z",
        history: Array.from({ length: 20 }, (_, i) => ({
            value: 15 + Math.random() * 15,
            timestamp: Date.now() - (20 - i) * 86400000
        }))
    }
];

export function searchMarkets(query: string): Market[] {
    const lowerQuery = query.toLowerCase();
    return MOCK_MARKETS.filter(m =>
        m.question.toLowerCase().includes(lowerQuery) ||
        m.outcome.toLowerCase().includes(lowerQuery)
    );
}
