import joblib
import json
import sqlite3
import os

from config import DB_PATH

BASE_DIR   = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "urgency.pkl")
model      = joblib.load(MODEL_PATH)

# =========================================
# CATEGORY BASE SCORES
# =========================================
CATEGORY_SCORE = {
    "interview":  85,
    "task":       75,
    "job":        65,
    "internship": 60,
    "hackathon":  55,
    "exam":       70,
    "general":    30,
    "promotion":  15,
    "spam":        5,
}

# =========================================
# KEYWORD URGENCY BOOST
# =========================================
URGENT_KEYWORDS = [
    "today", "tonight", "tomorrow", "urgent", "asap",
    "deadline", "immediately", "confirm", "last chance",
    "offer", "shortlisted", "selected", "regret",
    "scheduled", "reminder", "action required"
]


# =========================================
# SENDER REPUTATION FROM DB
# =========================================
def get_sender_score(sender):
    try:
        conn = sqlite3.connect(DB_PATH)   # ✅ was DB (undefined)
        cur  = conn.cursor()
        cur.execute("SELECT score FROM sender_reputation WHERE sender=?", (sender,))
        row = cur.fetchone()
        conn.close()
        return row[0] if row else 50
    except:
        return 50


# =========================================
# MAIN SCORING FUNCTION
# =========================================
def predict_urgency(subject, snippet, category, sender):

    text = (subject + " " + snippet).lower()

    # ── 1. BASE SCORE from category ──────────────────
    base = CATEGORY_SCORE.get(category, 30)

    # ── 2. ML SIGNAL (model predicts "0" or "1") ─────
    try:
        pred     = model.predict([text])[0]           # returns "0" or "1"
        ml_boost = 20 if str(pred) == "1" else 0      # ✅ fixed: was matching "high"/"medium"/"low"
    except:
        ml_boost = 0

    # ── 3. KEYWORD BOOST ─────────────────────────────
    keyword_boost = 0
    for kw in URGENT_KEYWORDS:
        if kw in text:
            keyword_boost += 8
            if keyword_boost >= 24:   # cap at 3 keywords
                break

    # ── 4. SENDER SIGNAL ─────────────────────────────
    sender_boost = 0
    if sender:
        s = sender.lower()
        if "noreply" in s or "no-reply" in s:
            sender_boost -= 15        # bulk/automated senders
        if "linkedin" in s:
            sender_boost += 5
        if "ibm.com" in s or "google.com" in s or "microsoft.com" in s:
            sender_boost += 10        # reputable known senders

        # DB reputation score (0-100, 50 = neutral)
        rep    = get_sender_score(s)
        sender_boost += int((rep - 50) * 0.2)   # ±10 max from reputation

    # ── 5. COMBINE ────────────────────────────────────
    score = base + ml_boost + keyword_boost + sender_boost
    score = max(0, min(100, int(score)))

    print(f"   [urgency] base={base} ml={ml_boost} kw={keyword_boost} sender={sender_boost} → {score}")

    return {
        "ml_score": ml_boost,
        "score":    score
    }