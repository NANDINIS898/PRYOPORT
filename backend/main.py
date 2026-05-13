# ==========================================================
# FILE: backend/main.py
# FULL CLEAN WORKING VERSION
# ==========================================================

import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from services.db_service import get_extension_auth
from services.sync_services import sync_emails

from routes import auth_routes, gmail_routes
from routes.rules_routes import router as rules_router
from routes.extension_routes import router as extension_router
from routes import interaction_routes
from routes.dashboard_routes import router as dashboard_router


from dbmodel import init_db
from starlette.middleware.base import BaseHTTPMiddleware

# Add this class ABOVE your app = FastAPI() line
class ChromeExtensionCORS(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        origin = request.headers.get("origin", "")
        response = await call_next(request)
        if origin.startswith("chrome-extension://"):
            response.headers["Access-Control-Allow-Origin"]      = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"]     = "*"
            response.headers["Access-Control-Allow-Headers"]     = "*"
        return response

app = FastAPI()
@app.on_event("startup")
def startup():
    init_db()

# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",       # React dashboard
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        os.getenv("FRONTEND_URL", ""),
    ],
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
# REAL LOGIN STATUS
# ==========================================================

# At the top, import your DB model (adjust import to match your project)
 # or however you query your user/creds table
   # ← add this import at top

@app.get("/auth-status")
def auth_status(request: Request):

    # 1️⃣ Web OAuth session (user logged in via browser)
    creds = request.session.get("creds")
    if creds:
        return {
            "logged_in": True,
            "email": request.session.get("user_email", ""),
            "source": "session"
        }

    # 2️⃣ Extension fallback — check if emails exist in DB
    ext = get_extension_auth()
    if ext["logged_in"]:
        return {
            "logged_in": True,
            "email": "Extension Connected",   # no user table to pull real email from
            "source": "extension"
        }

    return {"logged_in": False}


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
    
