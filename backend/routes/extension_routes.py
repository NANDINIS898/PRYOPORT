from fastapi import APIRouter
from services.db_service import connect

router = APIRouter()


@router.get("/notifications")
def get_notifications():
    conn = connect()
    cur  = conn.cursor()
    cur.execute("""
        SELECT gmail_id, subject, summary, priority,
               urgency_score, category, sender, created_at as timestamp
        FROM emails
        WHERE priority IN ('high', 'medium')
          AND (is_read = 0 OR is_read IS NULL)
        ORDER BY urgency_score DESC, created_at DESC
        LIMIT 30
    """)
    rows = cur.fetchall()
    conn.close()
    return {"notifications": [dict(row) for row in rows]}