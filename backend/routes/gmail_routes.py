from fastapi import APIRouter, Request
from services.gmail_service import fetch_emails
from utils.session_helper import current_user_email

router = APIRouter()


@router.get("/emails")
async def get_emails(request: Request):
    # Gate on a real authenticated session, not just creds presence
    current_user_email(request)
    session_creds = request.session.get("creds")
    return fetch_emails(session_creds)
