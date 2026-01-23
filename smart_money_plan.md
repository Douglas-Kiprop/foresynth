
# Smart Money "Win Rate" Implementation Plan

## Objective
Implement a "Smart Money" list that ranks top traders by **Win Rate**. We will derive this data by fetching the Global Leaderboard to identify top traders, then analyzing their **Closed Positions** to calculate win/loss metrics.

## Architecture

### 1. Backend: Polymarket Service Expansion
We need to extend `PolymarketService` to fetch detailed trade history.

*   **New Method**: `get_closed_positions(wallet_address: str, limit: int = 100)`
    *   **Endpoint**: `https://data-api.polymarket.com/v1/closed-positions`
    *   **Params**: `user={address}`, `limit={limit}`, `sortBy=timestamp`, `sortDirection=DESC` (Get most recent trades to estimate current form).
    *   **Logic**: Fetch recent closed positions to analyze performance.

### 2. Backend: Smart Money Orchestration (New Endpoint)
Create a new endpoint `GET /api/v1/squads/smart-money` that aggregates and computes the data.

*   **Flow**:
    1.  **Fetch Leaderboard**: Call `get_leaderboard(window="monthly")` to get the top ~20-30 active profitable traders.
    2.  **Parallel Data Fetching**: For each trader in the leaderboard:
        *   Spawn an async task to call `get_closed_positions`.
    3.  **Compute Signals**: For each trader, calculate:
        *   **Total Trades** (in fetched sample).
        *   **Wins**: `realizedPnl > 0`.
        *   **Losses**: `realizedPnl <= 0`.
        *   **Win Rate**: `(Wins / Total) * 100`.
        *   **Profit Factor** (optional): `Gross Profit / Gross Loss`.
    4.  **Filter & Sort**:
        *   **Filter**: Minimum trade count (e.g., > 5 in sample) to ensure statistical significance.
        *   **Sort**: By `Win Rate` (descending).
    5.  **Caching**: Critical. This operation involves N+1 API calls. We must cache the final result for 5-10 minutes.

### 3. Frontend: Integration
Update `apps/web/src/components/smart-money/smart-money-list.tsx`.

*   **Data Fetching**: Replace mock `getTopTraders` with `useQuery` (swr/tanstack) fetching from `/api/v1/squads/smart-money`.
*   **Loading State**: Use the existing `SmartMoneyListSkeleton`.
*   **Error Handling**: Graceful fallback if API fails.
*   **Columns**: Ensure the table reflects real data (Rank, Trader, Net P/L, Volume, Win Rate, etc.).

## Detailed Steps

1.  **Modify `apps/api/src/services/polymarket.py`**:
    *   Add `get_closed_positions` method.
    *   Ensure robust error handling (some wallets might fail).

2.  **Modify `apps/api/src/routers/squads.py`**:
    *   Add `/smart-money` endpoint.
    *   Implement the aggregation logic using `asyncio.gather` for parallel fetching.
    *   Implement caching strategy.

3.  **Modify `apps/web/src/components/smart-money/smart-money-list.tsx`**:
    *   Remove mock data.
    *   Add API integration.

4.  **Verification**:
    *   Verify API response time (tuning `limit` if necessary).
    *   Verify Win Rate accuracy against manual checks from the logs.

## Technical Considerations
*   **Rate Limits**: Polymarket Data API rate limits are unknown but likely exist. We will limit our concurrency (e.g., batch of 5 or 10) if we hit issues, or just cap the "Smart Money" analysis to the top 20 leaderboard residents.
*   **Performance**: Aggregating 20 requests might take 1-2 seconds. Frontend must show a skeleton.
