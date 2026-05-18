from fastapi import APIRouter, Request
from services.db_service import save_rule
from utils.session_helper import current_user_email

router = APIRouter()


@router.post("/set-priority")
def set_priority(data: dict, request: Request):
    user_email = current_user_email(request)

    sender = data.get("email")
    priority = data.get("priority")

    if not sender or not priority:
        return {"error": "Missing data"}

    save_rule(user_email, sender, priority)
    return {"message": "Saved successfully"}
