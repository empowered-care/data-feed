from paddleocr import PaddleOCR
import cv2
import numpy as np

class OCREngine:
    def __init__(self):
        self.ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)

    def extract(self, image):
        # Internal OCR-specific preprocessing: Scaling for better detection
        h, w = image.shape[:2]
        if w < 1000:
            scale = 1000 / w
            image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
            
        # Grayscale and Contrast Enhancement (CLAHE)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        enhanced = clahe.apply(gray)
        
        # Brightness and Contrast adjustment (Mental health for PaddleOCR)
        alpha = 1.3 # Contrast control
        beta = 10   # Brightness control
        adjusted = cv2.convertScaleAbs(enhanced, alpha=alpha, beta=beta)
        
        # Laplacian Sharpening (Helps with faint handwriting)
        laplacian = cv2.Laplacian(adjusted, cv2.CV_64F)
        sharpened = np.uint8(np.clip(adjusted - 0.5 * laplacian, 0, 255))
        
        # Convert back to BGR for PaddleOCR input
        processed_image = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)
        
        result = self.ocr.ocr(processed_image, cls=True)


        if not result or not result[0]:
            return "", 0.0
        text_lines = []
        confidences = []
        for line in result[0]:
            text_lines.append(line[1][0])
            confidences.append(float(line[1][1]))
        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0
        return "\n".join(text_lines), avg_conf