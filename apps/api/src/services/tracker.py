
import asyncio
import logging
import json
from datetime import datetime
from typing import List, Dict, Set, Any

from src.core import get_supabase, get_async_cache
from src.services.polymarket import get_polymarket_service
from src.services.notifications import get_notification_service, NotificationPayload

logger = logging.getLogger(__name__)

class TacticalTracker:
    """
    Background engine for real-time monitoring of Polymarket activity.
    Tracks wallet trades and market price movements.
    """
    def __init__(self):
        self.db = get_supabase()
        self.cache = get_async_cache()
        self.polymarket = get_polymarket_service()
        self.notifications = get_notification_service()
        self.is_running = False
        self.poll_interval = 30  # seconds
        self._last_heartbeat = 0

    async def start(self):
        """Start the background tracking loop."""
        if self.is_running:
            return
        self.is_running = True
        print("📡 TACTICAL ENGINE: Initializing background monitoring...")
        asyncio.create_task(self._loop())

    async def stop(self):
        """Stop the background tracking loop."""
        self.is_running = False
        print("🛑 TACTICAL ENGINE: Stopping background monitoring...")

    async def _loop(self):
        print("🚀 TACTICAL ENGINE: Background loop is now ACTIVE")
        while self.is_running:
            try:
                start_time = datetime.now()
                
                # Active scan log
                print(f"🔍 TACTICAL ENGINE: Starting monitoring cycle at {start_time.strftime('%H:%M:%S')}")
                
                # Heartbeat log every 5 minutes (approx 10 iterations)
                self._last_heartbeat += 1
                if self._last_heartbeat >= 10:
                    print("💓 TACTICAL ENGINE: Heartbeat - Engine is healthy and scanning.")
                    self._last_heartbeat = 0

                await self._monitor_wallets()
                await self._monitor_prices()
                
                # Dynamic sleep to maintain interval regardless of execution time
                elapsed = (datetime.now() - start_time).total_seconds()
                sleep_time = max(1, self.poll_interval - elapsed)
                await asyncio.sleep(sleep_time)
            except Exception as e:
                print(f"❌ TACTICAL ENGINE: Global loop error: {e}")
                await asyncio.sleep(10) # Wait before retry

    async def _monitor_wallets(self):
        """Scan all tracked wallets for new trade activity, respecting squad/target filters."""
        try:
            # 1. Get unique wallet addresses to track (only from active squads)
            response = self.db.table("tracked_targets") \
                .select("wallet_address, alert_config, squad:squads(id, user_id, name, is_active)") \
                .execute()
                
            if not response.data:
                print("ℹ️ TACTICAL ENGINE: No active wallets found in tracked_targets.")
                return
            
            # Map wallet -> list of alert configurations
            wallet_map: Dict[str, List[Dict]] = {}
            for item in response.data:
                squad = item.get("squad")
                if not squad or not squad.get("is_active"):
                    continue
                    
                wallet = item["wallet_address"]
                if wallet not in wallet_map:
                    wallet_map[wallet] = []
                
                wallet_map[wallet].append({
                    "user_id": squad["user_id"],
                    "squad_name": squad["name"],
                    "config": item["alert_config"]
                })
            
            # 2. Check each wallet for latest trades
            if wallet_map:
                print(f"📡 TACTICAL ENGINE: Scanning {len(wallet_map)} targets for trade activity...")
            
            for wallet, observers in wallet_map.items():
                trades = await self.polymarket.get_trades(wallet, limit=5)
                if not trades:
                    continue
                
                # Check most recent trade
                latest_trade = trades[0]
                trade_id = latest_trade.get("transactionHash") or latest_trade.get("id")
                if not trade_id:
                    continue
                
                # 3. Check if we've seen this trade before
                cache_key = f"tracker:last_trade:{wallet}"
                last_seen_id = await self.cache.get(cache_key)
                
                if last_seen_id == trade_id:
                    continue 
                
                # 4. New trade detected! Seed cache for next time
                await self.cache.set(cache_key, trade_id)
                
                if last_seen_id is None:
                    print(f"📝 TACTICAL ENGINE: Seeded initial state for wallet {wallet[:8]}")
                    continue # First run
                
                # 5. Process observers and filters
                print(f"🎯 TACTICAL ENGINE: NEW TRADE DETECTED from {wallet[:8]}")
                for obs in observers:
                    await self._process_wallet_trade(wallet, latest_trade, obs)
                
        except Exception as e:
            print(f"❌ TACTICAL ENGINE: Wallet monitor failed: {e}")

    async def _process_wallet_trade(self, wallet: str, trade: dict, observer: dict):
        """Apply filters and notify a specific user about a trade."""
        try:
            config = observer["config"] or {}
            min_size = config.get("min_trade_size", 0)
            only_buy = config.get("only_buy_orders", False)
            
            # Trade details
            size = float(trade.get("size", 0))
            side = trade.get("side", "").upper() # BUY, SELL
            
            # Apply Filters
            if size < min_size:
                return
            
            if only_buy and "BUY" not in side and "YES" not in side:
                return
            
            print(f"✨ TACTICAL ENGINE: Signal matches filters! Size: ${size:,.2f} | Side: {side}")
            
            # Prepare notification
            asset = trade.get("market", "Unknown Market")
            message = (
                f"👤 <b>Target</b>: <code>{wallet[:6]}...{wallet[-4:]}</code>\n"
                f"🎯 <b>Action</b>: {side} ${size:,.2f}\n"
                f"📊 <b>Market</b>: {asset}\n"
                f"📂 <b>Squad</b>: {observer['squad_name']}"
            )
            
            payload = NotificationPayload(
                user_id=observer["user_id"],
                title="🐋 SMART MONEY ACTIVITY",
                message=message,
                type="wallet_alert",
                channels=config.get("channels", ["in-app", "telegram"]),
                metadata={"wallet": wallet, "trade": trade}
            )
            await self.notifications.send(payload)
            
        except Exception as e:
            print(f"❌ TACTICAL ENGINE: Trade processing error: {e}")

    async def _monitor_prices(self):
        """Scan all watched markets for price movements or alert triggers."""
        try:
            # 1. Collect all market IDs from active price alerts
            alert_resp = self.db.table("price_alerts") \
                .select("id, user_id, market_id, condition, threshold, channels") \
                .eq("is_active", True) \
                .execute()
            
            if not alert_resp.data:
                return
            
            markets_to_track = {item["market_id"] for item in alert_resp.data}
            print(f"📈 TACTICAL ENGINE: Monitoring {len(markets_to_track)} price targets...")
            
            # 2. Get batch prices
            token_ids = list(markets_to_track)
            current_prices = await self.polymarket.get_batch_prices(token_ids)
            
            # 3. Process alerts
            for alert in alert_resp.data:
                market_id = alert["market_id"]
                current_price = current_prices.get(market_id)
                
                if current_price is None:
                    continue
                
                threshold = float(alert["threshold"])
                condition = alert["condition"] # 'above', 'below'
                
                triggered = False
                if condition == "above" and current_price >= threshold:
                    triggered = True
                elif condition == "below" and current_price <= threshold:
                    triggered = True
                
                if triggered:
                    print(f"🚨 TACTICAL ENGINE: PRICE TARGET HIT! Market: {market_id}")
                    await self._dispatch_price_alert(alert, current_price)

        except Exception as e:
            print(f"❌ TACTICAL ENGINE: Price monitor failed: {e}")

    async def _dispatch_price_alert(self, alert: dict, current_price: float):
        """Fire a specific price alert and deactivate it (or set cooldown)."""
        try:
            # Cooldown check in Redis to avoid spam
            cache_key = f"tracker:alert_cd:{alert['id']}"
            if await self.cache.get(cache_key):
                return
            
            # Set 1 hour cooldown for this specific alert
            await self.cache.setex(cache_key, 3600, "1")
            
            # Update last_triggered in DB
            self.db.table("price_alerts").update({
                "last_triggered_at": datetime.now().isoformat()
            }).eq("id", alert["id"]).execute()
            
            message = (
                f"📈 <b>Price Target Hit!</b>\n"
                f"📊 <b>Market</b>: {alert['market_id']}\n"
                f"🎯 <b>Target</b>: {alert['condition']} {alert['threshold']}%\n"
                f"🔔 <b>Current</b>: {current_price}%"
            )
            
            payload = NotificationPayload(
                user_id=alert["user_id"],
                title="🎯 PRICE ALERT TRIGGERED",
                message=message,
                type="price_alert",
                channels=alert.get("channels", ["in-app", "telegram"]),
                metadata={"market_id": alert["market_id"], "price": current_price}
            )
            await self.notifications.send(payload)
            
        except Exception as e:
            print(f"❌ TACTICAL ENGINE: Price alert dispatch error: {e}")

    async def _dispatch_price_movement(self, market_id: str, old_price: float, new_price: float):
        # Generic movements not tied to specific alerts can be handled here if needed
        pass

# Singleton instance
_tracker: TacticalTracker | None = None

def get_tracker() -> TacticalTracker:
    global _tracker
    if _tracker is None:
        _tracker = TacticalTracker()
    return _tracker
