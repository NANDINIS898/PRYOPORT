import os
import re

from langchain_groq import ChatGroq

from agents.classification_agent import classify_email
from models.urgency_model import predict_urgency
from services.db_service import get_manual_priority


# ==========================================
# SUMMARY AGENT
# ==========================================
def generate_summary(email_text, category, score, llm):

    prompt = f"""
Create a short push notification for this email.

Email:
{email_text}

Category: {category}
Urgency Score: {score}

Rules:
- Keep it short
- Sound like a mobile notification
- Return ONLY one sentence
"""

    try:
        response = llm.invoke(prompt).content.strip()

        # cleanup markdown if model returns it
        response = response.replace("```", "")
        response = response.replace("json", "")

        return response

    except Exception as e:
        print("Summary Error:", e)
        return "New important email received."


# ==========================================
# MAIN ORCHESTRATOR PIPELINE
# ==========================================
def analyze_email_with_agents(subject, snippet, sender=None):

    # ======================================
    # LOAD LLM
    # ======================================
    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.2
    )

    # ======================================
    # EMAIL TEXT
    # ======================================
    email_text = f"""
Subject:
{subject}

Body:
{snippet}
"""

    # ======================================
    # CLEAN SENDER EMAIL
    # ======================================
    clean_sender = ""

    if sender:

        match = re.search(r"<(.+?)>", sender)

        if match:
            clean_sender = match.group(1).lower()
        else:
            clean_sender = sender.lower()

    # ======================================
    # STEP 1 → CLASSIFICATION AGENT
    # ======================================
    try:

        classification = classify_email(
            subject,
            snippet
        )

        category = classification.get(
            "category",
            "general"
        ).lower()

    except Exception as e:

        print("Classification Error:", e)

        category = "general"

    # ======================================
    # STEP 2 → URGENCY MODEL
    # ======================================
    try:

        urgency = predict_urgency(
            subject=subject,
            snippet=snippet,
            category=category,
            sender=clean_sender
        )

        score = urgency.get("score", 0)

    except Exception as e:

        print("Urgency Error:", e)

        score = 0

    # ======================================
    # STEP 3 → MANUAL PRIORITY OVERRIDE
    # ======================================
    try:

        if clean_sender:

            manual = get_manual_priority(
                clean_sender
            )

            if manual == "high":
                score = max(score, 95)

    except Exception as e:

        print("Manual Priority Error:", e)

    # ======================================
    # STEP 4 → CLAMP SCORE
    # ======================================
    score = max(0, min(100, int(score)))

        # ======================================
    # STEP 5 → PRIORITY LABEL
    # ======================================

    high_priority_terms = [
        "interview",
        "assessment",
        "online assessment",
        "oa",
        "coding round",
        "technical round",
        "hackerrank",
        "test link",
        "deadline",
        "last date",
        "tomorrow",
        "today",
        "scheduled",
        "shortlisted",
        "selected"
    ]

    combined_text = f"{subject} {snippet}".lower()

    # smart escalation for important job/test emails
    contains_high_signal = any(
        term in combined_text
        for term in high_priority_terms
    )

    if score >= 70 or (score >= 40 and contains_high_signal):
        priority = "high"

    elif score >= 35:
        priority = "medium"

    else:
        priority = "low"

    # ======================================
    # STEP 6 → SUMMARY AGENT
    # ======================================
    summary = None

    if priority in ["high", "medium"]:

        summary = generate_summary(
            email_text=email_text,
            category=category,
            score=score,
            llm=llm
        )

    # ======================================
    # DEBUG LOGS
    # ======================================
    print("\n🧠 FINAL EMAIL ANALYSIS")
    print("SUBJECT :", subject)
    print("CATEGORY:", category)
    print("SENDER  :", clean_sender)
    print("SCORE   :", score)
    print("PRIORITY:", priority)
    print("SUMMARY :", summary)

    # ======================================
    # FINAL RESPONSE
    # ======================================
    return {
        "category": category,
        "priority": priority,
        "score": score,
        "summary": summary
    }