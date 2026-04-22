user_token = None

def store_user_token(user_id, creds):
    global user_token
    user_token = creds

def get_user_token():
    return user_token