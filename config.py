import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

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
API_TITLE = "Empowered Care - Multi-Agent Disease Outbreak Detection System"
API_VERSION = "1.0.0"

# Security Settings
SECRET_KEY = os.getenv("SECRET_KEY", "7b9c9f8e7d6c5b4a3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
INVITE_TOKEN_EXPIRE_HOURS = 48
RESET_TOKEN_EXPIRE_HOURS = 1

# SMTP Settings
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

# Frontend URL (for invitation/reset links)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

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