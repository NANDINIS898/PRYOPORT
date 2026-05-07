from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request


def fetch_emails(session_creds):

    try:
        creds = Credentials(**session_creds)

        # 🔁 Refresh token if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())

        service = build("gmail", "v1", credentials=creds)

        # =====================================================
        # 🔥 FETCH LATEST EMAILS (IMPORTANT FIX)
        # =====================================================
        results = service.users().messages().list(
            userId="me",
            maxResults=10,
            q="newer_than:1d"   # 👈 only recent emails
        ).execute()

        messages = results.get("messages", [])

        if not messages:
            print("⚠️ No emails found from Gmail API")
            return {"emails": []}

        # 🔄 Reverse to prioritize newest emails first
        messages = list(reversed(messages))

        emails = []

        # =====================================================
        # 📩 PROCESS EACH EMAIL
        # =====================================================
        for msg in messages:

            try:
                msg_data = service.users().messages().get(
                    userId="me",
                    id=msg["id"]
                ).execute()

                payload = msg_data.get("payload", {})
                headers = payload.get("headers", [])

                # -----------------------------
                # Extract Subject
                # -----------------------------
                subject = next(
                    (h["value"] for h in headers if h["name"] == "Subject"),
                    "No Subject"
                )

                # -----------------------------
                # Extract Sender
                # -----------------------------
                sender = next(
                    (h["value"] for h in headers if h["name"] == "From"),
                    "Unknown Sender"
                )

                # -----------------------------
                # Extract Snippet
                # -----------------------------
                snippet = msg_data.get("snippet", "")

                # =====================================================
                # 🧠 DEBUG LOGS (VERY IMPORTANT FOR YOU)
                # =====================================================
                print("\n📩 EMAIL FETCHED -------------------")
                print("FROM   :", sender)
                print("SUBJECT:", subject)
                print("SNIPPET:", snippet[:100])
                print("-----------------------------------")

                emails.append({
                    "id": msg["id"],
                    "subject": subject,
                    "from": sender,
                    "snippet": snippet
                })

            except Exception as e:
                print("❌ Error processing email:", str(e))
                continue

        print(f"\n✅ Total emails fetched: {len(emails)}\n")

        return {"emails": emails}

    except Exception as e:
        print("❌ Gmail Fetch Error:", str(e))
        return {"emails": []}