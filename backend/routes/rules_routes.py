from fastapi import APIRouter
from services.db_service import connect

router = APIRouter()

@router.post("/set-priority")
def set_priority(data: dict):

    sender = data["sender"]
    priority = data["priority"]

    conn = connect()
    cur = conn.cursor()

    cur.execute("""
    INSERT OR REPLACE INTO rules(sender, manual_priority)
    VALUES (?,?)
    """, (sender, priority))

    conn.commit()
    conn.close()

    return {"message": "Saved"}