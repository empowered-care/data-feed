from pdf2image import convert_from_bytes
import cv2
import numpy as np

def pdf_to_images(pdf_bytes: bytes) -> list:
    """Converts PDF bytes into a list of OpenCV-compatible NumPy images (BGR)."""
    try:
        from PIL import Image
        import subprocess
        # Pre-check poppler
        try:
            subprocess.run(["pdftoppm", "-v"], capture_output=True, check=True)
        except Exception:
            print("❌ 'pdftoppm' not found. Please install poppler-utils (apt install poppler-utils).")
            return []

        images = convert_from_bytes(pdf_bytes)
        if not images:
            print("⚠️ pdf2image returned no images from the provided bytes.")
            return []
            
        return [cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR) for img in images]
    except Exception as e:
        print(f"❌ PDF to Image conversion failed: {e}")
        import traceback
        traceback.print_exc()
        return []