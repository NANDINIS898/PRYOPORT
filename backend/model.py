import sqlite3

DB = "pryoport.db"

def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    # Emails processed
    cur.execute("""
    CREATE TABLE IF NOT EXISTS emails (
        id TEXT PRIMARY KEY,
        subject TEXT,
        sender TEXT,
        snippet TEXT,
        category TEXT,
        priority TEXT,
        summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Manual sender rules
    cur.execute("""
    CREATE TABLE IF NOT EXISTS rules (
        sender TEXT PRIMARY KEY,
        manual_priority TEXT
    )
    """)

    # Notifications
    cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        summary TEXT,
        timestamp REAL
    )
    """)

    conn.commit()
    conn.close()