from services.gmail_service import fetch_emails
from models.urgency_model import predict_urgency

from services.db_service import (
    email_exists,
    save_email,
    get_manual_priority
)
from email_crew import analyze_email_with_agents


def sync_emails(session_creds):

    processed = []

    emails = fetch_emails(session_creds)["emails"]

    for email in emails:

        gmail_id = email["id"]

        if email_exists(gmail_id):
            continue

        sender = email["from"]
        subject = email["subject"]
        snippet = email["snippet"]

        score = predict_urgency(subject, snippet)

        manual = get_manual_priority(sender)

        if manual == "high":
            score += 25

        if score > 100:
            score = 100

        if score >= 70:
            priority = "high"
        elif score >= 40:
            priority = "medium"
        else:
            priority = "low"

        summary = ""

        if priority != "low":
            ai = analyze_email_with_agents(
                subject,
                snippet,
                sender
            )

            summary = ai.get("summary", "")

        save_email({
            "gmail_id": gmail_id,
            "sender": sender,
            "subject": subject,
            "snippet": snippet,
            "priority": priority,
            "urgency_score": score,
            "summary": summary
        })

        processed.append({
            "subject": subject,
            "priority": priority,
            "summary": summary
        })

    return processed