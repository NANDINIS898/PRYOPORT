# agents/email_crew.py

from crewai import Crew, Task
from langchain_groq import ChatGroq
import os
import json
from dotenv import load_dotenv

from agents.classification_agent import get_classification_agent
from agents.summary_agent import get_summary_agent
from agents.urgency_agent import detect_urgency   # <-- ML wrapper function

load_dotenv()

THRESHOLD = 70

# temporary memory store
manual_priority_store = {}


# =====================================================
# LLM GATEKEEPER
# =====================================================
def semantic_filter(email_text, llm):
    prompt = f"""
    Decide whether this email is IMPORTANT.

    Important examples:
    - internship
    - interview
    - deadline
    - placement
    - task
    - urgent request
    - shortlisted
    - offer letter

    Return ONLY valid JSON:

    {{
      "important": true,
      "confidence": 82
    }}

    Email:
    {email_text}
    """

    try:
        response = llm.invoke(prompt).content.strip()
        return json.loads(response)
    except:
        return {
            "important": False,
            "confidence": 0
        }


# =====================================================
# MAIN PIPELINE
# =====================================================
def analyze_email_with_agents(subject, snippet, sender=None):

    llm = ChatGroq(
        groq_api_key=os.getenv("GROQ_API_KEY"),
        model="llama3-70b-8192",
        temperature=0.2
    )

    email_text = f"""
    Subject: {subject}

    Body:
    {snippet}
    """

    # ==========================================
    # STEP 1: GATEKEEPER
    # ==========================================
    gate = semantic_filter(email_text, llm)

    if not gate["important"] or gate["confidence"] < 50:
        return {
            "category": "ignored",
            "priority": "low",
            "score": 0,
            "summary": None
        }

    # ==========================================
    # STEP 2: MANUAL PRIORITY OVERRIDE
    # ==========================================
    force_high = False

    if sender and sender in manual_priority_store:
        if manual_priority_store[sender] == "high":
            force_high = True

    # ==========================================
    # STEP 3: CLASSIFICATION AGENT (CrewAI)
    # ==========================================
    classifier = get_classification_agent(llm)

    classify_task = Task(
        description=f"""
        Classify this email into ONLY one category:

        job
        internship
        interview
        hackathon
        exam
        task
        promotion
        spam
        general

        Email:
        {email_text}

        Return ONLY one word.
        """,
        agent=classifier,
        expected_output="single category word"
    )

    crew = Crew(
        agents=[classifier],
        tasks=[classify_task],
        verbose=False
    )

    classify_result = crew.kickoff()
    category = str(classify_result).strip().lower()

    # ==========================================
    # STEP 4: URGENCY MODEL (NO CrewAI)
    # ==========================================
    urgency_result = detect_urgency(
        category=category,
        subject=subject,
        snippet=snippet
    )

    score = urgency_result["score"]
    priority = urgency_result["priority"]

    # ==========================================
    # STEP 5: PRIORITY ENGINE
    # ==========================================
    if force_high:
        priority = "high"
        score = max(score, 95)

    # ==========================================
    # STEP 6: SUMMARY AGENT ONLY IF HIGH
    # ==========================================
    summary = None

    if priority == "high":

        summarizer = get_summary_agent(llm)

        summary_task = Task(
            description=f"""
            Convert this email into one short personalized notification.

            Examples:
            - You have an interview tomorrow at 10 AM.
            - Internship application closes tonight.
            - Assignment deadline is today.

            Email:
            {email_text}

            Category: {category}
            Score: {score}

            Return ONLY one sentence.
            """,
            agent=summarizer,
            expected_output="one line summary"
        )

        summary_crew = Crew(
            agents=[summarizer],
            tasks=[summary_task],
            verbose=False
        )

        summary_result = summary_crew.kickoff()
        summary = str(summary_result).strip()

    # ==========================================
    # FINAL RESPONSE
    # ==========================================
    return {
        "category": category,
        "priority": priority,
        "score": score,
        "summary": summary
    }