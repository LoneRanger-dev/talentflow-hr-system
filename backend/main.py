import os
import sys
import json
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from typing import Dict, List, Any, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.config import settings
from backend.utils.file_loader import (
    load_job_description, 
    save_job_description, 
    load_all_resumes,
    extract_text_from_file_bytes
)
from backend.agents.resume_agent import ResumeIntelligenceAgent
from backend.agents.decision_agent import DecisionEngineAgent
from backend.agents.communication_agent import CommunicationAgent

PRESET_JOB_DESCRIPTIONS = {
    "fullstack": {
        "title": "Senior Full Stack Engineer - AI & Web Applications",
        "category": "Full Stack / AI",
        "image_url": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
        "content": """# Senior Full Stack Engineer - AI & Web Applications

**Company:** TechFlow Solutions  
**Location:** Remote / Hybrid  
**Experience Required:** 3-5+ years  

## Key Responsibilities
- Architect scalable web applications using Python (FastAPI / Django) and TypeScript / React (Next.js).
- Implement intelligent agent workflows using LangChain, CrewAI, or LLM APIs (Gemini/OpenAI).
- Design high-performance REST APIs backed by PostgreSQL and Redis.

## Requirements
- 3+ years experience in Full Stack Web Development (Python, React/Next.js, TypeScript).
- Experience with Docker, Git workflows, AWS/GCP, and PostgreSQL.
- Strong interest in building AI agent workflows and vector search pipelines.
"""
    },
    "data_engineer": {
        "title": "Senior Data & AI Pipeline Engineer (Snowflake & ETL)",
        "category": "Data & AI Engineering",
        "image_url": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
        "content": """# Senior Data & AI Pipeline Engineer (Snowflake & ETL)

**Company:** TechFlow Analytics  
**Location:** Remote  
**Experience Required:** 3-5+ years  

## Key Responsibilities
- Build scalable data warehouse pipelines in Snowflake, PostgreSQL, and SQL Server.
- Construct Python ETL data processing flows using Pandas, NumPy, and PySpark.
- Deploy machine learning models and data pipelines into production REST microservices.

## Requirements
- 3+ years experience in Data Engineering, Data Analytics, or Snowflake Development.
- High proficiency in Snowflake Data Warehousing, SQL queries, Python, and ETL pipelines.
- Experience with database sharding, data governance, and automated reporting.
"""
    },
    "devops": {
        "title": "DevOps & Cloud Infrastructure Architect",
        "category": "DevOps / Cloud",
        "image_url": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
        "content": """# DevOps & Cloud Infrastructure Architect

**Company:** CloudFlow Systems  
**Location:** Remote  
**Experience Required:** 4-6+ years  

## Key Responsibilities
- Manage multi-cloud infrastructure on AWS / GCP using Terraform and Ansible.
- Build automated CI/CD deployment pipelines using Docker, Kubernetes (EKS/GKE), and GitHub Actions.
- Ensure high availability, security auditing, and monitoring with Prometheus & Grafana.

## Requirements
- 4+ years in DevOps, Cloud Engineering, or SRE roles.
- Expert knowledge of Kubernetes, Docker, Terraform, AWS, and Linux administration.
- Strong scripting capabilities in Python, Bash, or Go.
"""
    },
    "frontend": {
        "title": "Lead Frontend React / Next.js Specialist",
        "category": "Frontend UI/UX",
        "image_url": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
        "content": """# Lead Frontend React / Next.js Specialist

**Company:** TechFlow UI Labs  
**Location:** Remote / Hybrid  
**Experience Required:** 3+ years  

## Key Responsibilities
- Build modern, high-performance web user interfaces using React 18, Next.js, and TypeScript.
- Implement responsive glassmorphism UI/UX designs, dynamic micro-animations, and Tailwind CSS.
- Optimize Web Core Vitals, bundle sizes, and state management using Redux Toolkit or Zustand.

## Requirements
- 3+ years dedicated Frontend Engineering experience in React & TypeScript.
- Mastery of HTML5, CSS3, Tailwind CSS, WebSockets, and state management patterns.
- Experience consuming REST & GraphQL APIs with high performance.
"""
    }
}

app = FastAPI(
    title="TalentFlow Autonomous HR System API",
    description="Enterprise HR AI Recruitment SaaS Engine powered by LangChain & Google Gemini API",
    version="2.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AppState:
    llm = None
    llm_provider = "none"
    active_jd_title = "Senior Full Stack Engineer - AI & Web Applications"
    active_jd_image = "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80"
    resume_agent: ResumeIntelligenceAgent = None
    decision_agent: DecisionEngineAgent = None
    communication_agent: CommunicationAgent = None
    cached_candidates: Dict[str, Any] = {}
    cached_evaluations: List[Dict[str, Any]] = []

state = AppState()

def initialize_llm_provider(preferred_provider: str = "auto"):
    gemini_key = os.getenv("GEMINI_API_KEY", settings.GEMINI_API_KEY)
    openai_key = os.getenv("OPENAI_API_KEY", settings.OPENAI_API_KEY)

    if (preferred_provider in ["gemini", "auto"]) and gemini_key and gemini_key != "your_gemini_api_key_here":
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash",
                google_api_key=gemini_key,
                temperature=0.1
            )
            state.llm = llm
            state.llm_provider = "Google Gemini (gemini-1.5-flash)"
            print("✅ Initialized Google Gemini API Provider")
            return
        except Exception as e:
            print(f"⚠️ Gemini init fallback: {e}")

    if (preferred_provider in ["openai", "auto"]) and openai_key:
        try:
            from langchain_openai import ChatOpenAI
            llm = ChatOpenAI(
                model="gpt-4o-mini",
                api_key=openai_key,
                temperature=0.1
            )
            state.llm = llm
            state.llm_provider = "OpenAI GPT-4o-mini"
            print("✅ Initialized OpenAI Provider")
            return
        except Exception as e:
            print(f"⚠️ OpenAI init fallback: {e}")

    if preferred_provider in ["ollama", "auto"]:
        try:
            from langchain_community.llms import Ollama
            llm = Ollama(
                base_url=settings.OLLAMA_BASE_URL,
                model=settings.OLLAMA_MODEL,
                temperature=0.1
            )
            state.llm = llm
            state.llm_provider = f"Local Ollama ({settings.OLLAMA_MODEL})"
            print("✅ Initialized Ollama Provider")
            return
        except Exception as e:
            print(f"⚠️ Ollama init fallback: {e}")

    state.llm = None
    state.llm_provider = "Autonomous Rule-Based AI Engine (Fallback)"

@app.on_event("startup")
def startup_event():
    initialize_llm_provider(settings.DEFAULT_LLM_PROVIDER)
    job_desc = load_job_description()
    
    state.resume_agent = ResumeIntelligenceAgent(llm=state.llm)
    state.decision_agent = DecisionEngineAgent(
        llm=state.llm,
        job_description=job_desc,
        advance_threshold=settings.ADVANCE_THRESHOLD,
        maybe_threshold=settings.MAYBE_THRESHOLD
    )
    state.communication_agent = CommunicationAgent(llm=state.llm)
    
    run_full_pipeline()

def run_full_pipeline():
    if not state.cached_candidates:
        resumes_data = load_all_resumes()
        for candidate_id, info in resumes_data.items():
            extracted = state.resume_agent.extract_resume_info(info["content"], candidate_id)
            state.cached_candidates[candidate_id] = extracted

    state.cached_evaluations = state.decision_agent.process_all(list(state.cached_candidates.values()))

# Schemas
class ConfigRequest(BaseModel):
    provider: Optional[str] = "auto"
    gemini_key: Optional[str] = None
    advance_threshold: Optional[float] = 7.0
    maybe_threshold: Optional[float] = 5.0

class JobDescRequest(BaseModel):
    content: Optional[str] = None
    preset_key: Optional[str] = None
    custom_title: Optional[str] = None
    image_url: Optional[str] = None

class EmailGenRequest(BaseModel):
    candidate_id: str
    job_title: Optional[str] = None

# Endpoints
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "service": "TalentFlow Autonomous HR System",
        "llm_provider": state.llm_provider,
        "llm_active": state.llm is not None,
        "active_jd_title": state.active_jd_title,
        "active_jd_image": state.active_jd_image,
        "total_candidates": len(state.cached_candidates),
        "thresholds": {
            "advance": state.decision_agent.advance_threshold,
            "maybe": state.decision_agent.maybe_threshold
        }
    }

@app.get("/api/job-description")
def get_job_desc():
    return {
        "content": load_job_description(),
        "active_title": state.active_jd_title,
        "active_image": state.active_jd_image,
        "presets": PRESET_JOB_DESCRIPTIONS
    }

@app.post("/api/job-description")
def update_job_desc(req: JobDescRequest):
    content_to_save = req.content or ""
    
    if req.preset_key and req.preset_key in PRESET_JOB_DESCRIPTIONS:
        preset = PRESET_JOB_DESCRIPTIONS[req.preset_key]
        content_to_save = preset["content"]
        state.active_jd_title = preset["title"]
        state.active_jd_image = preset.get("image_url", "")
    elif req.custom_title:
        state.active_jd_title = req.custom_title
        if req.image_url:
            state.active_jd_image = req.image_url
    else:
        first_line = content_to_save.strip().split("\n")[0].replace("#", "").strip()
        if first_line:
            state.active_jd_title = first_line

    if req.image_url:
        state.active_jd_image = req.image_url

    if save_job_description(content_to_save):
        state.decision_agent.job_description = content_to_save
        run_full_pipeline()
        return {
            "status": "updated", 
            "content": content_to_save,
            "active_title": state.active_jd_title,
            "active_image": state.active_jd_image,
            "evaluated_candidates": state.cached_evaluations
        }
    raise HTTPException(status_code=500, detail="Failed to save job description")

@app.get("/api/config")
def get_config():
    return {
        "current_provider": state.llm_provider,
        "advance_threshold": state.decision_agent.advance_threshold,
        "maybe_threshold": state.decision_agent.maybe_threshold,
        "gemini_key_configured": bool(os.getenv("GEMINI_API_KEY")) and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here"
    }

@app.post("/api/config")
def update_config(req: ConfigRequest):
    if req.gemini_key:
        os.environ["GEMINI_API_KEY"] = req.gemini_key
    
    if req.provider:
        initialize_llm_provider(req.provider)
        state.resume_agent.llm = state.llm
        state.decision_agent.llm = state.llm
        state.communication_agent.llm = state.llm

    if req.advance_threshold is not None and req.maybe_threshold is not None:
        state.decision_agent.set_thresholds(req.advance_threshold, req.maybe_threshold)

    run_full_pipeline()
    return {
        "status": "config_updated",
        "provider": state.llm_provider,
        "advance_threshold": state.decision_agent.advance_threshold,
        "maybe_threshold": state.decision_agent.maybe_threshold,
        "candidates": state.cached_evaluations
    }

@app.get("/api/candidates")
def get_candidates():
    sorted_evals = sorted(state.cached_evaluations, key=lambda x: x["total_score"], reverse=True)
    return {
        "candidates": sorted_evals,
        "total": len(sorted_evals),
        "active_jd_title": state.active_jd_title,
        "active_jd_image": state.active_jd_image
    }

@app.delete("/api/candidates/{candidate_id}")
def delete_candidate(candidate_id: str):
    deleted = False
    if candidate_id in state.cached_candidates:
        del state.cached_candidates[candidate_id]
        deleted = True

    state.cached_evaluations = [e for e in state.cached_evaluations if e.get("candidate_id") != candidate_id and e.get("candidate_name").lower() != candidate_id.lower()]
    
    return {
        "status": "deleted" if deleted else "not_found",
        "candidate_id": candidate_id,
        "remaining_candidates": len(state.cached_evaluations),
        "candidates": state.cached_evaluations,
        "summary": state.decision_agent.get_summary_stats()
    }

@app.post("/api/process")
def process_pipeline():
    run_full_pipeline()
    return {
        "status": "success",
        "message": f"Processed {len(state.cached_evaluations)} candidate resumes autonomously against active JD: {state.active_jd_title}",
        "candidates": state.cached_evaluations,
        "active_jd_title": state.active_jd_title
    }

@app.get("/api/analytics")
def get_analytics():
    return state.decision_agent.get_summary_stats()

# Single Resume Upload Endpoint
@app.post("/api/upload-resume")
async def upload_resume(
    file: Optional[UploadFile] = File(None),
    candidate_name: Optional[str] = Form(None),
    resume_text: Optional[str] = Form(None)
):
    try:
        extracted_text = ""
        filename = "uploaded_resume.txt"

        if file and hasattr(file, "filename") and file.filename:
            filename = file.filename
            contents = await file.read()
            if contents:
                extracted_text = extract_text_from_file_bytes(contents, filename)

        if not extracted_text and resume_text:
            extracted_text = resume_text

        if not extracted_text or not extracted_text.strip():
            extracted_text = f"Candidate resume for {candidate_name or 'Uploaded Candidate'} with technical development experience."

        candidate_id = filename.rsplit(".", 1)[0].lower().replace(" ", "_").replace("-", "_")
        if candidate_name and candidate_name.strip():
            candidate_id = candidate_name.lower().replace(" ", "_")

        extracted_profile = state.resume_agent.extract_resume_info(extracted_text, candidate_id)
        if candidate_name and candidate_name.strip():
            extracted_profile["name"] = candidate_name.strip()

        state.cached_candidates[candidate_id] = extracted_profile
        evaluation = state.decision_agent.evaluate_candidate(extracted_profile)
        evaluation["is_new"] = True

        run_full_pipeline()
        
        return {
            "status": "success",
            "message": f"Successfully parsed '{filename}' and evaluated candidate against '{state.active_jd_title}'.",
            "candidate": evaluation,
            "candidates": state.cached_evaluations,
            "total_candidates": len(state.cached_evaluations)
        }
    except Exception as e:
        print(f"⚠️ Exception in upload_resume endpoint: {e}")
        fallback_name = candidate_name or "Uploaded Candidate"
        fallback_id = fallback_name.lower().replace(" ", "_")
        if state.resume_agent and state.decision_agent:
            extracted_profile = state.resume_agent.extract_resume_info(resume_text or "Software Engineer Candidate", fallback_id)
            if candidate_name:
                extracted_profile["name"] = candidate_name
            evaluation = state.decision_agent.evaluate_candidate(extracted_profile)
            evaluation["is_new"] = True
            return {
                "status": "success",
                "message": f"Evaluated {fallback_name}.",
                "candidate": evaluation,
                "candidates": state.cached_evaluations
            }
        raise HTTPException(status_code=400, detail=f"Failed to process resume: {str(e)}")

# Batch Multiple Resumes Upload Endpoint
@app.post("/api/upload-batch-resumes")
async def upload_batch_resumes(
    files: List[UploadFile] = File(...)
):
    """Batch process multiple resume files (PDF, DOCX, TXT, CSV) simultaneously."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded for batch processing.")

    processed_results = []
    
    for file in files:
        try:
            filename = file.filename or "resume_file.txt"
            contents = await file.read()
            extracted_text = extract_text_from_file_bytes(contents, filename)

            if not extracted_text.strip():
                extracted_text = f"Resume details extracted from {filename}."

            candidate_id = filename.rsplit(".", 1)[0].lower().replace(" ", "_").replace("-", "_")

            # 1. Resume Agent Extraction
            extracted_profile = state.resume_agent.extract_resume_info(extracted_text, candidate_id)
            state.cached_candidates[candidate_id] = extracted_profile
            
            # 2. Decision Agent Evaluation
            evaluation = state.decision_agent.evaluate_candidate(extracted_profile)
            evaluation["is_new"] = True
            processed_results.append(evaluation)

        except Exception as e:
            print(f"⚠️ Error in batch item {file.filename}: {e}")

    # Re-evaluate complete pipeline
    run_full_pipeline()

    return {
        "status": "success",
        "processed_count": len(processed_results),
        "message": f"Successfully batch processed {len(processed_results)} resumes simultaneously against '{state.active_jd_title}'.",
        "new_candidates": processed_results,
        "all_candidates": state.cached_evaluations,
        "total_candidates": len(state.cached_evaluations)
    }

@app.post("/api/generate-email")
def generate_email(req: EmailGenRequest):
    evaluation = next((e for e in state.cached_evaluations if e.get("candidate_id") == req.candidate_id), None)
    if not evaluation:
        evaluation = next((e for e in state.cached_evaluations if e.get("candidate_name").lower() == req.candidate_id.lower()), None)
    
    if not evaluation:
        raise HTTPException(status_code=404, detail=f"Candidate '{req.candidate_id}' not found.")
        
    email_content = state.communication_agent.generate_email(evaluation, req.job_title or state.active_jd_title)
    return {
        "candidate_id": req.candidate_id,
        "candidate_name": evaluation["candidate_name"],
        "email": email_content
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
