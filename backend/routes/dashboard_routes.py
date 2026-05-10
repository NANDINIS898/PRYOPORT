from fastapi import APIRouter, Request, Body
from services.db_service import connect
from config import DB_PATH
import sqlite3

router = APIRouter(prefix="/api")


# ══════════════════════════════════════════
# GET all priority emails for dashboard
# ══════════════════════════════════════════
@router.get("/dashboard")
def get_dashboard_data():
    conn = connect()
    cur  = conn.cursor()

    cur.execute("""
        SELECT gmail_id, subject, sender, snippet, category,
               priority, urgency_score, summary, is_read,
               created_at
        FROM emails
        WHERE priority IN ('high', 'medium')
        ORDER BY urgency_score DESC, created_at DESC
        LIMIT 50
    """)
    emails = [dict(row) for row in cur.fetchall()]

    cur.execute("SELECT sender, manual_priority FROM rules ORDER BY sender")
    rules = [dict(row) for row in cur.fetchall()]

    conn.close()
    return {"emails": emails, "rules": rules}


# ══════════════════════════════════════════
# GET single email detail
# ══════════════════════════════════════════
@router.get("/emails/{gmail_id}")
def get_email(gmail_id: str):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("SELECT * FROM emails WHERE gmail_id=?", (gmail_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return {"error": "Not found"}
    return dict(row)


# ══════════════════════════════════════════
# PATCH — mark email as read
# (stops it appearing in notifications)
# ══════════════════════════════════════════
@router.patch("/emails/{gmail_id}/read")
def mark_read(gmail_id: str):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE emails SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE gmail_id = ?
    """, (gmail_id,))
    conn.commit()
    conn.close()
    return {"success": True}


# ══════════════════════════════════════════
# PATCH — update email priority
# ══════════════════════════════════════════
@router.patch("/emails/{gmail_id}/priority")
def update_priority(gmail_id: str, data: dict = Body(...)):
    priority = data.get("priority")
    if priority not in ("high", "medium", "low"):
        return {"error": "Invalid priority"}

    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE emails SET priority = ? WHERE gmail_id = ?
    """, (priority, gmail_id))
    conn.commit()
    conn.close()
    return {"success": True}


# ══════════════════════════════════════════
# DELETE — remove email from DB
# ══════════════════════════════════════════
@router.delete("/emails/{gmail_id}")
def delete_email(gmail_id: str):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("DELETE FROM emails WHERE gmail_id = ?", (gmail_id,))
    cur.execute("DELETE FROM notifications WHERE subject IN (SELECT subject FROM emails WHERE gmail_id = ?)", (gmail_id,))
    conn.commit()
    conn.close()
    return {"success": True}


# ══════════════════════════════════════════
# GET all rules
# ══════════════════════════════════════════
@router.get("/rules")
def get_rules():
    conn = connect()
    cur  = conn.cursor()
    cur.execute("SELECT sender, manual_priority FROM rules ORDER BY sender")
    rules = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"rules": rules}


# ══════════════════════════════════════════
# DELETE a rule
# ══════════════════════════════════════════
@router.delete("/rules/{sender}")
def delete_rule(sender: str):
    conn = connect()
    cur  = conn.cursor()
    cur.execute("DELETE FROM rules WHERE sender = ?", (sender,))
    conn.commit()
    conn.close()
    return {"success": True}