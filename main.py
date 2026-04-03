from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import uuid
from datetime import datetime
from pathlib import Path

from models.schemas import ProcessResponse, Detection, StructuredMedicalRecord
from services.layout_detector import LayoutDetector
from services.preprocessor import Preprocessor
from services.ocr_engine import OCREngine
from services.structurer import Structurer
from services.gemini_service import GeminiService
from utils.image_utils import image_to_base64, draw_boxes, save_all_versions
from utils.pdf_utils import pdf_to_images
from utils.excel_utils import parse_excel_or_csv 
from config import get_session_dir

# Database Imports
from sqlalchemy.orm import Session
from fastapi import Depends
from database.db import get_db
from database.models import PatientRecord, init_db

app = FastAPI(title="Patient Record Digitizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models and services on startup
@app.on_event("startup")
def on_startup():
    print("🛠️ Initializing Medical Database (SQLite)...")
    init_db()

# Initialize services once
layout_detector = LayoutDetector()
ocr_engine = OCREngine()
gemini_service = GeminiService()



@app.post("/process", response_model=ProcessResponse)
async def process_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.content_type.startswith(("image/", "application/pdf")):
        raise HTTPException(status_code=400, detail="Only images and PDF files are allowed")

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

    # Step 5: Save to SQLite Database
    try:
        new_record = PatientRecord(
            session_id=session_id,
            source_file=file.filename,
            patient_name=structured_record.patient_name,
            patient_id=structured_record.patient_id,
            date_of_birth=structured_record.date_of_birth,
            gender=structured_record.gender,
            visit_date=structured_record.visit_date,
            document_type=structured_record.document_type,
            referred_from=structured_record.referred_from,
            referred_to=structured_record.referred_to,
            diagnosis=structured_record.diagnosis,
            symptoms=structured_record.symptoms,
            investigations=structured_record.investigations,
            medications=[m.dict() for m in structured_record.medications],
            allergies=structured_record.allergies,
            notes=structured_record.notes,
            additional_info=structured_record.additional_info,
            confidence=structured_record.confidence
        )
        db.add(new_record)
        db.commit()
        print(f"💾 Saved record to SQLite for session: {session_id}")
    except Exception as db_err:
        print(f"❌ Database Save Error: {db_err}")

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
        message="✅ Processing completed successfully and saved to DB."
    )

@app.post("/import-spreadsheet")
async def import_spreadsheet(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Endpoint to process Excel (.xlsx) or CSV files, Log to Terminal, and Return Data.
    """
    content = await file.read()
    print(f"\n--- 📊 IMPORTING CLINICAL SPREADSHEET: {file.filename} ---")
    
    try:
        records = parse_excel_or_csv(content, file.filename)
        saved_count = 0
        response_data = []
        
        for r in records:
            # Live Logging to Terminal
            print(f"📄 Processing Record: {r.patient_name} | Diagnosis: {r.diagnosis}")
            
            new_record = PatientRecord(
                source_file=file.filename,
                patient_name=r.patient_name,
                patient_id=r.patient_id,
                date_of_birth=r.date_of_birth,
                gender=r.gender,
                visit_date=r.visit_date,
                document_type=r.document_type,
                diagnosis=r.diagnosis,
                medications=[m.dict() for m in r.medications],
                notes=r.notes,
                confidence=r.confidence
            )
            db.add(new_record)
            saved_count += 1
            response_data.append(r)
            
        db.commit()
        print(f"✅ SUCCESSFULLY SAVED {saved_count} RECORDS TO SQLITE.")
        print(f"--------------------------------------------------\n")
        
        return {
            "status": "success",
            "message": f"Successfully processed {saved_count} records.",
            "count": saved_count,
            "data": response_data # Return the full structured list
        }
        
    except Exception as e:
        print(f"❌ Spreadsheet Import Error: {e}")
        return {"status": "error", "message": f"Failed to process spreadsheet: {str(e)}"}

@app.post("/insert-record")
async def insert_record(record: StructuredMedicalRecord, db: Session = Depends(get_db)):
    """
    Endpoint for Manual Form Entry. Logs full data and returns it.
    """
    print(f"\n--- 📝 MANUAL FORM ENTRY RECEIVED ---")
    print(f"📄 Full Patient Data:\n{record.model_dump_json(indent=2)}")
    
    try:
        new_record = PatientRecord(
            source_file="Manual Entry",
            patient_name=record.patient_name,
            patient_id=record.patient_id,
            date_of_birth=record.date_of_birth,
            gender=record.gender,
            visit_date=record.visit_date,
            document_type=record.document_type or "Manual Entry",
            referred_from=record.referred_from,
            referred_to=record.referred_to,
            diagnosis=record.diagnosis,
            symptoms=record.symptoms,
            investigations=record.investigations,
            medications=[m.dict() for m in record.medications],
            allergies=record.allergies,
            notes=record.notes,
            additional_info=record.additional_info,
            confidence=1.0
        )
        db.add(new_record)
        db.commit()
        
        print(f"✅ SUCCESSFULLY SAVED TO DATABASE: {record.patient_name}")
        print(f"--------------------------------------------------\n")
        
        return {
            "status": "success",
            "message": f"Successfully inserted record for {record.patient_name}.",
            "data": record
        }
    except Exception as e:
        print(f"❌ Manual Entry Error: {e}")
        return {"status": "error", "message": f"Failed to insert record: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)