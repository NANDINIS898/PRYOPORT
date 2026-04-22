from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from utils.oauth_helper import get_flow
from services.auth_service import store_user_token

router = APIRouter()

@router.get("/auth/google")
async def google_login(request: Request):
    flow = get_flow()
    auth_url, _ = flow.authorization_url(
    access_type='offline',
    include_granted_scopes='true',
    prompt='select_account'
)
    # ✅ store verifier in session (safe across redirect)
    request.session["code_verifier"] = flow.code_verifier

    return RedirectResponse(auth_url)
@router.get("/oauth2callback")
async def oauth_callback(request: Request):
    print("🔥 CALLBACK HIT")

    # ✅ Prevent duplicate execution
    if request.session.get("creds"):
        return {"message": "Already logged in"}

    flow = get_flow()

    flow.code_verifier = request.session.get("code_verifier")

    flow.fetch_token(
        authorization_response=str(request.url)
    )

    creds = flow.credentials

    request.session["creds"] = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes
    }

    return {"message": "Logged in with Google"}

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()   # 🔥 clears everything (creds, verifier, etc)
    return {"message": "Logged out successfully"}