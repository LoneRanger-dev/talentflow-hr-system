import os
import json
import time
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

class ResumeIntelligenceAgent:
    """
    Autonomous agent for resume analysis, skill extraction, and structured information parsing.
    Refactored for enterprise Python application usage with support for Gemini, OpenAI, and Ollama.
    """
    
    def __init__(self, llm=None):
        self.llm = llm
        self.analysis_count = 0
        self.processing_times: List[float] = []

    def extract_resume_info(self, resume_content: str, candidate_id: str) -> Dict[str, Any]:
        """Extract structured information from resume text using LLM or structured fallback."""
        start_time = time.time()
        
        prompt = f"""Analyze the candidate resume below and extract key structured details.

RESUME CONTENT:
{resume_content}

Return ONLY a valid JSON object matching this structure exactly (no markdown formatting, no commentary):
{{
  "name": "Full Name",
  "email": "Email address or N/A",
  "location": "City, State or N/A",
  "experience_years": "Years of relevant experience as a number or string (e.g. '4')",
  "current_title": "Current or most recent job title",
  "key_skills": ["List", "of", "technical", "skills"],
  "education": "Highest degree and university",
  "summary": "Short 2-3 sentence executive professional summary"
}}
Never use a section heading such as "Candidate Resume", a resume number, a job title, or "Software Engineer" as the name. If the name is not explicit, infer it from the email address or return "Unknown Candidate".
"""

        extracted_info = None

        if self.llm:
            try:
                if hasattr(self.llm, "invoke"):
                    response = self.llm.invoke(prompt)
                    response_text = response.content if hasattr(response, "content") else str(response)
                else:
                    response_text = str(self.llm(prompt))

                # Clean response markdown syntax
                clean_response = response_text.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]
                
                json_match = re.search(r'\{.*\}', clean_response, re.DOTALL)
                if json_match:
                    extracted_info = json.loads(json_match.group())
                    extracted_info["extraction_success"] = True
            except Exception as e:
                print(f"⚠️ LLM extraction warning for {candidate_id}: {e}")

        # Fallback if LLM is unavailable or parsing failed
        if not extracted_info:
            extracted_info = self._fallback_extraction(resume_content, candidate_id)

        extracted_info["name"] = self._resolve_candidate_name(
            extracted_info.get("name"), resume_content, candidate_id
        )

        # Standardize & enrich fields
        processing_time = round(time.time() - start_time, 2)
        self.processing_times.append(processing_time)
        self.analysis_count += 1

        extracted_info["candidate_id"] = candidate_id
        extracted_info["resume_text"] = resume_content
        extracted_info["processed_at"] = datetime.now().isoformat()
        extracted_info["processing_time"] = processing_time
        
        # Ensure key_skills is a list
        if not isinstance(extracted_info.get("key_skills"), list):
            extracted_info["key_skills"] = [s.strip() for s in str(extracted_info.get("key_skills", "")).split(",") if s.strip()]
            
        return extracted_info

    def _fallback_extraction(self, content: str, candidate_id: str) -> Dict[str, Any]:
        """Intelligent heuristic regex parsing for fallback resume analysis."""
        lines = [line.strip() for line in content.split("\n") if line.strip()]
        
        # Candidate name from filename or an explicit resume heading.
        name = candidate_id.replace("_", " ").title()
        for line in lines[:5]:
            cleaned = re.sub(r"^#+\s*", "", line).strip()
            heading_match = re.match(r"(?:resume\s*[-:|]\s*)([A-Za-z][A-Za-z .'-]{2,60})$", cleaned, re.I)
            if heading_match:
                name = heading_match.group(1).strip()
                break

        # Email regex
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', content)
        email = email_match.group(0) if email_match else "N/A"

        # Experience years search
        exp_match = re.search(r'(\d+\+?\s*(?:years|yrs))', content, re.IGNORECASE)
        experience_years = exp_match.group(1) if exp_match else "3"

        # Common tech skills extraction
        known_skills = [
            "Python", "JavaScript", "TypeScript", "React", "Next.js", "Node.js", 
            "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "MongoDB", "Redis", 
            "Docker", "Kubernetes", "AWS", "GCP", "Git", "LangChain", "Go", "HTML", "CSS"
        ]
        found_skills = [skill for skill in known_skills if re.search(rf'\b{re.escape(skill)}\b', content, re.I)]
        if not found_skills:
            found_skills = ["Software Development", "Problem Solving", "Web Applications"]

        # Education extraction
        edu_match = re.search(r'(B\.S\.|M\.S\.|Bachelor|Master|Degree)[^\n]+', content, re.I)
        education = edu_match.group(0).strip() if edu_match else "Higher Education Degree"

        # Title extraction
        title_match = re.search(r'(Senior|Junior|Lead|Full Stack|Backend|Frontend|Software|Data)[^\n|]+', content, re.I)
        current_title = title_match.group(0).strip() if title_match else "Software Engineer"

        return {
            "name": name,
            "email": email,
            "location": "Remote / Hybrid",
            "experience_years": experience_years,
            "current_title": current_title,
            "key_skills": found_skills,
            "education": education,
            "summary": f"Experienced professional with background in {', '.join(found_skills[:3])}.",
            "extraction_success": False
        }

    def _resolve_candidate_name(self, extracted_name: Any, content: str, candidate_id: str) -> str:
        """Reject generic headings and resolve a human name from reliable resume signals."""
        candidate = str(extracted_name or "").strip()
        generic_pattern = re.compile(
            r"^(?:unknown candidate|candidate|candidate resume|resume|uploaded resume|applicant|software engineer|"
            r"senior software engineer|full stack developer|devops engineer|data engineer)(?:\s*[-|:].*)?$",
            re.I,
        )
        if candidate and not generic_pattern.match(candidate) and not re.match(r"^\d+(?:[.)]|\s)", candidate):
            return candidate

        explicit_name = re.search(
            r"(?:^|\n)\s*(?:name|candidate name|applicant)\s*[:\-]\s*([A-Za-z][A-Za-z .'-]{2,80})\s*(?:\n|$)",
            content,
            re.I,
        )
        if explicit_name:
            return explicit_name.group(1).strip()

        email_match = re.search(r"([A-Za-z][A-Za-z0-9._%+-]*)@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", content)
        if email_match:
            email_name = re.sub(r"[._-]+", " ", email_match.group(1))
            if re.match(r"^[A-Za-z]+(?:\s+[A-Za-z]+)+$", email_name):
                return email_name.title()

        filename_name = re.sub(r"[_-]+", " ", candidate_id).strip()
        filename_name = re.sub(r"\b(?:resume|cv|candidate)\b", "", filename_name, flags=re.I).strip()
        if re.match(r"^[A-Za-z]+(?:\s+[A-Za-z]+)+$", filename_name):
            return filename_name.title()
        return "Unknown Candidate"

    def get_agent_stats(self) -> Dict[str, Any]:
        """Return agent processing performance statistics."""
        if not self.processing_times:
            return {"analyses_completed": 0, "avg_processing_time": 0.0}
        
        return {
            "analyses_completed": self.analysis_count,
            "avg_processing_time": round(sum(self.processing_times) / len(self.processing_times), 2),
            "fastest_analysis": round(min(self.processing_times), 2),
            "slowest_analysis": round(max(self.processing_times), 2),
            "total_processing_time": round(sum(self.processing_times), 2)
        }
