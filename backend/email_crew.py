from crewai import Crew, Task
from langchain_groq import ChatGroq
import os
import json
from dotenv import load_dotenv

from agents.classification_agent import get_classification_agent
from agents.urgency_agent import get_urgency_agent
from agents.summary_agent import get_summary_agent

load_dotenv()

THRESHOLD = 70

# Temporary in-memory store (replace with DB later)
manual_priority_store = {}


def semantic_filter(email_text, llm):
    prompt = f"""
    Decide if this email is IMPORTANT.

    Consider:
    - internships
    - interviews
    - deadlines
    - tasks

    Return JSON:
    {{
      "important": true/false,
      "confidence": number (0-100)
    }}

    Email:
    {email_text}
    """

    response = llm.invoke(prompt).content

    try:
        return json.loads(response)
    except:
        return {"important": False, "confidence": 0}


def analyze_email_with_agents(subject, snippet, sender=None):

    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model="llama3-70b-8192",
        temperature=0.3
    )

    email_text = f"Subject: {subject}\nBody: {snippet}"

    # 🧠 STEP 1: Semantic Filtering
    filter_result = semantic_filter(email_text, llm)

    if not filter_result["important"] or filter_result["confidence"] < 50:
        return {
            "category": "ignored",
            "priority": "low",
            "score": 0,
            "summary": None
        }

    # 🧠 STEP 2: Manual Override
    force_high = False
    if sender and sender in manual_priority_store:
        if manual_priority_store[sender] == "high":
            force_high = True

    # 🧠 STEP 3: Create Agents
    classifier = get_classification_agent(llm)
    urgency = get_urgency_agent(llm)

    # 🧠 STEP 4: Tasks (NO summary yet)
    classify_task = Task(
        description=f"""
        Classify this email into:
        internship, deadline, task, spam, general

        Email:
        {email_text}

        Return ONLY one word.
        """,
        agent=classifier,
        expected_output="category"
    )

    urgency_task = Task(
        description=f"""
        Analyze urgency of this email.

        Consider:
        - deadlines (today/tomorrow = very high)
        - interview timing
        - action required
        - urgency words

        Return JSON:
        {{
          "level": "high/medium/low",
          "score": number (0-100)
        }}

        Email:
        {email_text}
        """,
        agent=urgency,
        expected_output="JSON with level and score"
    )

    crew = Crew(
        agents=[classifier, urgency],
        tasks=[classify_task, urgency_task],
        verbose=False
    )

    results = crew.kickoff()
    outputs = str(results).split("\n")

    # 🧠 STEP 5: Parse outputs
    category = outputs[0].strip() if len(outputs) > 0 else "general"

    try:
        urgency_json = json.loads(outputs[1])
        score = urgency_json.get("score", 50)
        level = urgency_json.get("level", "medium")
    except:
        score = 50
        level = "medium"

    # 🧠 STEP 6: Decide Summary
    if score > THRESHOLD or force_high:

        summarizer = get_summary_agent(llm)

        summary_task = Task(
            description=f"""
            Convert this email into a short personalized notification.

            Example:
            "You have an interview tomorrow at 10 AM"

            Email:
            {email_text}
            """,
            agent=summarizer,
            expected_output="1 line notification"
        )

        summary_crew = Crew(
            agents=[summarizer],
            tasks=[summary_task],
            verbose=False
        )

        summary_result = summary_crew.kickoff()

        return {
            "category": category,
            "priority": "high",
            "score": score,
            "summary": str(summary_result).strip()
        }

    # 🧠 STEP 7: Non-urgent emails
    return {
        "category": category,
        "priority": "low",
        "score": score,
        "summary": None
    }