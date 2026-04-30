import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

response = supabase.table("watchlists").select("id, name, market_ids").execute()
print("DUMP WATCHLISTS:")
for row in response.data:
    print(f"ID={row['id']} NAME={row['name']} M_IDS={row.get('market_ids')}")

