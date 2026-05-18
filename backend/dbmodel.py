import sqlite3

from config import DB_PATH


def _add_column_if_missing(cur, table, col_def):
    """Run ALTER TABLE ... ADD COLUMN, ignoring 'duplicate column' errors."""
    try:
        cur.execute(f"ALTER TABLE {table} ADD COLUMN {col_def}")
    except sqlite3.OperationalError:
        pass


def _migrate_rules_to_composite_pk(cur):
    """
    Old `rules` table had PRIMARY KEY (sender), so two users could not store
    a rule for the same sender. Rebuild with composite PK (user_email, sender).
    Existing rows that have no user_email are dropped — they were leaking
    across accounts under the old schema anyway.
    """
    cur.execute("PRAGMA table_info(rules)")
    cols = cur.fetchall()
    if not cols:
        return  # table doesn't exist yet, the CREATE below will handle it

    # Detect old schema: sender is the sole PK and no user_email column
    has_user_email = any(c[1] == "user_email" for c in cols)
    user_email_is_pk = any(c[1] == "user_email" and c[5] >= 1 for c in cols)

    if has_user_email and user_email_is_pk:
        return  # already migrated

    cur.execute("""
        CREATE TABLE IF NOT EXISTS rules_new (
            user_email TEXT NOT NULL,
            sender TEXT NOT NULL,
            manual_priority TEXT,
            PRIMARY KEY (user_email, sender)
        )
    """)
    # Old rows have no owner — drop them rather than guess
    cur.execute("DROP TABLE rules")
    cur.execute("ALTER TABLE rules_new RENAME TO rules")


def _migrate_sender_reputation_to_composite_pk(cur):
    cur.execute("PRAGMA table_info(sender_reputation)")
    cols = cur.fetchall()
    if not cols:
        return

    has_user_email = any(c[1] == "user_email" for c in cols)
    user_email_is_pk = any(c[1] == "user_email" and c[5] >= 1 for c in cols)

    if has_user_email and user_email_is_pk:
        return

    cur.execute("""
        CREATE TABLE IF NOT EXISTS sender_reputation_new (
            user_email TEXT NOT NULL,
            sender TEXT NOT NULL,
            score INTEGER DEFAULT 50,
            PRIMARY KEY (user_email, sender)
        )
    """)
    cur.execute("DROP TABLE sender_reputation")
    cur.execute("ALTER TABLE sender_reputation_new RENAME TO sender_reputation")


def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # =========================================
    # EMAIL STORAGE
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS emails (
        gmail_id TEXT PRIMARY KEY,
        user_email TEXT,
        subject TEXT,
        sender TEXT,
        snippet TEXT,
        category TEXT,
        priority TEXT,
        urgency_score INTEGER,
        summary TEXT,
        notified INTEGER DEFAULT 0,
        is_read INTEGER DEFAULT 0,
        read_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # =========================================
    # MANUAL RULES (USER PRIORITY) — composite PK
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS rules (
        user_email TEXT NOT NULL,
        sender TEXT NOT NULL,
        manual_priority TEXT,
        PRIMARY KEY (user_email, sender)
    )
    """)

    # =========================================
    # NOTIFICATIONS
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        subject TEXT,
        summary TEXT,
        timestamp REAL
    )
    """)

    # =========================================
    # SENDER REPUTATION — composite PK
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS sender_reputation (
        user_email TEXT NOT NULL,
        sender TEXT NOT NULL,
        score INTEGER DEFAULT 50,
        PRIMARY KEY (user_email, sender)
    )
    """)

    # =========================================
    # USER INTERACTIONS (LEARNING)
    # =========================================
    cur.execute("""
    CREATE TABLE IF NOT EXISTS user_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT,
        gmail_id TEXT,
        action TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── safe migrations for older deployments ──
    _add_column_if_missing(cur, "emails", "user_email TEXT")
    _add_column_if_missing(cur, "emails", "is_read INTEGER DEFAULT 0")
    _add_column_if_missing(cur, "emails", "read_at TIMESTAMP")
    _add_column_if_missing(cur, "notifications", "user_email TEXT")
    _add_column_if_missing(cur, "user_actions", "user_email TEXT")

    _migrate_rules_to_composite_pk(cur)
    _migrate_sender_reputation_to_composite_pk(cur)

    # Index for the hot dashboard query
    cur.execute("""
        CREATE INDEX IF NOT EXISTS idx_emails_user_priority
        ON emails (user_email, priority, is_read)
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("DB initialized successfully")
