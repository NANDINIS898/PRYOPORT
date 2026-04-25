
from crewai import Agent
from llm import get_llm


def get_classification_agent(get_llm):
    return Agent(
        role="Email Classification Expert",
        goal="Classify emails into meaningful categories",
        backstory=(
            "You are an expert at understanding email intent and categorizing them "
            "into internship, deadline, task, spam, or general."
        ),
        verbose=True,
        llm=get_llm
    )