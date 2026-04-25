def semantic_filter(email_text, llm):
    prompt = f"""
    Analyze this email and decide if it's IMPORTANT.

    Consider:
    - internships
    - interviews
    - deadlines
    - tasks

    Return JSON:
    {{
      "important": true/false,
      "confidence": 0-100
    }}

    Email:
    {email_text}
    """

    response = llm.invoke(prompt).content

    try:
        import json
        return json.loads(response)
    except:
        return {"important": False, "confidence": 0}