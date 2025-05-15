from fastapi import UploadFile, File, Form, HTTPException, Depends
from typing import Optional
from PIL import Image
import io
import fitz  # PyMuPDF
import pytesseract

# Utility: Extract text and OCR text from PDF
def extract_text_and_images_from_pdf(content: bytes):
    doc = fitz.open(stream=content, filetype="pdf")
    full_text = []
    ocr_text = []

    for page in doc:
        full_text.append(page.get_text())
        for img in page.get_images(full=True):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image)
            if text.strip():
                ocr_text.append(text)

    return "\n".join(full_text).strip(), "\n".join(ocr_text).strip()

# Utility: Extract OCR from images
def extract_text_from_image(content: bytes):
    image = Image.open(io.BytesIO(content))
    return pytesseract.image_to_string(image).strip()

