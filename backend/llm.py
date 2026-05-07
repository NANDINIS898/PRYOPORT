# services/llm.py

import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv

load_dotenv()

def get_llm():
    return ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.3
    )