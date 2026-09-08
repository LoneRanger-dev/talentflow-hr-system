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
        resume_text = candidate_data.get("resume_text", "")

        prompt = f"""You are an enterprise HR Decision Agent. Evaluate the candidate against the Job Description.

JOB DESCRIPTION:
{self.job_description}

CANDIDATE EXTRACTED PROFILE:
Name: {candidate_name}
Title: {current_title}
Experience: {experience}
Education: {education}
Key Skills: {skills_str}

FULL RESUME:
{resume_text}

SCORING RULES (score only evidence in the JD and resume; do not use generic software-engineering assumptions):
1. Technical Skills Match (0.0 to 5.0 pts): required and preferred technologies, domain tools, and responsibilities. This is the primary filter for the role.
2. Experience Level & Relevance (0.0 to 2.0 pts): years, seniority, and directly comparable work.
3. Education & Qualifications (0.0 to 1.5 pts): award the full 1.5 points for any clearly completed regular degree, regardless of academic stream, specialization, distinction, or ordinary pass. Do not reduce this score because the degree is unrelated to the JD. If the JD explicitly requires or strongly prefers a relevant external certification and the resume does not show one, deduct exactly 0.3 points from this category. If the JD has no relevant certification requirement, do not deduct anything. If education is missing, incomplete, unverifiable, or explicitly non-regular, record that as a concern for HR review rather than silently changing the score.
4. Overall Fit & Potential (0.0 to 1.5 pts): role, domain, responsibility, and project alignment.
The total_score MUST equal the sum of the four component scores, rounded to one decimal. Missing mandatory requirements must materially reduce the score. A candidate with a different technology domain must not receive a high score merely for having general engineering experience.

Respond strictly in valid JSON format:
{{
  "candidate_name": "{candidate_name}",
    "technical_skills_score": 3.5,
    "experience_score": 2.0,
    "education_score": 1.0,
    "overall_fit_score": 1.0,
    "total_score": 7.0,
  "strengths": ["Key strength 1", "Key strength 2"],
  "concerns": ["Area of concern or weakness"],
  "interview_focus": ["Topic to assess during technical interview"],
    "score_explanations": {{
        "technical_skills": "Why this score matches the JD technologies and responsibilities",
        "experience": "Why this score matches the JD seniority and relevant work",
        "education": "Education evidence and the qualification policy applied",
        "overall_fit": "Why the candidate's role, domain, and project fit earned this score"
    }},
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
        component_limits = {
            "technical_skills_score": 5.0,
            "experience_score": 2.0,
            "education_score": 1.5,
            "overall_fit_score": 1.5,
        }
        component_scores = {}
        for name, limit in component_limits.items():
            try:
                value = float(scoring_data.get(name, 0.0))
            except (TypeError, ValueError):
                value = 0.0
            component_scores[name] = max(0.0, min(limit, value))
        education_text = str(candidate_data.get("education", ""))
        has_completed_degree = bool(re.search(
            r"\b(?:b\.?s\.?|b\.?a\.?|bachelor|m\.?s\.?|m\.?a\.?|master|ph\.?d|doctorate|degree|diploma)\b",
            education_text,
            re.I,
        ))
        if has_completed_degree:
            component_scores["education_score"] = 1.5
        certification_gap = self._certification_gap(candidate_data)
        if certification_gap and has_completed_degree:
            component_scores["education_score"] = 1.2
        component_scores["overall_fit_score"] = max(
            component_scores["overall_fit_score"],
            self._minimum_fit_score(component_scores),
        )
        # The model explains the evidence, but the application owns the final arithmetic.
        total_score = sum(component_scores.values())
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

        score_explanations = self._default_score_explanations(candidate_data, component_scores)

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
                "technical_skills": round(component_scores["technical_skills_score"], 1),
                "experience": round(component_scores["experience_score"], 1),
                "education": round(component_scores["education_score"], 1),
                "overall_fit": round(component_scores["overall_fit_score"], 1)
            },
            "score_explanations": score_explanations,
            "processing_time": processing_time
        }

        self.decisions.append(decision_record)
        return decision_record

    def _calculate_fallback_score(self, candidate_data: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic skill-matching score generator for offline or fallback operation."""
        skills = [s.lower() for s in candidate_data.get("key_skills", [])]
        resume_text = str(candidate_data.get("resume_text", "")).lower()
        title = candidate_data.get("current_title", "").lower()
        exp_raw = str(candidate_data.get("experience_years", "0"))
        
        # Derive matching terms from this JD so unrelated technology domains score low.
        jd_terms = re.findall(
            r"\b(?:python|java|javascript|typescript|react|next\.js|node\.js|fastapi|django|flask|sql|postgresql|mysql|mongodb|redis|docker|kubernetes|aws|azure|gcp|terraform|snowflake|spark|pyspark|etl|langchain|llm|graphql|linux|go|php|\.net)\b",
            self.job_description.lower()
        )
        required_terms = list(dict.fromkeys(jd_terms))
        candidate_text = f"{' '.join(skills)} {resume_text}"
        matched_skills = [term for term in required_terms if term in candidate_text]
        tech_score = round(5.0 * len(matched_skills) / max(1, len(required_terms)), 1)

        # Experience score
        exp_years = 3.0
        exp_match = re.search(r'(\d+)', exp_raw)
        if exp_match:
            exp_years = float(exp_match.group(1))

        if exp_years >= 5:
            exp_score = 2.0
        elif exp_years >= 3:
            exp_score = 1.8
        elif exp_years >= 2:
            exp_score = 1.3
        else:
            exp_score = 0.8

        # Education is a qualification gate, not a relevance multiplier.
        education_text = str(candidate_data.get("education", ""))
        degree_present = bool(re.search(r"\b(?:b\.?s\.?|b\.?a\.?|bachelor|m\.?s\.?|m\.?a\.?|master|ph\.?d|doctorate|degree|diploma)\b", education_text, re.I))
        certification_gap = self._certification_gap(candidate_data)
        edu_score = 1.5 if degree_present else 0.0
        if certification_gap and degree_present:
            edu_score = 1.2
        jd_title_terms = [term for term in required_terms if term in title]
        fit_score = round(1.5 * len(jd_title_terms) / max(1, min(4, len(required_terms))), 1)

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
        missing_terms = [term for term in required_terms[:5] if term not in candidate_text]
        if missing_terms:
            concerns.append(f"Missing or unverified JD requirements: {', '.join(missing_terms[:3])}")
        if not concerns:
            concerns.append("Verify direct experience in enterprise CI/CD environments")

        score_explanations = self._default_score_explanations(candidate_data, {
            "technical_skills_score": tech_score,
            "experience_score": exp_score,
            "education_score": edu_score,
            "overall_fit_score": fit_score,
        })
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
            ,"score_explanations": score_explanations
        }

    def _minimum_fit_score(self, scores: Dict[str, float]) -> float:
        """Prevent a zero fit score when other job-relevant evidence demonstrates alignment."""
        technical_ratio = scores["technical_skills_score"] / 5.0
        experience_ratio = scores["experience_score"] / 2.0
        education_ratio = scores["education_score"] / 1.5
        evidence_ratio = (technical_ratio * 0.55) + (experience_ratio * 0.35) + (education_ratio * 0.10)
        if evidence_ratio >= 0.75:
            return 1.0
        if evidence_ratio >= 0.45:
            return 0.5
        return 0.0

    def _certification_gap(self, candidate_data: Dict[str, Any]) -> bool:
        """Return true only when the JD names a certification absent from the resume."""
        jd = self.job_description.lower()
        resume = str(candidate_data.get("resume_text", "")).lower()
        certification_families = {
            "aws": (r"aws\s+(?:certified|certification)", r"aws\s+certified|aws\s+certification"),
            "azure": (r"(?:azure|microsoft)\s+certif(?:ied|ication)", r"(?:azure|microsoft)\s+certif(?:ied|ication)"),
            "gcp": (r"(?:gcp|google cloud)\s+certif(?:ied|ication)", r"(?:gcp|google cloud)\s+certif(?:ied|ication)"),
            "pmp": (r"\bpmp\b", r"\bpmp\b"),
            "cissp": (r"\bcissp\b", r"\bcissp\b"),
            "comptia": (r"\bcomptia\b", r"\bcomptia\b"),
            "cka": (r"\bcka\b", r"\bcka\b"),
            "ckad": (r"\bckad\b", r"\bckad\b"),
            "terraform": (r"terraform\s+associate", r"terraform\s+associate"),
            "snowpro": (r"\bsnowpro\b", r"\bsnowpro\b"),
            "databricks": (r"databricks\s+certif(?:ied|ication)", r"databricks\s+certif(?:ied|ication)"),
            "scrum": (r"(?:certified scrum master|scrum master certification)", r"(?:certified scrum master|scrum master certification)"),
        }
        required = [resume_pattern for jd_pattern, resume_pattern in certification_families.values() if re.search(jd_pattern, jd, re.I)]
        return bool(required) and not any(re.search(pattern, resume, re.I) for pattern in required)

    def _default_score_explanations(self, candidate_data: Dict[str, Any], scores: Dict[str, float]) -> Dict[str, str]:
        """Create transparent score rationales when the model does not provide them."""
        skills = ", ".join(candidate_data.get("key_skills", [])[:5]) or "no explicit skills"
        education = str(candidate_data.get("education", "Not specified"))
        degree_present = bool(re.search(r"\b(?:b\.?s\.?|b\.?a\.?|bachelor|m\.?s\.?|m\.?a\.?|master|ph\.?d|doctorate|degree|diploma)\b", education, re.I))
        certification_gap = self._certification_gap(candidate_data)
        education_reason = (
            f"1.2/1.5: completed degree evidence found ({education}); the JD names a relevant external certification that is not shown, so exactly 0.3 was deducted."
            if degree_present and certification_gap else
            f"Full 1.5/1.5: completed degree evidence found ({education}); stream and distinction do not reduce this qualification score."
            if degree_present else
            "0.0/1.5: no clearly completed degree evidence was found; HR should verify education before a final decision."
        )
        return {
            "technical_skills": f"{scores['technical_skills_score']}/5.0 based on overlap between the JD requirements and resume skills ({skills}); technical alignment is the primary filter.",
            "experience": f"{scores['experience_score']}/2.0 based on the candidate's stated experience and relevance to the responsibilities in the JD.",
            "education": education_reason,
            "overall_fit": f"{scores['overall_fit_score']}/1.5 based on role, domain, responsibility, and project alignment with the active JD.",
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
