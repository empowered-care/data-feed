#!/usr/bin/env python3
"""
Aegis Lite - Multi-Agent Disease Outbreak Detection System
"""

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from datetime import datetime

from models.schemas import OutbreakProcessResponse, QueryResponse
from services.gemini_service import GeminiService
from services.agents import ExtractionAgent, ValidationAgent, RiskAnalysisAgent, AlertGenerationAgent, DataAssistantAgent
from config import API_TITLE, API_VERSION, LOG_LEVEL, LOG_FORMAT, ALLOWED_ORIGINS, MAX_TEXT_LENGTH, MAX_QUERY_LENGTH

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT
)
logger = logging.getLogger(__name__)

logger.info("🚀 Starting Aegis Lite...")

app = FastAPI(
    title=API_TITLE,
    description="AI-powered disease outbreak detection using specialized agents",
    version=API_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # In production, specify allowed origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
logger.info("🔧 Initializing Gemini service...")
try:
    gemini_service = GeminiService()
    logger.info("✅ Gemini service initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini service: {e}")
    raise

# Initialize agents
logger.info("🤖 Initializing agents...")
try:
    extraction_agent = ExtractionAgent(gemini_service)
    validation_agent = ValidationAgent(gemini_service)
    risk_agent = RiskAnalysisAgent(gemini_service)
    alert_agent = AlertGenerationAgent(gemini_service)
    data_assistant = DataAssistantAgent(gemini_service)
    logger.info("✅ All agents initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize agents: {e}")
    raise

logger.info("✅ Aegis Lite initialization complete!")

# Outbreak Detection Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Aegis Lite - Multi-Agent Disease Outbreak Detection System",
        "status": "running",
        "agents": ["extraction", "validation", "risk_analysis", "alert_generation", "data_assistant"]
    }

@app.post("/outbreak/process", response_model=OutbreakProcessResponse)
async def process_outbreak_report(request: dict):
    """Process an outbreak report through the multi-agent pipeline."""
    text = request.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required and cannot be empty")

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Text input too long (max {MAX_TEXT_LENGTH} characters)")

    session_id = str(uuid.uuid4())
    start_time = datetime.now()

    logger.info(f"--- 🚨 Outbreak Report Processing: {session_id} ---")
    logger.info(f"📝 Input: {text}")

    try:
        # Agent 1: Extraction
        logger.info("🤖 Agent 1: Extracting structured data...")
        extracted_data = extraction_agent.extract(text)

        # Agent 2: Validation
        logger.info("🤖 Agent 2: Validating data...")
        validation = validation_agent.validate(extracted_data)

        # Agent 3: Risk Analysis
        logger.info("🤖 Agent 3: Analyzing risk...")
        risk_analysis = risk_agent.analyze_risk(extracted_data)

        # Agent 4: Alert Generation
        logger.info("🤖 Agent 4: Generating alert...")
        alert = alert_agent.generate_alert(extracted_data, risk_analysis)

        # Store in data assistant
        data_assistant.add_report(extracted_data)

        processing_time = (datetime.now() - start_time).total_seconds()

        logger.info(f"--- ✅ Outbreak Processing Complete: {session_id} ({processing_time:.2f}s) ---")

        return OutbreakProcessResponse(
            extracted_data=extracted_data,
            validation=validation,
            risk_analysis=risk_analysis,
            alert=alert,
            session_id=session_id,
            metadata={
                "processed_at": str(datetime.now()),
                "processing_time_seconds": processing_time,
                "agents_used": ["extraction", "validation", "risk_analysis", "alert_generation"]
            },
            message="🚨 Outbreak report processed through multi-agent pipeline.",
            human_validation_required=risk_analysis.risk_level in ["HIGH", "MEDIUM"]
        )
    except Exception as e:
        logger.error(f"❌ Processing error for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/outbreak/approve/{session_id}")
async def approve_alert(session_id: str, request: dict = None):
    """Human validation endpoint for alerts."""
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")

    approved = request.get("approved", True) if request else True

    logger.info(f"Alert {'approved' if approved else 'rejected'} for session {session_id}")

    # In a real system, this would trigger the alert system
    return {
        "session_id": session_id,
        "approved": approved,
        "message": "Alert approved and sent to notification system." if approved else "Alert rejected.",
        "timestamp": str(datetime.now())
    }

@app.post("/outbreak/query", response_model=QueryResponse)
async def query_outbreak_data(request: dict):
    """Query the outbreak data using the Data Assistant Agent."""
    query = request.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query field is required")

    if len(query) > MAX_QUERY_LENGTH:
        raise HTTPException(status_code=400, detail=f"Query too long (max {MAX_QUERY_LENGTH} characters)")

    logger.info(f"--- 🔍 Data Query: {query} ---")

    try:
        result = data_assistant.query(query)
        logger.info("--- ✅ Query Complete ---")
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"❌ Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.get("/outbreak/summary")
async def get_outbreak_summary():
    """Get a summary of all outbreak reports."""
    try:
        total_reports = len(data_assistant.data_store)
        locations = list(set(r["location"] for r in data_assistant.data_store if r["location"] != "Unknown"))
        total_cases = sum(r.get("cases", 0) for r in data_assistant.data_store)

        return {
            "total_reports": total_reports,
            "total_cases": total_cases,
            "locations": locations,
            "timestamp": str(datetime.now()),
            "data_points": len(data_assistant.data_store)
        }
    except Exception as e:
        logger.error(f"❌ Summary error: {e}")
        raise HTTPException(status_code=500, detail=f"Summary failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": str(datetime.now()),
        "version": "1.0.0",
        "agents": {
            "extraction": "active",
            "validation": "active",
            "risk_analysis": "active",
            "alert_generation": "active",
            "data_assistant": "active"
        }
    }

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)