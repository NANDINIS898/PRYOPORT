from fastapi import APIRouter, Request, Body
from services.db_service import connect
from utils.session_helper import current_user_email

router = APIRouter(prefix="/api")


# ══════════════════════════════════════════
# GET dashboard data (priority emails + rules) for the signed-in user
# ══════════════════════════════════════════
@router.get("/dashboard")
def get_dashboard_data(request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur  = conn.cursor()

    cur.execute("""
        SELECT gmail_id, subject, sender, snippet, category,
               priority, urgency_score, summary, is_read,
               created_at
        FROM emails
        WHERE user_email = ?
          AND priority IN ('high', 'medium')
        ORDER BY urgency_score DESC, created_at DESC
        LIMIT 50
    """, (user_email,))
    emails = [dict(row) for row in cur.fetchall()]

    cur.execute(
        "SELECT sender, manual_priority FROM rules WHERE user_email = ? ORDER BY sender",
        (user_email,)
    )
    rules = [dict(row) for row in cur.fetchall()]

    conn.close()
    return {"emails": emails, "rules": rules}


# ══════════════════════════════════════════
# GET single email — scoped to the requesting user
# ══════════════════════════════════════════
@router.get("/emails/{gmail_id}")
def get_email(gmail_id: str, request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur  = conn.cursor()
    cur.execute(
        "SELECT * FROM emails WHERE gmail_id=? AND user_email=?",
        (gmail_id, user_email)
    )
    row = cur.fetchone()
    conn.close()
    if not row:
        return {"error": "Not found"}
    return dict(row)


# ══════════════════════════════════════════
# PATCH — mark email as read
# ══════════════════════════════════════════
@router.patch("/emails/{gmail_id}/read")
def mark_read(gmail_id: str, request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE emails SET is_read = 1, read_at = CURRENT_TIMESTAMP
        WHERE gmail_id = ? AND user_email = ?
    """, (gmail_id, user_email))
    conn.commit()
    conn.close()
    return {"success": True}


# ══════════════════════════════════════════
# PATCH — update email priority
# ══════════════════════════════════════════
@router.patch("/emails/{gmail_id}/priority")
def update_priority(gmail_id: str, request: Request, data: dict = Body(...)):
    user_email = current_user_email(request)

    priority = data.get("priority")
    if priority not in ("high", "medium", "low"):
        return {"error": "Invalid priority"}

    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        UPDATE emails SET priority = ?
        WHERE gmail_id = ? AND user_email = ?
    """, (priority, gmail_id, user_email))
    conn.commit()
    conn.close()
    return {"success": True}


# ══════════════════════════════════════════
# DELETE — remove email
# ══════════════════════════════════════════
@router.delete("/emails/{gmail_id}")
def delete_email(gmail_id: str, request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur = conn.cursor()

    cur.execute(
        "SELECT subject FROM emails WHERE gmail_id = ? AND user_email = ?",
        (gmail_id, user_email)
    )
    row = cur.fetchone()

    if row:
        subject = row["subject"]
        cur.execute(
            "DELETE FROM notifications WHERE subject = ? AND user_email = ?",
            (subject, user_email)
        )

    cur.execute(
        "DELETE FROM emails WHERE gmail_id = ? AND user_email = ?",
        (gmail_id, user_email)
    )

    conn.commit()
    conn.close()
    return {"success": True}


# ══════════════════════════════════════════
# GET all rules for the signed-in user
# ══════════════════════════════════════════
@router.get("/rules")
def get_rules(request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur  = conn.cursor()
    cur.execute(
        "SELECT sender, manual_priority FROM rules WHERE user_email = ? ORDER BY sender",
        (user_email,)
    )
    rules = [dict(row) for row in cur.fetchall()]
    conn.close()
    return {"rules": rules}


# ══════════════════════════════════════════
# DELETE a rule
# ══════════════════════════════════════════
@router.delete("/rules/{sender}")
def delete_rule(sender: str, request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur  = conn.cursor()
    cur.execute(
        "DELETE FROM rules WHERE sender = ? AND user_email = ?",
        (sender, user_email)
    )
    conn.commit()
    conn.close()
    return {"success": True}
