from fastapi import APIRouter
from pydantic import BaseModel
import sqlite3
import time

router = APIRouter()

DB = "pryoport.db"


# ---------- CREATE TABLES ----------
def init_db():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS sender_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        priority TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subject TEXT,
        summary TEXT,
        timestamp REAL
    )
    """)

    conn.commit()
    conn.close()


init_db()


# ---------- REQUEST MODEL ----------
class PriorityRule(BaseModel):
    email: str
    priority: str


# ---------- SET PRIORITY ----------
@router.post("/set-priority")
def set_priority(data: PriorityRule):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    INSERT OR REPLACE INTO sender_rules(email, priority)
    VALUES (?, ?)
    """, (data.email, data.priority))

    conn.commit()
    conn.close()

    return {"message": "saved"}


# ---------- GET NOTIFICATIONS ----------
@router.get("/notifications")
def get_notifications():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.execute("""
    SELECT subject, summary, timestamp
    FROM notifications
    ORDER BY id DESC
    LIMIT 10
    """)

    rows = cur.fetchall()
    conn.close()

    result = []

    for r in rows:
        result.append({
            "subject": r[0],
            "summary": r[1],
            "timestamp": r[2]
        })

    return result