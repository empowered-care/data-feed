import cv2
import base64
import numpy as np
from pathlib import Path
from datetime import datetime

def image_to_base64(img: np.ndarray) -> str:
    # Use JPEG with quality 70 to significantly reduce base64 string length
    _, buffer = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
    return base64.b64encode(buffer).decode("utf-8")


def draw_boxes(img: np.ndarray, boxes: list, confidences: list, labels: list) -> np.ndarray:
    for box, conf, label in zip(boxes, confidences, labels):
        x1, y1, x2, y2 = map(int, box)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 3)
        cv2.putText(img, f"{label}: {conf:.2f}", (x1, y1-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
    return img


def save_image(img: np.ndarray, path: Path):
    cv2.imwrite(str(path), img)

def save_all_versions(session_dir: Path, original: np.ndarray, annotated: np.ndarray, 
                     crops: list, enhanced: list):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    save_image(original, session_dir / f"{timestamp}_01_original.jpg")
    save_image(annotated, session_dir / f"{timestamp}_02_annotated.jpg")
    
    for i, crop in enumerate(crops):
        save_image(crop, session_dir / f"{timestamp}_03_crop_{i+1:02d}.jpg")
    
    for i, enh in enumerate(enhanced):
        save_image(enh, session_dir / f"{timestamp}_04_enhanced_{i+1:02d}.jpg")
    
    print(f"✅ All images saved successfully in: {session_dir}")