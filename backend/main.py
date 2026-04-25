import os
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"


from fastapi import FastAPI
from routes import auth_routes, gmail_routes
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from services.background_worker import start_worker
from routes import notification_route




app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # later restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(gmail_routes.router)
app.add_middleware(SessionMiddleware, secret_key="supersecretkey")
app.include_router(notification_route.router)

@app.on_event("startup")
def startup_event():
    start_worker()

