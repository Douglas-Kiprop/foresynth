import asyncio
import sys
import os

# Add src to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.services.notifications import get_notification_service, NotificationPayload
from src.core import get_supabase

async def simulate_trade_alert(target_email: str = None):
    """Simulate a whale trade signal for a user."""
    db = get_supabase()
    notifications = get_notification_service()
    
    # 1. Find the target user
    if target_email:
        response = db.table("users").select("id, email").eq("email", target_email).execute()
    else:
        # Fallback to most recent user
        response = db.table("users").select("id, email").order("created_at", desc=True).limit(1).execute()
        
    if not response.data:
        print(f"❌ No user found for: {target_email or 'any'}")
        return
    
    user = response.data[0]
    print(f"📡 Simulating trade for User: {user['email']} ({user['id']})")
    
    # 2. Prepare payload
    payload = NotificationPayload(
        user_id=user['id'],
        title="🐋 TEST: WHALE MOVEMENT DETECTED",
        message="👤 <b>Target</b>: <code>0xTest...1234</code>\n🎯 <b>Action</b>: BUY $50,000.00\n📊 <b>Market</b>: Fed Interest Rate (Feb 2026)\n📂 <b>Squad</b>: Alpha Test",
        type="wallet_alert",
        channels=["in-app", "telegram"],
        metadata={
            "wallet": "0xTestWalletAddress",
            "trade": {"size": 50000, "side": "BUY", "market": "Fed Interest Rate"}
        }
    )
    
    # 3. Dispatch
    print("🚀 Dispatching notification...")
    results = await notifications.send(payload)
    
    for channel, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"  - {channel.upper()}: {status}")
        if channel == "telegram" and not success:
            print("    (Tip: Ensure you linked the bot in the /account page)")

if __name__ == "__main__":
    email = sys.argv[1] if len(sys.argv) > 1 else "808dawgg@gmail.com"
    asyncio.run(simulate_trade_alert(email))
