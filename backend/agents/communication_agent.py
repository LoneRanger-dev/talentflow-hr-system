import json
import re
from typing import Dict, Any, Optional

class CommunicationAgent:
    """
    Autonomous AI agent for generating personalized candidate emails & communications.
    Tailors messages based on candidate evaluation status (ADVANCE, MAYBE, REJECT),
    incorporating specific strengths, interview focus areas, and role details.
    """

    def __init__(self, llm=None, company_name: str = "TechFlow Solutions"):
        self.llm = llm
        self.company_name = company_name

    def generate_email(self, candidate_decision: Dict[str, Any], job_title: str = "Senior Full Stack Engineer") -> Dict[str, str]:
        """Generate tailored candidate email based on decision record."""
        candidate_name = candidate_decision.get("candidate_name", "Candidate")
        decision = candidate_decision.get("decision", "MAYBE")
        strengths = candidate_decision.get("strengths", [])
        strengths_str = ", ".join(strengths[:2]) if strengths else "technical background"
        interview_focus = candidate_decision.get("interview_focus", [])
        focus_str = ", ".join(interview_focus[:2]) if interview_focus else "your technical experience"

        prompt = f"""You are an executive HR Communication Agent at {self.company_name}.
Draft a professional, personalized email to a candidate based on their recruitment evaluation status.

CANDIDATE: {candidate_name}
JOB TITLE: {job_title}
DECISION STATUS: {decision}
KEY STRENGTHS: {strengths_str}
INTERVIEW FOCUS: {focus_str}

Email Guidelines:
- If ADVANCE: Enthusiastic invitation to a 45-minute technical interview. Highlight key strengths ({strengths_str}).
- If MAYBE: Friendly request for a brief 15-minute phone screening to clarify background ({focus_str}).
- If REJECT: Warm, respectful notification noting high volume of applicants, acknowledging strengths ({strengths_str}), and keeping door open for future openings.

Respond ONLY in valid JSON format:
{{
  "subject": "Email Subject Line",
  "body": "Complete email body formatted in standard professional paragraphs.",
  "type": "{decision}"
}}
"""

        email_data = None

        if self.llm:
            try:
                if hasattr(self.llm, "invoke"):
                    response = self.llm.invoke(prompt)
                    response_text = response.content if hasattr(response, "content") else str(response)
                else:
                    response_text = str(self.llm(prompt))

                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    email_data = json.loads(json_match.group())
            except Exception as e:
                print(f"⚠️ Email generation LLM fallback for {candidate_name}: {e}")

        if not email_data:
            email_data = self._template_fallback(candidate_name, decision, job_title, strengths_str, focus_str)

        return email_data

    def _template_fallback(self, name: str, decision: str, job_title: str, strengths: str, focus: str) -> Dict[str, str]:
        """Template fallback for generating candidate communications."""
        if decision == "ADVANCE":
            subject = f"Interview Invitation: {job_title} role at {self.company_name}"
            body = (
                f"Dear {name},\n\n"
                f"Thank you for applying for the {job_title} position at {self.company_name}. "
                f"Our engineering leadership team was highly impressed by your experience, particularly your {strengths}.\n\n"
                f"We would love to invite you to a 45-minute technical interview with our team. "
                f"During this call, we look forward to discussing your past engineering accomplishments and exploring how your skills fit our roadmap.\n\n"
                f"Please let us know your availability over the next few days, or select a time slot on our calendar link.\n\n"
                f"Best regards,\n\n"
                f"Talent Acquisition Team\n"
                f"{self.company_name}"
            )
        elif decision == "MAYBE":
            subject = f"Update regarding your application for {job_title} at {self.company_name}"
            body = (
                f"Dear {name},\n\n"
                f"Thank you for your interest in the {job_title} role at {self.company_name}. "
                f"We have reviewed your profile and appreciate your background in software development.\n\n"
                f"We would like to schedule a brief 15-minute phone screening to discuss your experience regarding {focus}.\n\n"
                f"Please reply to this email with your preferred times this week.\n\n"
                f"Best regards,\n\n"
                f"Talent Acquisition Team\n"
                f"{self.company_name}"
            )
        else:  # REJECT
            subject = f"Application Status: {job_title} at {self.company_name}"
            body = (
                f"Dear {name},\n\n"
                f"Thank you for giving us the opportunity to consider your profile for the {job_title} position at {self.company_name}.\n\n"
                f"While we were impressed by your background in {strengths}, we have decided to move forward with candidates whose experience aligns more closely with our current immediate needs.\n\n"
                f"We genuinely appreciate your time and wish you every success in your career journey. We will keep your resume on file for future opportunities.\n\n"
                f"Warm regards,\n\n"
                f"Talent Acquisition Team\n"
                f"{self.company_name}"
            )

        return {
            "subject": subject,
            "body": body,
            "type": decision
        }
