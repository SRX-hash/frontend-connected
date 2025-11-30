"""
Database Initialization Script
This script initializes the database schema and applies migrations.
Run this script to set up the database for the first time or after schema changes.
"""

import os
import sys
from flask import Flask
from flask_migrate import upgrade

# Import the app and models
from api_server import app, db
from models import User, Fabric

def init_database():
    """Initialize the database with schema and apply migrations."""
    print("=" * 60)
    print("Database Initialization")
    print("=" * 60)
    
    with app.app_context():
        # Ensure instance directory exists
        instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
        if not os.path.exists(instance_dir):
            os.makedirs(instance_dir)
            print(f"[OK] Created instance directory: {instance_dir}")
        
        # Get database URI
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        print(f"[INFO] Database URI: {db_uri}")
        
        # Create all tables (this will create them if they don't exist)
        print("\n[STEP 1] Creating database tables...")
        try:
            db.create_all()
            print("[OK] Database tables created/verified.")
        except Exception as e:
            print(f"[ERROR] Failed to create tables: {e}")
            return False
        
        # Apply migrations
        print("\n[STEP 2] Applying database migrations...")
        try:
            upgrade()
            print("[OK] Migrations applied successfully.")
        except Exception as e:
            # If migrations fail, it might be because they're already applied
            # or the alembic_version table doesn't exist yet
            if "alembic_version" in str(e).lower() or "no such table" in str(e).lower():
                print("[INFO] Migration table not found. Creating initial migration state...")
                # Create alembic_version table manually if needed
                try:
                    from sqlalchemy import text
                    db.session.execute(text("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL, CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num))"))
                    db.session.commit()
                    print("[OK] Created alembic_version table.")
                    # Try upgrade again
                    upgrade()
                    print("[OK] Migrations applied successfully.")
                except Exception as e2:
                    print(f"[WARNING] Could not apply migrations: {e2}")
                    print("[INFO] Continuing anyway - tables may already be up to date.")
            else:
                print(f"[WARNING] Migration error: {e}")
                print("[INFO] Continuing anyway - tables may already be up to date.")
        
        # Verify tables exist
        print("\n[STEP 3] Verifying database schema...")
        try:
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"[OK] Found {len(tables)} table(s): {', '.join(tables)}")
            
            # Check for required tables
            required_tables = ['user', 'fabric']
            missing_tables = [t for t in required_tables if t not in tables]
            if missing_tables:
                print(f"[ERROR] Missing required tables: {', '.join(missing_tables)}")
                return False
            else:
                print("[OK] All required tables exist.")
        except Exception as e:
            print(f"[ERROR] Failed to verify schema: {e}")
            return False
        
        print("\n" + "=" * 60)
        print("Database initialization completed successfully!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Create admin user: flask --app api_server create-admin")
        print("2. Or set ADMIN_EMAIL and ADMIN_PASSWORD in .env and run:")
        print("   flask --app api_server create-admin")
        print("=" * 60)
        return True

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)

