import joblib
import json
import sqlite3
import os

from config import DB_PATH

# =========================================
# PATHS
# =========================================
BASE_DIR = os.path.dirname(__file__)

MODEL_PATH = os.path.join(BASE_DIR, "urgency.pkl")
WEIGHTS_PATH = os.path.join(BASE_DIR, "category_weights.json")

# =========================================
# LOAD MODEL
# =========================================
model = joblib.load(MODEL_PATH)

# =========================================
# LOAD CATEGORY WEIGHTS
# =========================================
with open(WEIGHTS_PATH, "r") as f:
    CATEGORY_SCORE = json.load(f)

# =========================================
# URGENT KEYWORDS
# =========================================
URGENT_KEYWORDS = [
    "today",
    "tonight",
    "tomorrow",
    "urgent",
    "asap",
    "deadline",
    "immediately",
    "confirm",
    "last chance",
    "offer",
    "shortlisted",
    "selected",
    "scheduled",
    "reminder",
    "action required",
    "interview",
    "assessment"
]

# =========================================
# SPAM / FAKE LEAD SIGNALS
# =========================================
SPAM_SIGNALS = [
    "earn money",
    "work from home",
    "limited seats",
    "click here",
    "registration fee",
    "guaranteed placement",
    "100% job",
    "whatsapp group",
    "urgent hiring",
    "easy income",
    "pay now",
    "exclusive offer",
    "act fast",
    "free certificate",
    "crypto",
    "investment opportunity"
]

# =========================================
# SENDER REPUTATION FROM DB
# =========================================
def get_sender_score(sender):
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()

        cur.execute(
            "SELECT score FROM sender_reputation WHERE sender=?",
            (sender,)
        )

        row = cur.fetchone()

        conn.close()

        return row[0] if row else 50

    except Exception as e:
        print("Sender reputation error:", e)
        return 50


# =========================================
# MAIN SCORING FUNCTION
# =========================================
def predict_urgency(subject, snippet, category, sender):

    # -------------------------------------
    # COMBINE EMAIL TEXT
    # -------------------------------------
    text = f"{subject} {snippet}".lower()

    # -------------------------------------
    # 1. CATEGORY BASE SCORE
    # -------------------------------------
    base = CATEGORY_SCORE.get(category.lower(), 0)

    # -------------------------------------
    # 2. ML PROBABILITY BOOST
    # -------------------------------------
    try:
        proba = model.predict_proba([text])[0]

        # assuming class "1" = urgent/high
        high_prob = proba[1]

        ml_boost = int(high_prob * 35)

    except Exception as e:
        print("ML prediction error:", e)
        ml_boost = 0

    # -------------------------------------
    # 3. URGENCY KEYWORD BOOST
    # -------------------------------------
    keyword_boost = 0

    for kw in URGENT_KEYWORDS:
        if kw in text:
            keyword_boost += 6

            # cap keyword effect
            if keyword_boost >= 24:
                break

    # -------------------------------------
    # 4. SPAM PENALTY
    # -------------------------------------
    spam_penalty = 0

    for spam_word in SPAM_SIGNALS:
        if spam_word in text:
            spam_penalty -= 20

    # limit maximum spam deduction
    spam_penalty = max(spam_penalty, -60)

    # -------------------------------------
    # 5. SENDER SIGNALS
    # -------------------------------------
    sender_boost = 0

    if sender:

        s = sender.lower()

        # suspicious bulk senders
        if "noreply" in s or "no-reply" in s:
            sender_boost -= 15

        # trusted domains
        trusted_domains = [
            "google.com",
            "microsoft.com",
            "amazon.com",
            "linkedin.com",
            "ibm.com",
            "unstop.com"
        ]

        for domain in trusted_domains:
            if domain in s:
                sender_boost += 10
                break

        # sender reputation from DB
        rep = get_sender_score(s)

        sender_boost += int((rep - 50) * 0.2)

    # -------------------------------------
    # FINAL SCORE
    # -------------------------------------
    score = (
        base
        + ml_boost
        + keyword_boost
        + sender_boost
        + spam_penalty
    )

    score = max(0, min(100, int(score)))

    # -------------------------------------
    # PRIORITY LABEL
    # -------------------------------------
    if score >= 70:
        priority = "high"

    elif score >= 40:
        priority = "medium"

    else:
        priority = "low"

    # -------------------------------------
    # DEBUG LOG
    # -------------------------------------
    print(
        f"""
[URGENCY ENGINE]
category={category}
base={base}
ml={ml_boost}
keywords={keyword_boost}
sender={sender_boost}
spam={spam_penalty}
FINAL={score}
priority={priority}
"""
    )

    return {
        "priority": priority,
        "score": score,
        "ml_score": ml_boost,
        "spam_penalty": spam_penalty
    }