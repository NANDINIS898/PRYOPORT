import sqlite3

DB = "pryoport.db"


def connect():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn


def email_exists(gmail_id):
    conn = connect()
    cur = conn.cursor()

    cur.execute(
        "SELECT id FROM emails WHERE gmail_id=?",
        (gmail_id,)
    )

    row = cur.fetchone()
    conn.close()

    return row is not None


def save_email(data):
    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT OR IGNORE INTO emails
    (gmail_id,sender,subject,snippet,priority,urgency_score,summary)
    VALUES (?,?,?,?,?,?,?)
    """, (
        data["gmail_id"],
        data["sender"],
        data["subject"],
        data["snippet"],
        data["priority"],
        data["urgency_score"],
        data["summary"]
    ))

    conn.commit()
    conn.close()


def get_manual_priority(sender):
    conn = connect()
    cur = conn.cursor()

    cur.execute(
        "SELECT manual_priority FROM rules WHERE sender=?",
        (sender,)
    )

    row = cur.fetchone()
    conn.close()

    if row:
        return row["manual_priority"]

    return None