import sqlite3

from config import DB_PATH
conn = sqlite3.connect(DB_PATH)
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # =========================================
    # EMAIL STORAGE
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS emails (
        gmail_id TEXT PRIMARY KEY,
        subject TEXT,
        sender TEXT,
        snippet TEXT,
        category TEXT,
        priority TEXT,
        urgency_score INTEGER,
        summary TEXT,
        notified INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # =========================================
    # MANUAL RULES (USER PRIORITY)
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS rules (
        sender TEXT PRIMARY KEY,
        manual_priority TEXT
    )
    """)

    cur.execute("""CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject TEXT,
    summary TEXT,
    timestamp REAL
)""")
    # =========================================
    # 🔥 NEW: SENDER REPUTATION
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sender_reputation (
        sender TEXT PRIMARY KEY,
        score INTEGER DEFAULT 50
    )
    """)

    # =========================================
    # 🔥 NEW: USER INTERACTIONS (LEARNING)
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gmail_id TEXT,
        action TEXT,   -- clicked / ignored
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── safe migration: add new columns if they don't exist yet ──
    for col_sql in [
        "ALTER TABLE emails ADD COLUMN is_read INTEGER DEFAULT 0",
        "ALTER TABLE emails ADD COLUMN read_at TIMESTAMP",
    ]:
        try:
            cur.execute(col_sql)
        except sqlite3.OperationalError:
            pass   # column already exists — fine
 

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("✅ DB initialized successfully")