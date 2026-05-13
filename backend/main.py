# ==========================================================
# FILE: backend/main.py
# CLEAN WORKING VERSION FOR RENDER + VERCEL + EXTENSION
# ==========================================================

import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from services.db_service import get_extension_auth
from services.sync_services import sync_emails

from routes import auth_routes, gmail_routes
from routes.rules_routes import router as rules_router
from routes.extension_routes import router as extension_router
from routes import interaction_routes
from routes.dashboard_routes import router as dashboard_router
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import Response

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
# CHROME EXTENSION CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://pryoport-frontend.vercel.app",
    ],

    # IMPORTANT
    allow_origin_regex=r"chrome-extension://.*",

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# WEBSITE CORS
# ==========================================================


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
# AUTH STATUS
# ==========================================================

@app.get("/auth-status")
def auth_status(request: Request):

    # Web login session
    creds = request.session.get("creds")

    if creds:
        return {
            "logged_in": True,
            "email": request.session.get("user_email", ""),
            "source": "session"
        }

    # Extension fallback
    ext = get_extension_auth()

    if ext.get("logged_in"):
        return {
            "logged_in": True,
            "email": "Extension Connected",
            "source": "extension"
        }

    return {
        "logged_in": False
    }


# ==========================================================
# MANUAL SYNC
# ==========================================================

@app.post("/sync")
def sync_now(request: Request):

    creds = request.session.get("creds")

    if not creds:
        return {
            "success": False,
            "message": "Please login first"
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