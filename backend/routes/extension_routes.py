from fastapi import APIRouter, Request
from services.db_service import connect
from utils.session_helper import current_user_email

router = APIRouter()


@router.get("/notifications")
def get_notifications(request: Request):
    user_email = current_user_email(request)

    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        SELECT gmail_id, subject, summary, priority,
               urgency_score, category, sender, created_at as timestamp
        FROM emails
        WHERE user_email = ?
          AND priority IN ('high', 'medium')
          AND (is_read = 0 OR is_read IS NULL)
        ORDER BY urgency_score DESC, created_at DESC
        LIMIT 30
    """, (user_email,))
    rows = cur.fetchall()
    conn.close()
    return {"notifications": [dict(row) for row in rows]}
