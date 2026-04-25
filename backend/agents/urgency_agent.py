from crewai import Agent
from llm import get_lmm

def get_urgency_agent(get_llm):
    return Agent(
        role="Urgency Detection Specialist",
        goal=(
            "Analyze emails and assign urgency level AND urgency score (0-100)"
        ),
        backstory=(
            "You are an expert at detecting urgency using deadlines, tone, "
            "time sensitivity, and required actions."
        ),
        verbose=True,
        llm=get_llm
    )