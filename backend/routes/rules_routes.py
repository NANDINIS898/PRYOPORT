from fastapi import APIRouter
from services.db_service import save_rule

router = APIRouter()

@router.post("/set-priority")
def set_priority(data: dict):

    sender = data.get("email")   # ✅ FIXED
    priority = data.get("priority")

    if not sender or not priority:
        return {"error": "Missing data"}

    save_rule(sender, priority)

    return {"message": "Saved successfully"}