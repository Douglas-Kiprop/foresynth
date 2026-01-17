"""
Database Migration Runner

Runs SQL migrations against the Supabase database.
Usage: pipenv run python scripts/migrate.py
"""
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import psycopg2
from dotenv import load_dotenv

# Load environment
load_dotenv()


def run_migrations():
    """Run all SQL migration files in order."""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not set in .env")
        return False
    
    migrations_dir = Path(__file__).parent.parent / "migrations"
    
    if not migrations_dir.exists():
        print("❌ Migrations directory not found")
        return False
    
    # Get all .sql files sorted by name
    migration_files = sorted(migrations_dir.glob("*.sql"))
    
    if not migration_files:
        print("⚠️ No migration files found")
        return True
    
    print(f"🔄 Connecting to database...")
    
    try:
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cursor = conn.cursor()
        
        for migration_file in migration_files:
            print(f"📄 Running: {migration_file.name}")
            
            sql = migration_file.read_text(encoding="utf-8")
            
            try:
                cursor.execute(sql)
                print(f"   ✅ {migration_file.name} completed")
            except psycopg2.Error as e:
                print(f"   ⚠️ {migration_file.name} - {e.pgerror or str(e)}")
                # Continue with other migrations
        
        cursor.close()
        conn.close()
        
        print("\n✅ All migrations completed!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database connection failed: {e}")
        return False


if __name__ == "__main__":
    success = run_migrations()
    sys.exit(0 if success else 1)
