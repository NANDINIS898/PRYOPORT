from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

from utils.oauth_helper import get_flow

router = APIRouter()


def _fetch_user_email(creds_dict):
    """Use Gmail getProfile to learn which account just logged in."""
    try:
        creds = Credentials(**creds_dict)
        service = build("gmail", "v1", credentials=creds)
        profile = service.users().getProfile(userId="me").execute()
        return profile.get("emailAddress")
    except Exception as e:
        print("Could not fetch user profile:", e)
        return None


@router.get("/auth/google")
async def google_login(request: Request):
    # Clear any previous session so a fresh login can't inherit old state
    request.session.clear()

    flow = get_flow()
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent'
    )
    request.session["code_verifier"] = flow.code_verifier
    return RedirectResponse(auth_url)


@router.get("/oauth2callback")
async def oauth_callback(request: Request):
    print("CALLBACK HIT")

    flow = get_flow()
    flow.code_verifier = request.session.get("code_verifier")
    flow.fetch_token(authorization_response=str(request.url))

    creds = flow.credentials

    if not creds.refresh_token:
        return {
            "error": "No refresh_token received. Please logout and login again."
        }

    creds_dict = {
        "token": creds.token,
        "refresh_token": creds.refresh_token,
        "token_uri": creds.token_uri,
        "client_id": creds.client_id,
        "client_secret": creds.client_secret,
        "scopes": creds.scopes,
    }

    user_email = _fetch_user_email(creds_dict)
    if not user_email:
        return {"error": "Could not determine user email from Google. Please retry login."}

    request.session["creds"] = creds_dict
    request.session["user_email"] = user_email

    print("LOGGED IN:", user_email)
    return {"message": "Logged in with Google", "email": user_email}


@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out successfully"}
