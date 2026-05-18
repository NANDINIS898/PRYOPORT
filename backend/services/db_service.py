import sqlite3
from config import DB_PATH


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# =========================================
# SAVE EMAIL (per-user)
# =========================================
def save_email(user_email, data):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT OR IGNORE INTO emails
    (gmail_id, user_email, subject, sender, snippet, category,
     priority, urgency_score, summary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["gmail_id"],
        user_email,
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


def save_notification(user_email, data):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO notifications (user_email, subject, summary, timestamp)
    VALUES (?, ?, ?, ?)
    """, (
        user_email,
        data["subject"],
        data["summary"],
        data["timestamp"]
    ))

    conn.commit()
    conn.close()


# =========================================
# CHECK DUPLICATE (scoped to this user)
# =========================================
def email_exists(user_email, gmail_id):
    conn = connect()
    cur = conn.cursor()

    cur.execute(
        "SELECT 1 FROM emails WHERE gmail_id=? AND user_email=?",
        (gmail_id, user_email)
    )
    exists = cur.fetchone() is not None

    conn.close()
    return exists


# =========================================
# RULES (per-user)
# =========================================
def save_rule(user_email, sender, priority):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT INTO rules (user_email, sender, manual_priority)
    VALUES (?, ?, ?)
    ON CONFLICT(user_email, sender) DO UPDATE SET manual_priority = excluded.manual_priority
    """, (user_email, sender, priority))

    conn.commit()
    conn.close()


def get_manual_priority(user_email, sender):
    conn = connect()
    cur = conn.cursor()

    cur.execute(
        "SELECT manual_priority FROM rules WHERE user_email=? AND sender=?",
        (user_email, sender)
    )
    row = cur.fetchone()

    conn.close()
    return row["manual_priority"] if row else None


# =========================================
# SENDER REPUTATION (per-user)
# =========================================
def update_sender_score(user_email, sender, delta):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO sender_reputation (user_email, sender, score)
        VALUES (?, ?, 50)
        ON CONFLICT(user_email, sender) DO NOTHING
    """, (user_email, sender))

    cur.execute("""
        UPDATE sender_reputation
        SET score = MAX(0, MIN(100, score + ?))
        WHERE user_email = ? AND sender = ?
    """, (delta, user_email, sender))

    conn.commit()
    conn.close()


# =========================================
# IGNORE OLD EMAILS (per-user)
# =========================================
def mark_old_as_ignored(user_email):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
        SELECT gmail_id, sender FROM emails
        WHERE user_email = ?
          AND gmail_id NOT IN (
              SELECT gmail_id FROM user_actions WHERE user_email = ?
          )
    """, (user_email, user_email))

    rows = cur.fetchall()

    for gmail_id, sender in rows:
        cur.execute("""
            INSERT INTO user_actions (user_email, gmail_id, action)
            VALUES (?, ?, 'ignored')
        """, (user_email, gmail_id))

    conn.commit()
    conn.close()

    # update reputation in a separate pass (each call opens its own conn)
    for _, sender in rows:
        update_sender_score(user_email, sender, -1)


def log_user_action(user_email, gmail_id, action):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO user_actions (user_email, gmail_id, action)
        VALUES (?, ?, ?)
    """, (user_email, gmail_id, action))

    conn.commit()
    conn.close()


# =========================================
# GET NEW NOTIFICATIONS (per-user)
# =========================================
def get_new_notifications(user_email, limit=20):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
        SELECT gmail_id, subject, summary, priority, created_at
        FROM emails
        WHERE user_email = ?
          AND priority IN ('high', 'medium')
        ORDER BY created_at DESC
        LIMIT ?
    """, (user_email, limit))

    rows = cur.fetchall()
    conn.close()

    return [dict(row) for row in rows]
