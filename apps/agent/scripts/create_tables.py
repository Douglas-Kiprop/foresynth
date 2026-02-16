"""
Create the agent_configs and agent_decisions tables in Supabase.
Uses the Supabase REST API with service role key.
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")  # service role key

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing SUPABASE_URL or SUPABASE_KEY in .env")
    sys.exit(1)

# Use the Supabase REST query endpoint to run SQL
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

SQL = """
CREATE TABLE IF NOT EXISTS agent_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    risk_profile TEXT NOT NULL DEFAULT 'moderate',
    focus_sectors JSONB DEFAULT '[]'::jsonb,
    sources JSONB DEFAULT '["watchlists", "news"]'::jsonb,
    alert_frequency TEXT DEFAULT 'medium',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS agent_decisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    market_question TEXT NOT NULL DEFAULT '',
    market_slug TEXT DEFAULT '',
    signal TEXT NOT NULL DEFAULT 'HOLD',
    confidence FLOAT NOT NULL DEFAULT 0.0,
    reasoning TEXT DEFAULT '',
    key_factors JSONB DEFAULT '[]'::jsonb,
    risk_level TEXT DEFAULT 'medium',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_decisions_user_created
    ON agent_decisions(user_id, created_at DESC);
"""

print("Creating tables via Supabase SQL...")
url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

# Try the rpc approach first, if that fails, try direct postgrest
try:
    resp = httpx.post(
        url,
        headers=HEADERS,
        json={"query": SQL},
        timeout=30.0,
    )
    if resp.status_code in [200, 201, 204]:
        print("SUCCESS: Tables created via RPC!")
    else:
        print(f"RPC approach returned status {resp.status_code}: {resp.text}")
        print("Trying alternative approach...")
        raise Exception("RPC failed")
except Exception as e:
    # Fallback: Use the management API or just print SQL for manual execution
    print(f"\nRPC not available ({e})")
    print("\n" + "=" * 60)
    print("Please run this SQL in your Supabase SQL Editor:")
    print(f"URL: {SUPABASE_URL.replace('.supabase.co', '.supabase.co').replace('https://', 'https://supabase.com/dashboard/project/').split('.')[0].replace('https://', '')}") 
    print("Go to: https://supabase.com/dashboard -> Your project -> SQL Editor")
    print("=" * 60)
    print(SQL)
    print("=" * 60)
