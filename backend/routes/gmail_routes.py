from fastapi import APIRouter, Request
from services.gmail_service import fetch_emails


router = APIRouter()

@router.get("/emails")
async def get_emails(request: Request):
    session_creds = request.session.get("creds")

    if not session_creds:
        return {"error": "User not authenticated"}

    return fetch_emails(session_creds)