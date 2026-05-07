from datetime import datetime
from services.db_service import (
    email_exists, save_email, save_notification, mark_old_as_ignored
)
from email_crew import analyze_email_with_agents
from services.gmail_service import fetch_emails


def sync_emails(session_creds):
    mark_old_as_ignored()   # ✅ now called properly
    processed = []

    emails = fetch_emails(session_creds)["emails"]

    for email in emails:
        gmail_id = email["id"]
        sender   = email["from"]       # ✅ assign BEFORE using
        subject  = email["subject"]
        snippet  = email["snippet"]

        if email_exists(gmail_id):
            print("⏭️ SKIPPED:", subject)   # ✅ subject is defined now
            continue

        print("🚀 ANALYZING:", subject)

        ai = analyze_email_with_agents(subject, snippet, sender)

        category = ai["category"]
        priority = ai["priority"]
        score    = ai["score"]
        summary  = ai["summary"]

        save_email({
            "gmail_id":     gmail_id,
            "sender":       sender,
            "subject":      subject,
            "snippet":      snippet,
            "category":     category,   # ✅ now included
            "priority":     priority,
            "urgency_score": score,
            "summary":      summary
        })

        if priority in ["high", "medium"]:
            print("🔥 SAVING NOTIFICATION:", subject)
            save_notification({
                "subject":   subject,
                "summary":   summary or subject,
                "timestamp": datetime.utcnow().timestamp()  # ✅ REAL number, not string
            })

        processed.append({
            "subject":  subject,
            "priority": priority,
            "summary":  summary
        })

    return processed