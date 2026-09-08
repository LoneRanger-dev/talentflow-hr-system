import json
import random
import re
from typing import Any, Dict, List


class InterviewPreparationAgent:
    """Generate JD-grounded interview questions with evidence-based answer guides."""

    def __init__(self, llm=None):
        self.llm = llm

    def generate_questions(
        self,
        job_description: str,
        candidate: Dict[str, Any],
        generation_seed: int | None = None,
    ) -> Dict[str, Any]:
        seed = generation_seed if generation_seed is not None else random.randint(1000, 999999999)
        candidate_name = candidate.get("name", "Candidate")
        resume_text = candidate.get("resume_text", "")
        prompt = f"""You are a senior technical interviewer and hiring-panel researcher.

Deeply analyze the complete job description and candidate resume below. Build an interview pack for this exact role. Infer the role's essential outcomes, technical competencies, domain risks, seniority expectations, and behavioral signals from the JD. Use the resume only for candidate-specific follow-ups; never invent experience.

JOB DESCRIPTION:
{job_description}

CANDIDATE: {candidate_name}
FULL RESUME:
{resume_text}

Generation seed: {seed}. Use it to vary question framing while keeping the questions relevant.

Return ONLY valid JSON with exactly 10 questions. Cover: role-specific technical depth, architecture or problem solving, practical implementation, requirements clarification, reliability/security, and behavioral ownership. Each answer must be an answer guide grounded in the JD, not a claim that the candidate definitely has the skill.
{{
  "questions": [
    {{
      "question_number": 1,
      "category": "Technical",
      "question": "...",
      "answer": "What a strong answer should cover, including role-specific evidence to request",
      "evaluation_focus": "How the interviewer should assess the response"
    }}
  ]
}}
"""

        if self.llm:
            try:
                if hasattr(self.llm, "invoke"):
                    response = self.llm.invoke(prompt)
                    response_text = response.content if hasattr(response, "content") else str(response)
                else:
                    response_text = str(self.llm(prompt))
                match = re.search(r"\{.*\}", response_text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group())
                    questions = self._validate_questions(parsed.get("questions", []))
                    if len(questions) == 10:
                        return {"questions": questions, "generation_seed": seed, "source": "jd_and_resume_analysis"}
            except Exception as exc:
                print(f"Interview question generation fallback: {exc}")

        return {
            "questions": self._fallback_questions(job_description, candidate, seed),
            "generation_seed": seed,
            "source": "structured_jd_fallback",
        }

    def _validate_questions(self, questions: Any) -> List[Dict[str, Any]]:
        if not isinstance(questions, list):
            return []
        valid = []
        for index, item in enumerate(questions[:10], start=1):
            if not isinstance(item, dict) or not item.get("question") or not item.get("answer"):
                continue
            valid.append({
                "question_number": index,
                "category": str(item.get("category", "Role-specific")),
                "question": str(item["question"]).strip(),
                "answer": str(item["answer"]).strip(),
                "evaluation_focus": str(item.get("evaluation_focus", "Evidence, clarity, and depth.")).strip(),
            })
        return valid

    def chat(self, job_description: str, candidate: Dict[str, Any], messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """Continue an interviewer conversation grounded in the JD and candidate evidence."""
        safe_messages = [
            {"role": str(item.get("role", "user")), "content": str(item.get("content", ""))[:3000]}
            for item in messages[-12:] if item.get("content")
        ]
        transcript = "\n".join(f"{item['role'].upper()}: {item['content']}" for item in safe_messages)
        prompt = f"""You are an enterprise technical interviewer assistant.
Use the complete job description and candidate resume as your source of truth. Continue the interviewer's conversation. When the interviewer gives sample questions, generate relevant follow-ups grounded in a JD requirement, candidate claim, or competency gap. Never invent experience.

JOB DESCRIPTION:
{job_description}

CANDIDATE: {candidate.get('name', 'Candidate')}
FULL RESUME:
{candidate.get('resume_text', '')}

CONVERSATION:
{transcript}

Return ONLY valid JSON with "reply" and "questions". Each question needs category, question, answer, and evaluation_focus. Return 2 to 5 questions only when questions are requested; otherwise return an empty list.
"""
        if self.llm:
            try:
                response = self.llm.invoke(prompt) if hasattr(self.llm, "invoke") else self.llm(prompt)
                response_text = response.content if hasattr(response, "content") else str(response)
                match = re.search(r"\{.*\}", response_text, re.DOTALL)
                if match:
                    parsed = json.loads(match.group())
                    return {
                        "reply": str(parsed.get("reply", "Here are JD-grounded follow-up questions.")),
                        "questions": self._validate_questions(parsed.get("questions", []))[:5],
                    }
            except Exception as exc:
                print(f"Interview chat fallback: {exc}")

        latest = safe_messages[-1]["content"] if safe_messages else ""
        jd_terms = list(dict.fromkeys(re.findall(r"\b(?:python|react|typescript|javascript|aws|azure|gcp|kubernetes|terraform|snowflake|sql|etl|docker|fastapi|llm|langchain|api|security|leadership)\b", job_description.lower())))
        anchor = ", ".join(jd_terms[:4]) or "the core requirements in the JD"
        questions = [
            f"Can you walk us through a project where you applied {anchor} to solve the problem in your sample question?",
            "What trade-off did you make in that situation, and what would you change after reviewing the result?",
            "How would you validate that approach in production against the success criteria in this job description?",
        ]
        return {
            "reply": f"I grounded these follow-ups in the active JD and candidate evidence. I used your sample: '{latest[:180]}'.",
            "questions": [
                {"question_number": index, "category": "Follow-up", "question": question,
                 "answer": f"A strong answer should connect directly to {anchor}, describe the candidate's contribution, and provide measurable evidence.",
                 "evaluation_focus": "Specificity, technical depth, evidence, and alignment with the JD."}
                for index, question in enumerate(questions, start=1)
            ],
        }

    def _fallback_questions(self, job_description: str, candidate: Dict[str, Any], seed: int) -> List[Dict[str, Any]]:
        randomizer = random.Random(seed)
        candidate_name = str(candidate.get("name", "the candidate"))
        jd_lower = job_description.lower()
        skills = re.findall(
            r"\b(?:python|java|javascript|typescript|react|next\.js|node\.js|fastapi|django|flask|sql|postgresql|mysql|mongodb|redis|docker|kubernetes|aws|azure|gcp|terraform|snowflake|spark|pyspark|etl|langchain|llm|graphql|linux|go|php|\.net)\b",
            jd_lower,
        )
        skills = list(dict.fromkeys(skills)) or ["the core technologies and responsibilities listed in the JD"]
        focus = randomizer.choice(["trade-offs", "failure modes", "operational ownership", "measurable outcomes"])
        templates = [
            ("Technical", f"Walk us through how you would deliver the most important technical outcome in this JD using {', '.join(skills[:3])}.", "A strong answer maps the proposed design to explicit JD requirements, explains trade-offs, and distinguishes proven experience from assumptions.", "Requirement coverage, technical depth, and trade-off reasoning."),
            ("Architecture", "Design the end-to-end architecture for the primary system described in this role. What would you make reliable first?", "A strong answer identifies boundaries, data flow, scaling constraints, observability, and a staged delivery plan tied to the JD.", "System thinking, prioritization, and operational maturity."),
            ("Practical", f"Describe a production implementation where you used {skills[0]} or a comparable technology to solve a difficult problem. Relate your answer to the experience shown by {candidate_name}.", "The candidate should give context, their specific contribution, measurable results, and lessons learned. Do not accept tool-name lists without evidence.", "Authentic hands-on evidence and measurable impact."),
            ("Problem Solving", f"Suppose the system meets its functional requirements but fails under {focus}. How would you investigate and correct it?", "A strong answer starts with symptoms and telemetry, forms hypotheses, reproduces safely, mitigates customer impact, and validates the fix.", "Debugging method, safety, and evidence-based decisions."),
            ("Security", "What security, privacy, or access-control risks would you review before shipping the responsibilities in this JD?", "A strong answer covers least privilege, secret handling, input validation, data exposure, auditability, and threat-specific controls relevant to the role.", "Security awareness and practical controls."),
            ("Quality", "How would you test and release the work expected in this role?", "A strong answer includes unit, integration, contract, performance, and regression coverage plus rollout, rollback, and monitoring criteria.", "Engineering quality and release discipline."),
            ("Requirements", "Which part of this JD would you clarify with the product or hiring team before implementation, and why?", "A strong answer identifies ambiguity, asks precise questions, makes assumptions explicit, and explains how clarification changes design or delivery.", "Judgment, communication, and scope control."),
            ("Ownership", "Tell us about a time you owned a technically difficult delivery from ambiguity through production.", "Look for personal ownership, stakeholder alignment, setbacks, measurable outcomes, and what the candidate changed afterward.", "Accountability, resilience, and learning."),
            ("Collaboration", "How do you handle a design disagreement with another senior engineer when the delivery deadline is real?", "A strong answer uses evidence, makes trade-offs visible, seeks a decision, documents it, and preserves team trust.", "Collaboration and decision quality."),
            ("Role Fit", f"What would your first 30/60/90 days look like in this role, and how would you measure success across {', '.join(skills[:3])}?", "A strong answer prioritizes learning the system, validating assumptions, delivering a small useful outcome, and defining measurable role-specific results.", "Role understanding, initiative, and outcome orientation."),
        ]
        randomizer.shuffle(templates)
        return [
            {"question_number": index, "category": category, "question": question, "answer": answer, "evaluation_focus": evaluation_focus}
            for index, (category, question, answer, evaluation_focus) in enumerate(templates, start=1)
        ]
