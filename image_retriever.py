from pymongo import MongoClient
from collections import defaultdict

client = MongoClient("mongodb://localhost:27017/")
db = client["ju_ece_chatbot"]
image_collection = db["pdf_images"]

def get_images_by_doc_and_pages(document_name, page_numbers):
    query = {
        "document": document_name,
        "page": {"$in": page_numbers}
    }

    results = list(image_collection.find(query))

    # Group by page number
    grouped = defaultdict(list)
    for img in results:
        grouped[img["page"]].append(img)

    final_images = []
    for page, images in grouped.items():
        selected_images = images[:3]  # Take up to first 3 images
        for img in selected_images:
            final_images.append({
                "image_url": img["image_url"],
                "page": img["page"],
                "filename": img["filename"],
                "document": img["document"]
            })

    return final_images
