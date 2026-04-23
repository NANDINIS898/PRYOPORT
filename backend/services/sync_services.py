# services/sync_service.py

from services.gmail_service import fetch_emails
from agents.email_crew import analyze_email_with_agents

def sync_emails(session_creds):
    emails = fetch_emails(session_creds)

    processed = []

    for email in emails:
        ai = analyze_email_with_agents(
            email["subject"],
            email["snippet"]
        )

        processed.append({
            "id": email["id"],
            "subject": email["subject"],
            "from": email["from"],
            "snippet": email["snippet"],
            "category": ai["category"],
            "priority": ai["priority"],
            "summary": ai["summary"]
        })

    return processed