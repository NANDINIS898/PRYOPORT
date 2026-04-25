import time
from threading import Thread

from services.gmail_service import fetch_emails
from email_crew import analyze_email_with_agents

LATEST_NOTIFICATIONS = []
PROCESSED_EMAIL_IDS = set()


def background_email_worker():
    print("🚀 Background worker started...")

    while True:
        try:
            emails = fetch_emails()

            for email in emails:

                # ✅ skip already processed emails
                if email["id"] in PROCESSED_EMAIL_IDS:
                    continue

                PROCESSED_EMAIL_IDS.add(email["id"])

                result = analyze_email_with_agents(
                    subject=email["subject"],
                    snippet=email["snippet"],
                    sender=email.get("from")
                )

                if result["priority"] == "high":
                    notification = {
                        "subject": email["subject"],
                        "summary": result["summary"],
                        "timestamp": time.time()
                    }

                    LATEST_NOTIFICATIONS.append(notification)

            # ✅ reduced polling
            time.sleep(300)  # 5 minutes

        except Exception as e:
            print("Worker error:", e)
            time.sleep(60)


def start_worker():
    thread = Thread(target=background_email_worker, daemon=True)
    thread.start()