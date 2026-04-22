fake_users_db = {}

@app.post("/signup")
async def signup(username: str, password: str):
    fake_users_db[username] = password
    return {"message": "User created"}

@app.post("/login")
async def login(username: str, password: str):
    if fake_users_db.get(username) != password:
        return {"error": "Invalid credentials"}
    return {"message": "Login successful"}