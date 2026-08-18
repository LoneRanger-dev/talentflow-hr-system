import json
import time
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

class DecisionEngineAgent:
    """
    Autonomous AI agent for evaluating candidate resumes against job description requirements.
    Calculates detailed 0-10 scores, makes ADVANCE / MAYBE / REJECT hiring decisions,
    and generates interview preparation insights.
    """
    
    def __init__(self, llm=None, job_description: str = "", advance_threshold: float = 7.0, maybe_threshold: float = 5.0):
        self.llm = llm
        self.job_description = job_description
        self.advance_threshold = advance_threshold
        self.maybe_threshold = maybe_threshold
        self.decisions: List[Dict[str, Any]] = []
        self.processing_times: List[float] = []

    def set_thresholds(self, advance: float, maybe: float):
        """Dynamically update scoring thresholds."""
        self.advance_threshold = max(1.0, min(10.0, advance))
        self.maybe_threshold = max(0.0, min(self.advance_threshold, maybe))

    def evaluate_candidate(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate candidate resume against job requirements."""
        start_time = time.time()
        candidate_name = candidate_data.get("name", "Candidate")
        candidate_skills = candidate_data.get("key_skills", [])
        if isinstance(candidate_skills, list):
            skills_str = ", ".join(candidate_skills)
        else:
            skills_str = str(candidate_skills)
            
        experience = candidate_data.get("experience_years", "Not specified")
        current_title = candidate_data.get("current_title", "Software Engineer")
        education = candidate_data.get("education", "Not specified")

        prompt = f"""You are an enterprise HR Decision Agent. Evaluate the candidate against the Job Description.

JOB DESCRIPTION:
{self.job_description}

CANDIDATE PROFILE:
Name: {candidate_name}
Title: {current_title}
Experience: {experience}
Education: {education}
Key Skills: {skills_str}

SCORING RULES (Total Score 0.0 - 10.0):
1. Technical Skills Match (0.0 to 3.0 pts)
2. Experience Level & Relevance (0.0 to 3.0 pts)
3. Education & Qualifications (0.0 to 2.0 pts)
4. Overall Fit & Potential (0.0 to 2.0 pts)

Respond strictly in valid JSON format:
{{
  "candidate_name": "{candidate_name}",
  "technical_skills_score": 2.5,
  "experience_score": 2.5,
  "education_score": 1.5,
  "overall_fit_score": 1.5,
  "total_score": 8.0,
  "strengths": ["Key strength 1", "Key strength 2"],
  "concerns": ["Area of concern or weakness"],
  "interview_focus": ["Topic to assess during technical interview"],
  "reasoning": "A concise 2-3 sentence justification explaining the score breakdown and decision."
}}
"""

        scoring_data = None

        if self.llm:
            try:
                if hasattr(self.llm, "invoke"):
                    response = self.llm.invoke(prompt)
                    response_text = response.content if hasattr(response, "content") else str(response)
                else:
                    response_text = str(self.llm(prompt))

                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    raw_json = json_match.group()
                    scoring_data = json.loads(raw_json)
            except Exception as e:
                print(f"⚠️ LLM evaluation error for {candidate_name}: {e}")

        # Fallback scoring calculation if LLM unavailable
        if not scoring_data:
            scoring_data = self._calculate_fallback_score(candidate_data)

        # Make autonomous decision based on thresholds
        total_score = float(scoring_data.get("total_score", 5.0))
        total_score = max(0.0, min(10.0, round(total_score, 1)))

        if total_score >= self.advance_threshold:
            decision = "ADVANCE"
            next_action = "Schedule technical interview"
            priority = "High"
        elif total_score >= self.maybe_threshold:
            decision = "MAYBE"
            next_action = "Phone screening required"
            priority = "Medium"
        else:
            decision = "REJECT"
            next_action = "Send encouraging rejection email"
            priority = "Low"

        processing_time = round(time.time() - start_time, 2)
        self.processing_times.append(processing_time)

        decision_record = {
            "candidate_id": candidate_data.get("candidate_id", candidate_name.lower().replace(" ", "_")),
            "candidate_name": candidate_name,
            "email": candidate_data.get("email", "N/A"),
            "current_title": current_title,
            "experience_years": experience,
            "key_skills": candidate_skills if isinstance(candidate_skills, list) else [skills_str],
            "total_score": total_score,
            "decision": decision,
            "next_action": next_action,
            "priority": priority,
            "evaluated_at": datetime.now().isoformat(),
            "strengths": scoring_data.get("strengths", ["Solid technical foundation"]),
            "concerns": scoring_data.get("concerns", ["Verify years of experience"]),
            "interview_focus": scoring_data.get("interview_focus", ["System design and API architecture"]),
            "reasoning": scoring_data.get("reasoning", f"Evaluated score {total_score}/10 based on skills alignment and experience."),
            "detailed_scores": {
                "technical_skills": round(float(scoring_data.get("technical_skills_score", total_score * 0.3)), 1),
                "experience": round(float(scoring_data.get("experience_score", total_score * 0.3)), 1),
                "education": round(float(scoring_data.get("education_score", total_score * 0.2)), 1),
                "overall_fit": round(float(scoring_data.get("overall_fit_score", total_score * 0.2)), 1)
            },
            "processing_time": processing_time
        }

        self.decisions.append(decision_record)
        return decision_record

    def _calculate_fallback_score(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic skill-matching score generator for offline or fallback operation."""
        skills = [s.lower() for s in candidate_data.get("key_skills", [])]
        title = candidate_data.get("current_title", "").lower()
        exp_raw = str(candidate_data.get("experience_years", "0"))
        
        # Skill points calculation
        high_val_skills = ["python", "fastapi", "react", "next.js", "typescript", "langchain", "postgresql", "redis"]
        matched_skills = [s for s in skills if any(h in s for h in high_val_skills)]
        tech_score = min(3.0, round(len(matched_skills) * 0.6, 1))

        # Experience score
        exp_years = 3.0
        exp_match = re.search(r'(\d+)', exp_raw)
        if exp_match:
            exp_years = float(exp_match.group(1))

        if exp_years >= 5:
            exp_score = 3.0
        elif exp_years >= 3:
            exp_score = 2.4
        elif exp_years >= 2:
            exp_score = 1.8
        else:
            exp_score = 1.0

        # Education & Seniority
        edu_score = 1.5 if "senior" in title or "lead" in title or "m.s." in str(candidate_data.get("education", "")).lower() else 1.2
        fit_score = 1.5 if "full stack" in title or "senior" in title else 1.0

        total = round(tech_score + exp_score + edu_score + fit_score, 1)

        strengths = []
        if matched_skills:
            strengths.append(f"Strong match in core stack: {', '.join([s.title() for s in matched_skills[:3]])}")
        if exp_years >= 3:
            strengths.append(f"Demonstrated {exp_years}+ years of software development experience")
        if not strengths:
            strengths.append("Motivated candidate with technical background")

        concerns = []
        if exp_years < 3:
            concerns.append("Lower total years of experience than ideal target requirement")
        if "langchain" not in skills and "ai" not in title:
            concerns.append("Limited explicit AI agent framework exposure listed")
        if not concerns:
            concerns.append("Verify direct experience in enterprise CI/CD environments")

        return {
            "technical_skills_score": tech_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "overall_fit_score": fit_score,
            "total_score": total,
            "strengths": strengths,
            "concerns": concerns,
            "interview_focus": ["Full-stack architecture", "API design and optimization", "Team collaboration"],
            "reasoning": f"Candidate demonstrates strong technical alignment with key technologies ({', '.join(skills[:3])}) and {exp_years} years experience."
        }

    def process_all(self, candidate_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Evaluate a list of candidate profiles."""
        self.decisions = []
        results = []
        for candidate in candidate_list:
            results.append(self.evaluate_candidate(candidate))
        return results

    def get_summary_stats(self) -> Dict[str, Any]:
        """Generate aggregate analytics across evaluated decisions."""
        if not self.decisions:
            return {
                "total_candidates": 0,
                "decision_breakdown": {"ADVANCE": 0, "MAYBE": 0, "REJECT": 0},
                "average_score": 0.0,
                "total_processing_time_sec": 0.0,
                "avg_time_per_candidate_sec": 0.0,
                "roi_analytics": {
                    "manual_hours_required": 0.0,
                    "ai_hours_spent": 0.0,
                    "hours_saved": 0.0,
                    "cost_savings_usd": 0.0,
                    "efficiency_gain_percentage": 0.0,
                    "savings_per_hire": 0.0
                }
            }

        counts = {"ADVANCE": 0, "MAYBE": 0, "REJECT": 0}
        total_score = 0.0

        for d in self.decisions:
            dec = d.get("decision", "MAYBE")
            counts[dec] = counts.get(dec, 0) + 1
            total_score += d.get("total_score", 0.0)

        total_candidates = len(self.decisions)
        avg_score = round(total_score / total_candidates, 2) if total_candidates > 0 else 0.0
        total_time = round(sum(self.processing_times), 2)
        avg_time = round(total_time / total_candidates, 2) if total_candidates > 0 else 0.0

        # Dynamic ROI Metrics based strictly on evaluated candidate data
        manual_hrs = round((total_candidates * 21.0) / 60.0, 2)
        ai_hrs = round(total_time / 3600.0, 4)
        time_saved_hrs = round(max(0.0, manual_hrs - ai_hrs), 1)
        cost_saved_usd = round(time_saved_hrs * 80.0, 2)
        efficiency_gain_pct = round(((manual_hrs - ai_hrs) / manual_hrs) * 100, 1) if manual_hrs > 0 else 0.0
        qualifying_hires = max(1, counts["ADVANCE"] + counts["MAYBE"])

        return {
            "total_candidates": total_candidates,
            "decision_breakdown": counts,
            "average_score": avg_score,
            "total_processing_time_sec": total_time,
            "avg_time_per_candidate_sec": avg_time,
            "roi_analytics": {
                "manual_hours_required": manual_hrs,
                "ai_hours_spent": ai_hrs,
                "hours_saved": time_saved_hrs,
                "cost_savings_usd": cost_saved_usd,
                "efficiency_gain_percentage": efficiency_gain_pct,
                "savings_per_hire": round(cost_saved_usd / qualifying_hires, 2)
            }
        }
