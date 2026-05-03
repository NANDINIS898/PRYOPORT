from crewai import Agent
from llm import get_llm


def summarize_email(subject, snippet, category, urgency_score):
    client = get_llm()   # initialize Groq client

    tone = "urgent and action-oriented" if urgency_score >= 0.7 else "informative and calm"

    prompt = f"""
You are an assistant that generates short, smart notification messages for an email extension.

Rules:
- Maximum 1 line
- Crisp and useful
- Personalized
- No extra symbols
- No greeting
- Make user want to open important mails

Tone: {tone}

Email Details:
Subject: {subject}
Snippet: {snippet}
Category: {category}

Return only the notification text.
"""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",   # Groq fast model
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print("Summary Error:", e)
        return f"New {category} email received."