import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path(__file__).resolve().parent / "data"
RESUMES_DIR = DATA_DIR / "resumes"
JOB_DESC_FILE = DATA_DIR / "job_description.md"

# Load .env file
load_dotenv(BASE_DIR / ".env")

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2")
    DEFAULT_LLM_PROVIDER: str = os.getenv("DEFAULT_LLM_PROVIDER", "auto")
    
    # Decision Engine Thresholds
    ADVANCE_THRESHOLD: float = 7.0
    MAYBE_THRESHOLD: float = 5.0
    
    # Analytics & ROI Constants
    MANUAL_MINUTES_PER_RESUME: float = 6.0
    MANUAL_MINUTES_PER_DECISION: float = 15.0
    HR_HOURLY_RATE_USD: float = 80.0

settings = Settings()
