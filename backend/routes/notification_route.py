from fastapi import APIRouter
from services.background_worker import LATEST_NOTIFICATIONS

router = APIRouter()

@router.get("/notifications")
def get_notifications():
    return LATEST_NOTIFICATIONS[-10:]  # last 10