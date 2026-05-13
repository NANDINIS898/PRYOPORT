import os
from google_auth_oauthlib.flow import Flow

BASE_DIR = os.path.dirname(__file__)

CLIENT_SECRETS_FILE = os.path.join(
    BASE_DIR,
    "credentials.json"
)

SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly"
]

def get_flow():
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri="https://pryoport-backend.onrender.com/oauth2callback"
    )