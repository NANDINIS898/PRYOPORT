from fastapi import HTTPException, Request


def current_user_email(request: Request) -> str:
    """
    Return the email of the user attached to this request's session,
    or raise 401 if the session has no authenticated user.

    Every route that reads or writes per-user data MUST go through this
    helper — never trust a client-supplied email.
    """
    email = request.session.get("user_email")
    creds = request.session.get("creds")
    if not email or not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return email
