# agents/urgency_agent.py

from crewai import Agent

def get_urgency_agent(llm):
    return Agent(
        role="Urgency Detection Specialist",
        goal="Determine how urgent an email is",
        backstory=(
            "You analyze emails and decide if they are high, medium, or low priority "
            "based on deadlines, tone, and required action."
        ),
        verbose=True,
        llm=llm
    )