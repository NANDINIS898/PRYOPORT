from fastapi import APIRouter
from services.db_service import connect

router = APIRouter()

@router.get("/notifications")
def notifications():

    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    SELECT * FROM emails
    WHERE priority='high'
    ORDER BY id DESC
    LIMIT 5
    """)

    rows = cur.fetchall()
    conn.close()

    return [dict(x) for x in rows]