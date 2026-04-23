# agents/email_crew.py

from crewai import Crew, Task
from langchain_groq import ChatGroq

from agents.classification_agent import get_classification_agent
from agents.urgency_agent import get_urgency_agent
from agents.summary_agent import get_summary_agent


def analyze_email_with_agents(subject, snippet):

    llm = ChatGroq(
        groq_api_key="YOUR_GROQ_API_KEY",
        model="llama3-70b-8192"
    )

    # Create agents
    classifier = get_classification_agent(llm)
    urgency = get_urgency_agent(llm)
    summarizer = get_summary_agent(llm)

    email_text = f"Subject: {subject}\nBody: {snippet}"

    # Tasks
    classify_task = Task(
        description=f"""
        Classify this email into one of:
        internship, deadline, task, spam, general

        Email:
        {email_text}

        Return only category.
        """,
        agent=classifier,
        expected_output="One word category"
    )

    urgency_task = Task(
        description=f"""
        Determine urgency of this email.

        Email:
        {email_text}

        Return: high, medium, or low
        """,
        agent=urgency,
        expected_output="high/medium/low"
    )

    summary_task = Task(
        description=f"""
        Write a short 1-line reminder for this email.

        Email:
        {email_text}
        """,
        agent=summarizer,
        expected_output="Short reminder sentence"
    )

    crew = Crew(
        agents=[classifier, urgency, summarizer],
        tasks=[classify_task, urgency_task, summary_task],
        verbose=True
    )

    results = crew.kickoff()

    # Simple parsing (CrewAI returns combined output)
    outputs = str(results).split("\n")

    return {
        "category": outputs[0] if len(outputs) > 0 else "general",
        "priority": outputs[1] if len(outputs) > 1 else "low",
        "summary": outputs[2] if len(outputs) > 2 else snippet[:50]
    }