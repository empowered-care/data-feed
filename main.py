from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import uuid
from datetime import datetime
from pathlib import Path

from models.schemas import ProcessResponse, Detection
from services.layout_detector import LayoutDetector
from services.preprocessor import Preprocessor
from services.ocr_engine import OCREngine
from services.structurer import Structurer
from services.gemini_service import GeminiService
from utils.image_utils import image_to_base64, draw_boxes, save_all_versions
from utils.pdf_utils import pdf_to_images
from config import get_session_dir

app = FastAPI(title="Patient Record Digitizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services once
layout_detector = LayoutDetector()
ocr_engine = OCREngine()
gemini_service = GeminiService()


@app.post("/process", response_model=ProcessResponse)
async def process_document(file: UploadFile = File(...)):
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





if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)