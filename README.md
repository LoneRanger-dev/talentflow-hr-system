# 🚀 TalentFlow - Autonomous HR Recruitment System

**Enterprise AI SaaS Engine powered by LangChain, FastAPI & Next.js**

TalentFlow is an autonomous AI agent system designed to automate candidate resume screening, hiring decision-making, scoring, and candidate communication. It reduces manual screening time from **40+ hours per hire down to minutes (93%+ automation)** while improving candidate match quality.

---

## 🏗️ Architecture & Features

```
talentflow_hr_system/
├── backend/                      # Python 3.12+ FastAPI REST API Server & AI Agents
│   ├── main.py                   # FastAPI routing endpoints
│   ├── config.py                 # Settings & Gemini/OpenAI/Ollama provider config
│   ├── agents/                   # Modular LangChain Autonomous Agents
│   │   ├── resume_agent.py       # ResumeIntelligenceAgent (Structured JSON resume extraction)
│   │   ├── decision_agent.py     # DecisionEngineAgent (0-10 scoring, ADVANCE/MAYBE/REJECT)
│   │   └── communication_agent.py# CommunicationAgent (Personalized candidate email generation)
│   └── data/                     # Job description & sample markdown resumes
├── frontend/                     # Modern Next.js 14 (App Router) + Tailwind CSS Dashboard UI
│   ├── src/app/                  # Layouts and Pages
│   ├── src/components/           # Glassmorphism UI Components
│   └── src/services/             # API client with fallback data engine
└── .env                          # Configuration & Gemini API key setup
```

### Key Highlights
- **Dual LLM Provider Strategy**: Google Gemini API (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), or local free Ollama (`llama3.2`) with heuristic fallback engines.
- **Resume Intelligence Agent**: Parses unstructured markdown, text, or PDF candidate resumes into structured skill/experience JSON profiles.
- **Decision Engine Agent**: Evaluates candidates against job requirements across 4 categories:
  - Technical Skills Match (0-3 pts)
  - Experience Level & Relevance (0-3 pts)
  - Education & Qualifications (0-2 pts)
  - Overall Fit & Potential (0-2 pts)
  - Applies configurable threshold logic: **ADVANCE** (&ge; 7.0), **MAYBE** (&ge; 5.0), **REJECT** (< 5.0).
- **Communication Agent**: Automatically drafts personalized interview invitations, phone screening inquiries, or encouraging rejection notices.
- **Executive SaaS UI**: Interactive dark-mode dashboard with real-time ROI metrics ($2,800+ saved per hire), candidate drawers, threshold sliders, and email copy/send simulation.

---

## ⚡ Quick Start Guide

### 1. Environment Setup
Fill in your `GEMINI_API_KEY` in `.env`:
```bash
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Start the Backend API (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*The FastAPI backend will start at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.*

### 3. Start the Frontend Dashboard (Next.js)
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:3000` in your web browser to view the TalentFlow dashboard.*

---

## 📊 Business ROI Impact
- **Manual Screening Time**: ~6.0 mins per resume + 15.0 mins per decision = 21.0 mins/candidate
- **TalentFlow Processing**: < 2 seconds per candidate (99% time savings)
- **Cost Reduction**: $280+ savings per 10 candidates evaluated based on standard $80/hr HR rate.
