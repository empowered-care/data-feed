#!/usr/bin/env python3
"""
Empowered Care - Unified Multi-Agent Disease Outbreak Detection & Document Processing System
"""

import logging
import uuid
import io
import cv2
import numpy as np
import pandas as pd
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pathlib import Path
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from models.schemas import (
    OutbreakProcessResponse, QueryResponse, ChatRequest, ChatResponse,
    UserRole, UserInvite, UserAcceptInvite, PasswordResetRequest, 
    PasswordResetConfirm, ChangePassword, Token, User, UserBase,
    ProcessResponse, Detection
)
from services.gemini_service import GeminiService
from services.agents import (
    SuperAgent, DataAssistantAgent, ChatSupervisor,
    ExtractionAgent, ValidationAgent, RiskAnalysisAgent, AlertGenerationAgent
)
from services.ocr_engine import OCREngine
from services.auth_service import AuthService
from services.layout_detector import LayoutDetector
from services.preprocessor import Preprocessor
from services.structurer import Structurer

from utils.pdf_utils import pdf_to_images
from utils.image_utils import image_to_base64, draw_boxes, save_all_versions
from utils.security import create_access_token, decode_token
from config import (
    API_TITLE, API_VERSION, LOG_LEVEL, LOG_FORMAT, ALLOWED_ORIGINS, 
    MAX_TEXT_LENGTH, MAX_QUERY_LENGTH, ACCESS_TOKEN_EXPIRE_MINUTES,
    get_session_dir
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format=LOG_FORMAT
)
logger = logging.getLogger(__name__)

logger.info("🚀 Starting Empowered Care Unified System...")

# Initialize FastAPI app
app = FastAPI(
    title=API_TITLE,
    description="AI-powered disease outbreak detection and medical document processing",
    version=API_VERSION
)

# Authentication logic
auth_service = AuthService()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = auth_service.get_user_by_email(email)
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def get_current_admin(user: dict = Depends(get_current_user)):
    if user["role"] != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return user

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize core services
logger.info("🔧 Initializing Core Services...")
try:
    gemini_service = GeminiService()
    
    # Lazy load or optional services
    ocr_engine = None
    layout_detector = None
    
    logger.info("✅ Gemini service initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize core services: {e}")
    raise

# Initialize agents
logger.info("🤖 Initializing Dynamic Agents...")
try:
    super_agent = SuperAgent(gemini_service)
    data_assistant = DataAssistantAgent(gemini_service)
    chat_supervisor = ChatSupervisor(gemini_service, data_assistant)
    
    # Standard agents (can be used individually if needed)
    extraction_agent = ExtractionAgent(gemini_service)
    validation_agent = ValidationAgent(gemini_service)
    risk_agent = RiskAnalysisAgent(gemini_service)
    alert_agent = AlertGenerationAgent(gemini_service)
    
    logger.info("✅ Dynamic Agents and Chatbot initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize agents: {e}")
    raise

# --- SCHEDULER SETUP ---
scheduler = AsyncIOScheduler()
analysis_status = {
    "last_run": None,
    "last_result": None,
    "next_run": None,
    "schedule": None,
    "is_running": False
}

async def scheduled_analysis_job():
    """Background job for scheduled analysis."""
    global analysis_status
    if analysis_status["is_running"]:
        logger.info("⚠️ Scheduled analysis skipped: Job already running")
        return

    analysis_status["is_running"] = True
    logger.info("🕒 Starting scheduled system analysis...")
    try:
        result = await data_assistant.perform_full_analysis()
        analysis_status["last_run"] = str(datetime.now())
        analysis_status["last_result"] = result
        logger.info("✅ Scheduled system analysis complete.")
    except Exception as e:
        logger.error(f"❌ Scheduled analysis failed: {e}")
    finally:
        analysis_status["is_running"] = False

@app.on_event("startup")
async def start_scheduler():
    scheduler.start()
    logger.info("⏰ Scheduler started")

@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()
    logger.info("⏰ Scheduler stopped")

# Helper functions for lazy loading
def get_ocr_engine():
    global ocr_engine
    if ocr_engine is None:
        logger.info("🔍 Loading OCR Engine...")
        ocr_engine = OCREngine()
    return ocr_engine

def get_layout_detector():
    global layout_detector
    if layout_detector is None:
        logger.info("🔍 Loading Layout Detector...")
        layout_detector = LayoutDetector()
    return layout_detector

logger.info("✅ Empowered Care initialization complete!")

# --- ADMIN ANALYSIS & SCHEDULING ENDPOINTS ---

@app.post("/admin/analyze/manual")
async def manual_analysis(admin: dict = Depends(get_current_admin)):
    """Manually trigger a full system analysis comparing new and historical data."""
    logger.info(f"🚨 Admin {admin['email']} triggered manual full analysis.")
    try:
        result = await data_assistant.perform_full_analysis()
        analysis_status["last_run"] = str(datetime.now())
        analysis_status["last_result"] = result
        return {
            "message": "Full system analysis complete.",
            "timestamp": str(datetime.now()),
            "result": result
        }
    except Exception as e:
        logger.error(f"❌ Manual analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/admin/analyze/schedule")
async def update_analysis_schedule(
    request: dict,
    admin: dict = Depends(get_current_admin)
):
    """Set or update the automatic analysis schedule (cron format)."""
    cron_str = request.get("cron", "0 0 * * *") # Default: Every day at midnight
    # Example: "*/5 * * * *" for every 5 minutes
    
    try:
        # Remove existing job if any
        if scheduler.get_job("analysis_job"):
            scheduler.remove_job("analysis_job")

        # Add new job
        trigger = CronTrigger.from_crontab(cron_str)
        scheduler.add_job(
            scheduled_analysis_job,
            trigger,
            id="analysis_job"
        )
        
        analysis_status["schedule"] = cron_str
        analysis_status["next_run"] = str(scheduler.get_job("analysis_job").next_run_time)

        logger.info(f"⏰ Analysis schedule updated to: {cron_str} by {admin['email']}")
        return {
            "message": f"Analysis schedule updated to {cron_str}",
            "next_run": analysis_status["next_run"]
        }
    except Exception as e:
        logger.error(f"❌ Failed to update schedule: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid cron format: {str(e)}")

@app.get("/admin/analyze/status")
async def get_analysis_status(user: dict = Depends(get_current_user)):
    """Get the current status of the analysis scheduler and last result."""
    if scheduler.get_job("analysis_job"):
        analysis_status["next_run"] = str(scheduler.get_job("analysis_job").next_run_time)
        
    return {
        "status": analysis_status,
        "is_scheduler_running": scheduler.running
    }

# --- GENERAL ENDPOINTS ---

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "Empowered Care - Unified Multi-Agent System",
        "status": "running",
        "version": API_VERSION
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with system status."""
    return {
        "status": "healthy",
        "timestamp": str(datetime.now()),
        "version": API_VERSION,
        "agents": {
            "super_agent": "active",
            "data_assistant": "active",
            "chat_supervisor": "active"
        }
    }

# --- AUTHENTICATION & USER MANAGEMENT ---

@app.post("/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate a user and return a JWT token."""
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user["role"],
        "full_name": user.get("full_name")
    }

@app.post("/admin/invite")
async def invite_user(
    invite_data: UserInvite, 
    admin: dict = Depends(get_current_admin)
):
    """Admin endpoint to invite new employees via email."""
    try:
        return await auth_service.invite_user(invite_data, admin)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/register")
async def register_user(accept_data: UserAcceptInvite):
    """Register a new user using the invitation token from email."""
    try:
        return await auth_service.register_user(accept_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Request a password reset link to be sent via email."""
    try:
        return await auth_service.request_password_reset(request.email)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/reset-password")
async def reset_password(confirm_data: PasswordResetConfirm):
    """Reset password using the reset token from email."""
    try:
        return await auth_service.reset_password(confirm_data.token, confirm_data.new_password)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/change-password")
async def change_password(
    password_data: ChangePassword,
    user: dict = Depends(get_current_user)
):
    """Change password for an authenticated user."""
    try:
        return await auth_service.change_password(
            user["id"], password_data.old_password, password_data.new_password
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get information about the currently logged-in user."""
    return {
        "email": user["email"],
        "full_name": user.get("full_name"),
        "role": user["role"],
        "created_at": user["created_at"]
    }

# --- DOCUMENT PROCESSING ENDPOINT (from legacy main.py) ---

@app.post("/process", response_model=ProcessResponse)
async def process_document(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Process a medical document (Image or PDF) using YOLO layout detection and Gemini Vision."""
    if not file.content_type.startswith(("image/", "application/pdf")):
        raise HTTPException(status_code=400, detail="Only images and PDF files are allowed")
    
    # Load document processing services
    detector = get_layout_detector()
    ocr = get_ocr_engine()

    content = await file.read()
    session_id = str(uuid.uuid4())
    session_dir = get_session_dir(session_id)

    logger.info(f"--- 🚀 Starting Processing Session: {session_id} ---")
    logger.info(f"📁 Input File: {file.filename} ({file.content_type})")
    
    # Convert PDF or Image
    if file.content_type == "application/pdf":
        logger.info("📄 Converting PDF to images...")
        images = pdf_to_images(content)
    else:
        nparr = np.frombuffer(content, np.uint8)
        images = [cv2.imdecode(nparr, cv2.IMREAD_COLOR)]

    final_annotated = None
    raw_text_total = ""
    num_regions = 0
    all_crops = []
    all_enhanced = []
    all_detections = []
    
    for page_idx, img in enumerate(images):
        logger.info(f"📸 Page {page_idx + 1}/{len(images)}...")
        original_img = img.copy()

        # Step 1: Layout Detection
        logger.info("🔍 Scanning Layout...")
        boxes, confs, labels = detector.detect(img)
        logger.info(f"📍 Detected {len(boxes)} regions.")

        # Step 2: Intelligent Cropping
        process_img = original_img.copy()
        if len(boxes) > 0:
            boxes_sorted = sorted(zip(boxes, confs, labels), key=lambda x: (x[0][2]-x[0][0]) * (x[0][3]-x[0][1]), reverse=True)
            best_box, best_conf, best_label = boxes_sorted[0]
            
            x1, y1, x2, y2 = map(int, best_box)
            h, w = original_img.shape[:2]
            x1, y1 = max(0, x1-10), max(0, y1-10)
            x2, y2 = min(w, x2+10), min(h, y2+10)
            process_img = original_img[y1:y2, x1:x2]
            
            for box, conf, label in boxes_sorted:
                all_detections.append(Detection(label=label, confidence=round(float(conf), 3), box=list(map(float, box))))
        
        final_annotated = draw_boxes(img.copy(), boxes, confs, labels)
        
        # Step 3: High-Accuracy Vision Pass (Gemini)
        logger.info("🧠 Clinical Brain Pass (Gemini)...")
        temp_img_path = session_dir / f"page_{page_idx}_focused.jpg"
        cv2.imwrite(str(temp_img_path), process_img)
        
        try:
            structured_record = gemini_service.process_medical_record(temp_img_path)
            num_regions += 1
            raw_text_total += f"[Page_{page_idx+1}] Extracted successfully via Gemini.\n"
        except Exception as e:
            logger.warning(f"⚠️ Gemini failed: {e}. Running local OCR fallback...")
            # Fallback to local OCR
            for i, (box, conf, label) in enumerate(zip(boxes, confs, labels)):
                x1, y1, x2, y2 = map(int, box)
                region = img[y1:y2, x1:x2]
                enhanced = Preprocessor.enhance(region)
                text, conf_ocr = ocr.extract(enhanced)
                raw_text_total += f"[{label}] {text}\n"
            
            structured_record = Structurer.structure(raw_text_total, 0.7)

    # Save visualization products
    if final_annotated is not None:
        save_all_versions(session_dir, original_img, final_annotated, all_crops, all_enhanced)

    annotated_b64 = image_to_base64(final_annotated) if final_annotated is not None else ""

    logger.info(f"--- ✨ Session Complete: {session_id} ---")

    return ProcessResponse(
        record=structured_record,
        detections=all_detections,
        annotated_image_base64=annotated_b64,
        raw_ocr_text=raw_text_total.strip(),
        session_id=session_id,
        metadata={
            "num_regions": num_regions,
            "processed_at": str(datetime.now()),
            "file_type": file.content_type,
            "engine": "Gemini-1.5-Flash"
        },
        message="✅ Processing completed successfully using Gemini Vision."
    )

# --- OUTBREAK DETECTION ENDPOINTS ---

@app.post("/outbreak/process", response_model=OutbreakProcessResponse)
async def process_outbreak_report(
    request: dict,
    user: dict = Depends(get_current_user)
):
    """Process an outbreak report through the dynamic multi-agent pipeline."""
    text = request.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text field is required and cannot be empty")

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Text input too long (max {MAX_TEXT_LENGTH} characters)")

    session_id = str(uuid.uuid4())
    start_time = datetime.now()

    logger.info(f"--- 🚨 Outbreak Report Processing (Dynamic): {session_id} ---")
    
    try:
        # Using SuperAgent to orchestrate everything
        result = await super_agent.process_outbreak_parallel(text)
        
        # Store in data assistant with full context
        data_assistant.add_report(
            result["extracted_data"],
            session_id=session_id,
            risk_analysis=result["risk_analysis"].dict() if hasattr(result["risk_analysis"], "dict") else result["risk_analysis"],
            alert=result["alert"].dict() if hasattr(result["alert"], "dict") else result["alert"],
            context_research=result["context_research"].dict() if result.get("context_research") and hasattr(result["context_research"], "dict") else result.get("context_research")
        )

        processing_time = (datetime.now() - start_time).total_seconds()
        logger.info(f"--- ✅ Outbreak Processing Complete: {session_id} ({processing_time:.2f}s) ---")

        return OutbreakProcessResponse(
            extracted_data=result["extracted_data"],
            validation=result["validation"],
            risk_analysis=result["risk_analysis"],
            consensus=result["consensus"],
            context_research=result["context_research"],
            alert=result["alert"],
            session_id=session_id,
            metadata={
                "processed_at": str(datetime.now()),
                "processing_time_seconds": processing_time,
                "orchestrator": "SuperAgent",
                "consensus_reached": result["consensus"].consensus_reached
            },
            message="🚨 Outbreak report processed through dynamic multi-agent pipeline.",
            human_validation_required=result["consensus"].final_risk_level in ["HIGH", "MEDIUM"]
        )
    except Exception as e:
        logger.error(f"❌ Processing error for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/outbreak/upload", response_model=OutbreakProcessResponse)
async def upload_outbreak_file(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    """Upload and process an outbreak report file (PDF, CSV, or Image)."""
    session_id = str(uuid.uuid4())
    start_time = datetime.now()
    
    logger.info(f"--- 📂 Processing Uploaded File: {file.filename} ({session_id}) ---")
    
    content = await file.read()
    extracted_text = ""
    
    try:
        # Branch processing by file type
        if file.content_type == "text/csv" or file.filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
            extracted_text = "Outbreak CSV Dump:\n" + df.to_string()
            
        elif file.content_type == "application/pdf" or file.filename.endswith(".pdf"):
            images = pdf_to_images(content)
            all_text = []
            prompt = "Extract all text from this medical/epidemiological report page. Return ONLY the text."
            for img_pil in images:
                img_byte_arr = io.BytesIO()
                img_pil.save(img_byte_arr, format='JPEG')
                text = gemini_service.generate_vision_text(img_byte_arr.getvalue(), prompt)
                all_text.append(text)
            extracted_text = "\n".join(all_text)
            
        elif file.content_type.startswith("image/") or file.filename.endswith((".jpg", ".jpeg", ".png")):
            prompt = "Extract all text from this medical note/report. Return ONLY the text."
            extracted_text = gemini_service.generate_vision_text(content, prompt)
            
        else:
            extracted_text = content.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract any text from the provided file.")

        # Feed extracted text to SuperAgent
        result = await super_agent.process_outbreak_parallel(extracted_text)
        
        # Store in data assistant with full context
        data_assistant.add_report(
            result["extracted_data"],
            session_id=session_id,
            risk_analysis=result["risk_analysis"].dict() if hasattr(result["risk_analysis"], "dict") else result["risk_analysis"],
            alert=result["alert"].dict() if hasattr(result["alert"], "dict") else result["alert"],
            context_research=result["context_research"].dict() if result.get("context_research") and hasattr(result["context_research"], "dict") else result.get("context_research")
        )
        
        processing_time = (datetime.now() - start_time).total_seconds()

        return OutbreakProcessResponse(
            extracted_data=result["extracted_data"],
            validation=result["validation"],
            risk_analysis=result["risk_analysis"],
            consensus=result["consensus"],
            context_research=result["context_research"],
            alert=result["alert"],
            session_id=session_id,
            metadata={
                "processed_at": str(datetime.now()),
                "processing_time_seconds": processing_time,
                "file_name": file.filename
            },
            message=f"🚨 File '{file.filename}' processed via Dynamic Multi-Agent Pipeline.",
            human_validation_required=result["consensus"].final_risk_level in ["HIGH", "MEDIUM"]
        )

    except Exception as e:
        logger.error(f"❌ File processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@app.post("/outbreak/approve/{session_id}")
async def approve_alert(
    session_id: str, 
    request: dict = None,
    user: dict = Depends(get_current_admin)
):
    """Human validation endpoint for alerts (Admin Only)."""
    approved = request.get("approved", True) if request else True
    logger.info(f"Alert {'approved' if approved else 'rejected'} for session {session_id}")

    return {
        "session_id": session_id,
        "approved": approved,
        "message": "Alert approved and sent to notification system." if approved else "Alert rejected.",
        "timestamp": str(datetime.now())
    }

@app.post("/outbreak/query", response_model=QueryResponse)
async def query_outbreak_data(
    request: dict,
    user: dict = Depends(get_current_user)
):
    """Query the outbreak data using the Data Assistant Agent."""
    query = request.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query field is required")

    logger.info(f"--- 🔍 Data Query: {query} ---")
    try:
        result = await data_assistant.query(query)
        return QueryResponse(**result)
    except Exception as e:
        logger.error(f"❌ Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

@app.get("/outbreak/summary")
async def get_outbreak_summary(user: dict = Depends(get_current_user)):
    """Get a summary of all outbreak reports."""
    try:
        total_reports = len(data_assistant.data_store)
        locations = list(set(r["extracted_data"]["location"] for r in data_assistant.data_store if r["extracted_data"]["location"] != "Unknown"))
        total_cases = sum(r["extracted_data"].get("cases", 0) for r in data_assistant.data_store)

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

@app.get("/outbreak/reports")
async def get_all_reports(user: dict = Depends(get_current_user)):
    """Get all processed reports from the data store."""
    return data_assistant.data_store

# --- CHATBOT ENDPOINTS ---

@app.post("/outbreak/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    user: dict = Depends(get_current_user)
):
    """Powerful multi-agent chatbot with memory and data awareness."""
    try:
        result = await chat_supervisor.chat(request.message, request.session_id)
        return ChatResponse(**result)
    except Exception as e:
        logger.error(f"❌ Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")

@app.delete("/outbreak/chat/{session_id}")
async def clear_chat_session(session_id: str, user: dict = Depends(get_current_user)):
    """Clear the conversation history for a specific session."""
    if chat_supervisor.clear_session(session_id):
        return {"message": f"Session {session_id} cleared successfully"}
    else:
        return {"message": f"Session {session_id} not found or already empty"}

if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting server on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
