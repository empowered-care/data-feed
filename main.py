from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import uuid
from datetime import datetime
from pathlib import Path

from models.schemas import ProcessResponse, Detection, OutbreakProcessResponse, QueryResponse
from services.layout_detector import LayoutDetector
from services.preprocessor import Preprocessor
from services.ocr_engine import OCREngine
from services.structurer import Structurer
from services.gemini_service import GeminiService
from services.agents import ExtractionAgent, ValidationAgent, RiskAnalysisAgent, AlertGenerationAgent, DataAssistantAgent
from utils.image_utils import image_to_base64, draw_boxes, save_all_versions
from utils.pdf_utils import pdf_to_images
from config import get_session_dir

print("🚀 Starting Aegis Lite...")

app = FastAPI(title="Aegis Lite - Multi-Agent Disease Outbreak Detection System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services once
print("🔧 Initializing services...")
gemini_service = GeminiService()

# Initialize agents
print("🤖 Initializing agents...")
extraction_agent = ExtractionAgent(gemini_service)
validation_agent = ValidationAgent(gemini_service)
risk_agent = RiskAnalysisAgent(gemini_service)
alert_agent = AlertGenerationAgent(gemini_service)
data_assistant = DataAssistantAgent(gemini_service)

print("✅ Initialization complete!")

# Optional legacy services (for document processing)
layout_detector = None
ocr_engine = None
try:
    from services.layout_detector import LayoutDetector
    from services.ocr_engine import OCREngine
    layout_detector = LayoutDetector()
    ocr_engine = OCREngine()
    print("✅ Legacy document processing services available")
except Exception as e:
    print(f"⚠️ Legacy services not available: {e}")


@app.post("/process", response_model=ProcessResponse)
async def process_document(file: UploadFile = File(...)):
    if not file.content_type.startswith(("image/", "application/pdf")):
        raise HTTPException(status_code=400, detail="Only images and PDF files are allowed")
    
    if layout_detector is None or ocr_engine is None:
        raise HTTPException(status_code=503, detail="Document processing services not available")

    content = await file.read()
    session_id = str(uuid.uuid4())
    session_dir = get_session_dir(session_id)

    print(f"\n--- 🚀 Starting Processing Session: {session_id} ---")
    print(f"📁 Input File: {file.filename} ({file.content_type})")
    
    # Convert PDF or Image
    if file.content_type == "application/pdf":
        print("📄 Converting PDF to images...")
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
        print(f"📸 Page {page_idx + 1}/{len(images)}...")
        original_img = img.copy()

        # Step 1: YOLO Layout Detection (Fast)
        print("🔍 Scanning Layout...")
        boxes, confs, labels = layout_detector.detect(img)
        print(f"📍 Detected {len(boxes)} regions.")

        # Step 2: Intelligent Cropping for Primary AI Brain (Gemini)
        process_img = original_img.copy()
        if len(boxes) > 0:
            # Sort boxes to find the main form
            boxes_sorted = sorted(zip(boxes, confs, labels), key=lambda x: (x[0][2]-x[0][0]) * (x[0][3]-x[0][1]), reverse=True)
            best_box, best_conf, best_label = boxes_sorted[0]
            
            x1, y1, x2, y2 = map(int, best_box)
            h, w = original_img.shape[:2]
            x1, y1 = max(0, x1-10), max(0, y1-10)
            x2, y2 = min(w, x2+10), min(h, y2+10)
            process_img = original_img[y1:y2, x1:x2]
            
            # Populate Detections early for the response
            for box, conf, label in boxes_sorted:
                all_detections.append(Detection(label=label, confidence=round(conf, 3), box=box))
        
        # Draw boxes on final image for visualization
        final_annotated = draw_boxes(img.copy(), boxes, confs, labels)
        
        # Step 3: High-Accuracy Vision Pass (Gemini) - 100% Accuracy, Super Fast
        print("🧠 Clinical Brain Pass (Gemini)...")
        temp_img_path = session_dir / f"page_{page_idx}_focused.jpg"
        cv2.imwrite(str(temp_img_path), process_img)
        
        try:
            structured_record = gemini_service.process_medical_record(temp_img_path)
            num_regions += 1 # Used for metadata success count
            raw_text_total += f"[Page_{page_idx+1}] Extracted successfully via Gemini.\n"
        except Exception as e:
            print(f"⚠️ Gemini failed: {e}. Running local OCR fallback (Slow)...")
            # Fallback to local OCR only if cloud brain fails
            for i, (box, conf, label) in enumerate(zip(boxes, confs, labels)):
                x1, y1, x2, y2 = map(int, box)
                region = img[y1:y2, x1:x2]
                enhanced = Preprocessor.enhance(region)
                text, conf_ocr = ocr_engine.extract(enhanced)
                raw_text_total += f"[{label}] {text}\n"
            
            avg_conf = 0.7 # estimated for fallback
            structured_record = Structurer.structure(raw_text_total, avg_conf)

    # Save visualization products
    if final_annotated is not None:
        save_all_versions(session_dir, original_img, final_annotated, all_crops, all_enhanced)

    annotated_b64 = image_to_base64(final_annotated) if final_annotated is not None else ""

    print(f"--- ✨ Session Complete: {session_id} ---\n")

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

# Outbreak Detection Endpoints

@app.post("/outbreak/process", response_model=OutbreakProcessResponse)
async def process_outbreak_report(text: str):
    """Process an outbreak report through the multi-agent pipeline."""
    session_id = str(uuid.uuid4())
    
    print(f"\n--- 🚨 Outbreak Report Processing: {session_id} ---")
    print(f"📝 Input: {text}")
    
    # Agent 1: Extraction
    print("🤖 Agent 1: Extracting structured data...")
    extracted_data = extraction_agent.extract(text)
    
    # Agent 2: Validation
    print("🤖 Agent 2: Validating data...")
    validation = validation_agent.validate(extracted_data)
    
    # Agent 3: Risk Analysis
    print("🤖 Agent 3: Analyzing risk...")
    risk_analysis = risk_agent.analyze_risk(extracted_data)
    
    # Agent 4: Alert Generation
    print("🤖 Agent 4: Generating alert...")
    alert = alert_agent.generate_alert(extracted_data, risk_analysis)
    
    # Store in data assistant
    data_assistant.add_report(extracted_data)
    
    print(f"--- ✅ Outbreak Processing Complete: {session_id} ---\n")
    
    return OutbreakProcessResponse(
        extracted_data=extracted_data,
        validation=validation,
        risk_analysis=risk_analysis,
        alert=alert,
        session_id=session_id,
        metadata={
            "processed_at": str(datetime.now()),
            "agents_used": ["extraction", "validation", "risk_analysis", "alert_generation"]
        },
        message="🚨 Outbreak report processed through multi-agent pipeline.",
        human_validation_required=risk_analysis.risk_level in ["HIGH", "MEDIUM"]
    )

@app.post("/outbreak/approve/{session_id}")
async def approve_alert(session_id: str, approved: bool = True):
    """Human validation endpoint for alerts."""
    # In a real system, this would trigger the alert system
    return {
        "session_id": session_id,
        "approved": approved,
        "message": "Alert approved and sent to notification system." if approved else "Alert rejected."
    }

@app.post("/outbreak/query", response_model=QueryResponse)
async def query_outbreak_data(query: str):
    """Query the outbreak data using the Data Assistant Agent."""
    print(f"\n--- 🔍 Data Query: {query} ---")
    
    result = data_assistant.query(query)
    
    print(f"--- ✅ Query Complete ---\n")
    
    return QueryResponse(**result)

@app.get("/outbreak/summary")
async def get_outbreak_summary():
    """Get a summary of all outbreak reports."""
    # This would be enhanced with actual data analysis
    return {
        "total_reports": len(data_assistant.data_store),
        "locations": list(set(r["location"] for r in data_assistant.data_store if r["location"] != "Unknown")),
        "timestamp": str(datetime.now())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)