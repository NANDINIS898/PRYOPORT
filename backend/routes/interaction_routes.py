from fastapi import APIRouter, Request
from services.db_service import log_user_action, update_sender_score
from utils.session_helper import current_user_email

router = APIRouter()


@router.post("/track-action")
async def track_action(request: Request):
    user_email = current_user_email(request)
    data = await request.json()

    gmail_id = data.get("gmail_id")
    sender = data.get("sender")
    action = data.get("action")  # clicked / ignored

    if not gmail_id or not action:
        return {"error": "Missing data"}

    log_user_action(user_email, gmail_id, action)

    if sender:
        if action == "clicked":
            update_sender_score(user_email, sender, +5)
        elif action == "ignored":
            update_sender_score(user_email, sender, -2)

    return {"message": "Action recorded"}
