import json
from llm import get_llm


def classify_email(subject, snippet):
    llm = get_llm()

    prompt = f"""
Classify the email into ONE category only:

job, internship, interview, hackathon, exam, task, promotion, spam, general

Subject: {subject}
Snippet: {snippet}

Return ONLY JSON:
{{"category": "job"}}
"""

    try:
        response = llm.invoke(prompt)   # ✅ THIS IS THE FIX

        content = response.content.strip()

        return json.loads(content)

    except Exception as e:
        print("Classification Error:", e)
        return {"category": "general"}