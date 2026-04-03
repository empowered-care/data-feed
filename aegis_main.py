#!/usr/bin/env python3
"""
Aegis Lite - Multi-Agent Disease Outbreak Detection System
"""

import logging
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uuid
import pandas as pd
import io
from datetime import datetime

from models.schemas import OutbreakProcessResponse, QueryResponse, ChatRequest, ChatResponse
from services.gemini_service import GeminiService
from services.agents import (
    SuperAgent, DataAssistantAgent, ChatSupervisor
)
from services.ocr_engine import OCREngine
from utils.pdf_utils import pdf_to_images
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
    ocr_engine = None  # Lazy load OCR
    logger.info("✅ Gemini and OCR services initialized (OCR lazy)")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini service: {e}")
    raise

# Initialize agents
logger.info("🤖 Initializing Dynamic Agents...")
try:
    super_agent = SuperAgent(gemini_service)
    data_assistant = DataAssistantAgent(gemini_service)
    chat_supervisor = ChatSupervisor(gemini_service, data_assistant)
    logger.info("✅ Dynamic Agents and Chatbot initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize agents: {e}")
    raise

def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        logger.info("🔍 Loading OCR Engine...")
        from services.ocr_engine import OCREngine
        ocr_engine = OCREngine()
    return ocr_engine

logger.info("✅ Aegis Lite initialization complete!")

# Outbreak Detection Endpoints

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Aegis Lite - Dynamic Multi-Agent Outbreak Detection",
        "status": "running",
        "system": "SuperAgent Orchestration"
    }

@app.post("/outbreak/process", response_model=OutbreakProcessResponse)
async def process_outbreak_report(request: dict):
    """Process an outbreak report through the dynamic multi-agent pipeline."""
    text = request.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required and cannot be empty")

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Text input too long (max {MAX_TEXT_LENGTH} characters)")

    session_id = str(uuid.uuid4())
    start_time = datetime.now()

    logger.info(f"--- 🚨 Outbreak Report Processing (Dynamic): {session_id} ---")
    logger.info(f"📝 Input: {text}")

    try:
        # Using SuperAgent to orchestrate everything
        result = await super_agent.process_outbreak_parallel(text)
        
        # Store in data assistant
        data_assistant.add_report(result["extracted_data"])

        processing_time = (datetime.now() - start_time).total_seconds()

        logger.info(f"--- ✅ Outbreak Processing Complete: {session_id} ({processing_time:.2f}s) ---")

        risk_analysis = result["risk_analysis"]
        consensus = result["consensus"]

        return OutbreakProcessResponse(
            extracted_data=result["extracted_data"],
            validation=result["validation"],
            risk_analysis=risk_analysis,
            consensus=consensus,
            alert=result["alert"],
            session_id=session_id,
            metadata={
                "processed_at": str(datetime.now()),
                "processing_time_seconds": processing_time,
                "orchestrator": "SuperAgent",
                "consensus_reached": consensus.consensus_reached
            },
            message="🚨 Outbreak report processed through dynamic multi-agent pipeline.",
            human_validation_required=consensus.final_risk_level in ["HIGH", "MEDIUM"]
        )
    except Exception as e:
        logger.error(f"❌ Processing error for session {session_id}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/outbreak/upload", response_model=OutbreakProcessResponse)
async def upload_outbreak_file(file: UploadFile = File(...)):
    """Upload and process an outbreak report file (PDF, CSV, or Image)."""
    session_id = str(uuid.uuid4())
    start_time = datetime.now()
    
    logger.info(f"--- 📂 Processing Uploaded File: {file.filename} ({session_id}) ---")
    
    content = await file.read()
    extracted_text = ""
    
    try:
        # 1. Branch processing by file type
        if file.content_type == "text/csv" or file.filename.endswith(".csv"):
            logger.info("📄 Processing CSV data...")
            df = pd.read_csv(io.BytesIO(content))
            # Merge all rows into a summary text block
            extracted_text = "Outbreak CSV Dump:\n" + df.to_string()
            
        elif file.content_type == "application/pdf" or file.filename.endswith(".pdf"):
            logger.info("📄 Processing PDF with Gemini Vision...")
            from pdf2image import convert_from_bytes
            images = convert_from_bytes(content)
            all_text = []
            prompt = "Extract all text from this medical/epidemiological report page. Return ONLY the text."
            for img_pil in images:
                # Convert PIL to bytes
                img_byte_arr = io.BytesIO()
                img_pil.save(img_byte_arr, format='JPEG')
                text = gemini_service.generate_vision_text(img_byte_arr.getvalue(), prompt)
                all_text.append(text)
            extracted_text = "\n".join(all_text)
            
        elif file.content_type.startswith("image/") or file.filename.endswith((".jpg", ".jpeg", ".png")):
            logger.info("🖼️ Processing Image with Gemini Vision...")
            prompt = "Extract all text from this medical note/report. Return ONLY the text."
            extracted_text = gemini_service.generate_vision_text(content, prompt)
            
        else:
            # Assume plain text
            extracted_text = content.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the provided file.")

        logger.info(f"📝 Extracted text length: {len(extracted_text)}")
        
        # 2. Feed extracted text to SuperAgent
        result = await super_agent.process_outbreak_parallel(extracted_text)
        
        # 3. Store and return
        data_assistant.add_report(result["extracted_data"])
        processing_time = (datetime.now() - start_time).total_seconds()

        return OutbreakProcessResponse(
            extracted_data=result["extracted_data"],
            validation=result["validation"],
            risk_analysis=result["risk_analysis"],
            consensus=result["consensus"],
            alert=result["alert"],
            session_id=session_id,
            metadata={
                "processed_at": str(datetime.now()),
                "processing_time_seconds": processing_time,
                "file_name": file.filename,
                "extracted_text_snippet": extracted_text[:100] + "..."
            },
            message=f"🚨 File '{file.filename}' processed via Dynamic Multi-Agent Pipeline.",
            human_validation_required=result["consensus"].final_risk_level in ["HIGH", "MEDIUM"]
        )

    except Exception as e:
        logger.error(f"❌ File processing failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

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
        result = await data_assistant.query(query)
        logger.info("--- ✅ Query Complete ---")
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"❌ Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")
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

# --- NEW POWERFUL CHATBOT ENDPOINTS ---

@app.post("/outbreak/chat", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """Powerful multi-agent chatbot with memory and data awareness."""
    try:
        result = await chat_supervisor.chat(request.message, request.session_id)
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.delete("/outbreak/chat/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear the conversation history for a specific session."""
    if chat_supervisor.clear_session(session_id):
        return {"message": f"Session {session_id} cleared successfully"}
    else:
        return {"message": f"Session {session_id} not found or already empty"}

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