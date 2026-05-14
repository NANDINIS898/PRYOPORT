

import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from services.sync_services import sync_emails

from routes import auth_routes, gmail_routes
from routes.rules_routes import router as rules_router
from routes.extension_routes import router as extension_router
from routes import interaction_routes
from routes.dashboard_routes import router as dashboard_router

from dbmodel import init_db


# ==========================================================
# APP
# ==========================================================

app = FastAPI()


# ==========================================================
# STARTUP
# ==========================================================

@app.on_event("startup")
def startup():
    init_db()


# ==========================================================
# CORS — allows Vercel dashboard + Chrome extension
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://pryoport-frontend.vercel.app",
    ],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# SESSION
# ==========================================================

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "supersecretkey"),
    same_site="none",
    https_only=True
)


# ==========================================================
# ROUTERS
# ==========================================================

app.include_router(auth_routes.router)
app.include_router(gmail_routes.router)
app.include_router(rules_router)
app.include_router(extension_router)
app.include_router(interaction_routes.router)
app.include_router(dashboard_router)


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/")
def root():
    return {"message": "PrYoPort Backend Running"}


# ==========================================================
# AUTH STATUS — session only, no DB fallback
# Every user must login with their own Google account
# ==========================================================

@app.get("/auth-status")
def auth_status(request: Request):
    creds = request.session.get("creds")

    if creds:
        return {
            "logged_in": True,
            "email": request.session.get("user_email", "")
        }

    return {"logged_in": False}


# ==========================================================
# MANUAL SYNC — requires user to be logged in via OAuth
# ==========================================================

@app.post("/sync")
def sync_now(request: Request):
    creds = request.session.get("creds")

    if not creds:
        return {
            "success": False,
            "message": "Not logged in. Please click Login in the extension first."
        }

    try:
        processed = sync_emails(creds)
        return {
            "success": True,
            "message": "Inbox synced",
            "emails": processed
        }

    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }