import json
from crewai import Agent
from llm import get_llm


def classify_email(subject, snippet):
    client = get_llm()   # this should return Groq client

    prompt = f"""
Classify the email into ONE category only:

- job
- internship
- hackathon
- spam
- social
- promotion
- other

Email:
Subject: {subject}
Snippet: {snippet}

Return ONLY valid JSON like:
{{
    "category": "job"
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",   # Groq model
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0
        )

        content = response.choices[0].message.content.strip()

        return json.loads(content)

    except Exception as e:
        print("Error:", e)
        return {"category": "other"}