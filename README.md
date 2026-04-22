# 🚀 PRYOPORT

**PRYOPORT** is an AI-powered Priority Detection Engine that intelligently analyzes emails and external messages to detect urgency, classify importance, and summarize content using LLM-based semantic understanding.

It combines **Machine Learning agents + Gmail API integration + Google OAuth authentication + full-stack dashboard** to help users focus only on what matters.

---

## 🧠 Key Features

### 🔥 AI Priority Engine
- LLM-based semantic understanding of emails/messages
- Detects urgency and importance automatically
- Hybrid system: AI + user manual tagging support

### 🤖 Multi-Agent System
- **Urgency Detection Agent** → identifies time-sensitive emails
- **Classification Agent** → categorizes emails (Work, Personal, Spam, etc.)
- **Summarization Agent** → generates short AI summaries for notifications

### 📩 Gmail Integration
- Fetch emails using **Gmail API**
- Real-time email processing
- Token lifecycle handling (refresh & expiry management)

### 🔐 Authentication
- Google OAuth-based login system
- Secure token management
- User session handling

### 📊 Dashboard (ReactJS)
- Clean and interactive UI
- Displays:
  - Priority inbox
  - Email classification
  - AI-generated summaries
- User-controlled tagging system

### ⚙️ Backend (FastAPI)
- High-performance API layer
- Handles:
  - Email processing
  - AI agent orchestration
  - OAuth & token lifecycle
  - Gmail API communication

---

## 🏗️ Tech Stack

### Frontend
- ReactJS
- Axios
- Tailwind / CSS

### Backend
- FastAPI (Python)
- Pydantic
- Uvicorn

### AI / Agents
- LLM-based semantic models
- Custom agent pipeline:
  - Urgency Detection Agent
  - Classification Agent
  - Summarization Agent

### APIs & Services
- Google OAuth 2.0
- Gmail API
- Groq API

---

## 🔄 Workflow

1. User logs in via Google OAuth
2. Gmail API fetches emails securely
3. Backend processes emails via AI agents:
   - Urgency detection
   - Classification
   - Summarization
4. Results sent to React dashboard
5. User sees prioritized inbox

---

## 🎯 Goal of PRYOPORT

PryoPort is designed to ensure that users never miss important emails or tasks.
It intelligently analyzes incoming emails, understands their context using AI, and classifies them based on priority and urgency.
The system helps users focus only on what truly matters by filtering, organizing, and highlighting high-priority communications while reducing noise from less important messages.
- Understands context semantically (like a human)
- Filters noise automatically
- Helps users focus on high-priority actions only

---

## 🚀 Future Improvements

- Slack / Outlook integration
- Chrome extension for real-time alerts
- Fine-tuned LLM for domain-specific emails
- Smart notification system
- Calendar auto-scheduling from emails

---

## 👨‍💻 Author

Built with ❤️ by **Nandini Singh**

---

## 📌 Note

This project uses AI-driven prioritization and should be considered an assistive productivity tool, not a replacement for human decision-making.
