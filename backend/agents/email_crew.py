# agents/email_crew.py

from crewai import Crew, Task
from llm import get_llm
from agents.classification_agent import get_classification_agent
from agents.urgency_agent import get_urgency_agent
from agents.summary_agent import get_summary_agent


def analyze_email_with_agents(subject, snippet):

    llm = get_llm()

    classifier = get_classification_agent(llm)
    urgency = get_urgency_agent(llm)
    summarizer = get_summary_agent(llm)

    email_text = f"Subject: {subject}\nBody: {snippet}"

    classify_task = Task(
        description=f"""
        Classify into: internship, deadline, task, spam, general
        Email: {email_text}
        Return only one word.
        """,
        agent=classifier
    )

    urgency_task = Task(
        description=f"""
        Decide urgency: high, medium, low
        Email: {email_text}
        """,
        agent=urgency
    )

    summary_task = Task(
        description=f"""
        Give 1-line reminder
        Email: {email_text}
        """,
        agent=summarizer
    )

    crew = Crew(
        agents=[classifier, urgency, summarizer],
        tasks=[classify_task, urgency_task, summary_task],
        verbose=False
    )

    result = crew.kickoff()

    # basic parsing
    output = str(result).split("\n")

    return {
        "category": output[0] if len(output) > 0 else "general",
        "priority": output[1] if len(output) > 1 else "low",
        "summary": output[2] if len(output) > 2 else snippet[:50]
    }