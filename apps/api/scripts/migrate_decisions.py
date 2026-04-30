import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")

try:
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE public.agent_decisions ADD COLUMN IF NOT EXISTS is_actionable BOOLEAN DEFAULT FALSE;")
    print("Migration successful! Column 'is_actionable' added to 'agent_decisions'.")
    
    # Also dump the watchlists so we can examine the wiping issue
    cursor.execute("SELECT id, name, market_ids FROM public.watchlists;")
    print("Current Watchlists:")
    for row in cursor.fetchall():
        print(row)
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
