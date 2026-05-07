# ==========================================================
# FILE: backend/main.py
# FULL CLEAN WORKING VERSION
# ==========================================================

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



from dbmodel import init_db


app = FastAPI()
@app.on_event("startup")
def startup():
    init_db()

# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# SESSION
# ==========================================================

app.add_middleware(
    SessionMiddleware,
    secret_key="supersecretkey"
)


# ==========================================================
# ROUTERS
# ==========================================================

app.include_router(auth_routes.router)
app.include_router(gmail_routes.router)
app.include_router(rules_router)
app.include_router(extension_router)
app.include_router(interaction_routes.router)

# ==========================================================
# REAL LOGIN STATUS
# ==========================================================

@app.get("/auth-status")
def auth_status(request: Request):

    creds = request.session.get("creds")

    if creds:
        return {
            "logged_in": True,
            "email": request.session.get("user_email", "")
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
    
