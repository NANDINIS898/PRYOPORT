from fastapi import APIRouter
from services.db_service import connect
 
router = APIRouter()
 
 
@router.get("/notifications")
def get_notifications():
    conn = connect()
    cur  = conn.cursor()
 
    # Return all fields popup.js and background.js need:
    # priority    → for grouping into HIGH / MEDIUM sections
    # urgency_score → for the score chip and score bar
    # summary     → for the notification message text
    # timestamp   → for deduplication in background.js
    cur.execute("""
        SELECT subject, summary, priority, urgency_score, created_at as timestamp
        FROM emails
        WHERE priority IN ('high', 'medium')
        ORDER BY urgency_score DESC, created_at DESC
        LIMIT 30
    """)
 
    rows = cur.fetchall()
    conn.close()
 
    return {"notifications": [dict(row) for row in rows]}