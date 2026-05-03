from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

def fetch_emails(session_creds):

    creds = Credentials(**session_creds)

    if creds.expired and creds.refresh_token:
        creds.refresh(Request())

    service = build("gmail", "v1", credentials=creds)

    results = service.users().messages().list(
        userId="me",
        maxResults=5
    ).execute()

    messages = results.get("messages", [])

    emails = []

    for msg in messages:

        msg_data = service.users().messages().get(
            userId="me",
            id=msg["id"]
        ).execute()

        headers = msg_data["payload"]["headers"]

        subject = next(
            (h["value"] for h in headers if h["name"] == "Subject"),
            ""
        )

        sender = next(
            (h["value"] for h in headers if h["name"] == "From"),
            ""
        )

        snippet = msg_data.get("snippet", "")

        emails.append({
            "id": msg["id"],
            "subject": subject,
            "from": sender,
            "snippet": snippet
        })

    return {"emails": emails}