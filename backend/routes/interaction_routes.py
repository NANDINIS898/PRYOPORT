from fastapi import APIRouter, Request
from services.db_service import log_user_action, update_sender_score

router = APIRouter()

@router.post("/track-action")
async def track_action(request: Request):
    data = await request.json()

    gmail_id = data.get("gmail_id")
    sender = data.get("sender")
    action = data.get("action")  # clicked / ignored

    if not gmail_id or not action:
        return {"error": "Missing data"}

    # ✅ Log action
    log_user_action(gmail_id, action)

    # ✅ Update sender reputation
    if sender:
        if action == "clicked":
            update_sender_score(sender, +5)
        elif action == "ignored":
            update_sender_score(sender, -2)

    return {"message": "Action recorded"}