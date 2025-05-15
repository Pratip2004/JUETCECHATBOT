import cloudinary
import cloudinary.uploader
from PIL import Image
import base64
import io
import fitz  # PyMuPDF
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

# Cloudinary config
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["ju_ece_chatbot"]
image_collection = db["pdf_images"]

def extract_and_store_images(pdf_path, subject, year, semester):
    doc = fitz.open(pdf_path)
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # Get page dimensions
        zoom = 2  # Increase resolution
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat)
        
        # Convert to PIL Image
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        
        # Create a BytesIO object for the image
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            img_byte_arr,
            resource_type="image",
            format="png"
        )
        image_url = upload_result["secure_url"]

        filename = f"{subject}_{year}_{semester}_page_{page_num+1}.png"
        
        image_doc = {
            "subject": subject,
            "year": year,
            "semester": semester,
            "page": page_num + 1,
            "filename": filename,
            "document": os.path.basename(pdf_path),
            "image_url": image_url
        }
        image_collection.insert_one(image_doc)

        print(f"✅ Uploaded and stored page {page_num + 1}: {filename} -> {image_url}")

    doc.close()
