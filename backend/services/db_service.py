import sqlite3
from config import DB_PATH
conn = sqlite3.connect(DB_PATH)



def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# =========================================
# SAVE EMAIL
# =========================================
def save_email(data):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT OR IGNORE INTO emails
    (gmail_id, subject, sender, snippet, category, priority, urgency_score, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["gmail_id"],
        data["subject"],
        data["sender"],
        data["snippet"],
        data.get("category"),
        data["priority"],
        data["urgency_score"],
        data["summary"]
    ))

    conn.commit()
    conn.close()


def save_notification(data):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO notifications (subject, summary, timestamp)
    VALUES (?, ?, ?)
    """, (
        data["subject"],
        data["summary"],
        data["timestamp"]
    ))

    conn.commit()
    conn.close()



# =========================================
# CHECK DUPLICATE
# =========================================
def email_exists(gmail_id):
    conn = connect()
    cur = conn.cursor()

    cur.execute("SELECT 1 FROM emails WHERE gmail_id=?", (gmail_id,))
    exists = cur.fetchone() is not None

    conn.close()
    return exists


# =========================================
# SAVE RULE
# =========================================
def save_rule(sender, priority):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT OR REPLACE INTO rules (sender, manual_priority)
    VALUES (?, ?)
    """, (sender, priority))

    conn.commit()
    conn.close()


# =========================================
# GET RULE
# =========================================
def get_manual_priority(sender):
    conn = connect()
    cur = conn.cursor()

    cur.execute("SELECT manual_priority FROM rules WHERE sender=?", (sender,))
    row = cur.fetchone()

    conn.close()
    return row["manual_priority"] if row else None

def update_sender_score(sender, delta):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO sender_reputation (sender, score)
        VALUES (?, 50)
        ON CONFLICT(sender) DO NOTHING
    """, (sender,))

    cur.execute("""
        UPDATE sender_reputation
        SET score = MAX(0, MIN(100, score + ?))
        WHERE sender = ?
    """, (delta, sender))

    conn.commit()
    conn.close()

def mark_old_as_ignored():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # emails not interacted within time window
    cur.execute("""
        SELECT gmail_id, sender FROM emails
        WHERE gmail_id NOT IN (
            SELECT gmail_id FROM user_actions
        )
    """)

    rows = cur.fetchall()

    for gmail_id, sender in rows:
        log_user_action(gmail_id, "ignored")
        update_sender_score(sender, -1)

    conn.commit()
    conn.close()

def log_user_action(gmail_id, action):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO user_actions (gmail_id, action)
        VALUES (?, ?)
    """, (gmail_id, action))

    conn.commit()
    conn.close()


# =========================================
# GET NEW NOTIFICATIONS ONLY
# =========================================
def get_new_notifications(limit=20):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
        SELECT gmail_id, subject, summary, priority, created_at
        FROM emails
        WHERE priority IN ('high', 'medium')
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))

    rows = cur.fetchall()
    conn.close()

    return [dict(row) for row in rows]
