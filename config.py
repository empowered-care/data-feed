from pathlib import Path
from datetime import datetime

# Application Paths
BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
LOG_DIR = BASE_DIR / "logs"

UPLOAD_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

def get_session_dir(session_id: str):
    session_dir = LOG_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    return session_dir

# API Settings
API_HOST = "0.0.0.0"
API_PORT = 8000
API_TITLE = "Aegis Lite - Multi-Agent Disease Outbreak Detection System"
API_VERSION = "1.0.0"

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Gemini AI Settings
GEMINI_MODEL_PREFERENCES = [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-flash-latest'
]

# Validation Settings
MAX_TEXT_LENGTH = 1000
MAX_QUERY_LENGTH = 500
VALID_SYMPTOMS = [
    "fever", "cough", "headache", "vomiting", "diarrhea",
    "rash", "fatigue", "pain", "nausea", "dizziness",
    "sore throat", "runny nose", "chills", "sweating",
    "muscle pain", "joint pain", "loss of appetite"
]

# Risk Assessment
RISK_THRESHOLDS = {
    "LOW": 0.3,
    "MEDIUM": 0.6,
    "HIGH": 0.8
}

# Data Storage (for production, use a database)
MAX_STORED_REPORTS = 1000

# CORS Settings (restrict in production)
ALLOWED_ORIGINS = ["*"]  # Change to specific domains in production