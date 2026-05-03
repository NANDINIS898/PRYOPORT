from fastapi import APIRouter
from database import get_db

router = APIRouter()

@router.get("/dashboard")
def dashboard():

    conn = get_db()
    cur = conn.cursor()

    cur.execute("SELECT * FROM emails ORDER BY created_at DESC LIMIT 20")
    emails = [dict(x) for x in cur.fetchall()]

    cur.execute("SELECT * FROM notifications WHERE shown=0")
    notifications = [dict(x) for x in cur.fetchall()]

    return {
        "emails": emails,
        "notifications": notifications
    }