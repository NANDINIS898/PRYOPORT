# agents/summary_agent.py

from crewai import Agent
from llm import get_llm

def get_summary_agent(get_llm):
    return Agent(
        role="Personal Email Assistant",
        goal="Generate short personalized reminders for emails",
        backstory=(
            "You create short, clear, human-friendly reminders so users know what action to take."
        ),
        verbose=True,
        llm=get_llm
    )