from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "uploads"
LOG_DIR = BASE_DIR / "logs"

UPLOAD_DIR.mkdir(exist_ok=True)
LOG_DIR.mkdir(exist_ok=True)

def get_session_dir(session_id: str):
    session_dir = LOG_DIR / session_id
    session_dir.mkdir(exist_ok=True)
    return session_dir