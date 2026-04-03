from pdf2image import convert_from_bytes
import cv2
import numpy as np

def pdf_to_images(pdf_bytes: bytes) -> list:
    from PIL import Image
    images = convert_from_bytes(pdf_bytes)
    return [cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR) for img in images]