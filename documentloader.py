import os
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    UnstructuredFileLoader,
)
from langchain_core.documents import Document
from image_extractor import extract_and_store_images
from splitter_vectorstore import split_documents, build_vectorstore
#from loadandvectorstoredocs import process_subject
# OCR dependencies
from pdf2image import convert_from_path
import pytesseract

# Optional: manually set Tesseract path if not in PATH
# pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def extract_text_with_ocr(pdf_path):
    try:
        images = convert_from_path(pdf_path)
        page_texts = []

        for image in images:
            text = pytesseract.image_to_string(image)
            page_texts.append(text.strip())

        return page_texts  # Return list of page-level strings
    except Exception as e:
        print(f"❌ OCR failed for {pdf_path}: {e}")
        return []

def load_documents(year, semester, subject):
    base_path = f"./data/year_{year}/sem_{semester}/subject_{subject}"
    documents = []

    for filename in os.listdir(base_path):
        file_path = os.path.join(base_path, filename)

        try:
            if filename.endswith(".pdf"):
                loader = PyPDFLoader(file_path)
                docs = list(loader.lazy_load())

                # Add page numbers to metadata
                for i, doc in enumerate(docs):
                    doc.metadata["page"] = i + 1
                    doc.metadata["source"] = file_path

                if not docs or all(not doc.page_content.strip() for doc in docs):
                    print(f"🔍 OCR fallback for: {filename}")
                    ocr_pages = extract_text_with_ocr(file_path)

                    if any(ocr_pages):
                        for i, text in enumerate(ocr_pages):
                            documents.append(Document(
                                page_content=text,
                                metadata={"source": file_path, "page": i + 1}
                            ))
                    else:
                        print(f"⚠️ OCR failed to extract content: {filename}")
                else:
                    documents.extend(docs)

                # ✅ Extract and store images in MongoDB
                extract_and_store_images(
                    pdf_path=file_path,
                    subject=subject,
                    year=year,
                    semester=semester
                )

            elif filename.endswith(".txt"):
                loader = TextLoader(file_path)
                docs = list(loader.lazy_load())
                documents.extend(docs)

            elif filename.endswith((".docx", ".pptx")):
                loader = UnstructuredFileLoader(file_path)
                docs = list(loader.lazy_load())
                documents.extend(docs)

            else:
                print(f"⚠️ Unsupported file type: {filename}")

        except Exception as e:
            print(f"❌ Error loading {filename}: {e}")

    return documents

year = "3"
semester = "1"
subject = "microprocessor"
def process_subject(subject):
    print(f"\n📚 Processing subject: {subject}")
    
    # Load documents
    docs = load_documents(year=year, semester=semester, subject=subject)
    print(f"\n Total loaded documents for {subject}: {len(docs)}")
    
    # Print preview of first 2 loaded documents
    for i, doc in enumerate(docs[:2]):
        print(f"\n--- Document {i + 1} ---")
        print("Content Preview:")
        print(doc.page_content[:500])
        print("\nMetadata:")
        print(doc.metadata)

    # Split into chunks
    chunks = split_documents(docs)
    print(f"✅ Total Chunks for {subject}: {len(chunks)}")

    # Build vector store and persist
    persist_path = f"vectorstores/{subject}_{year}_{semester}"
    vectorstore = build_vectorstore(chunks, persist_path=persist_path)
    print(f"✅ Created vectorstore at {persist_path}")

    # Optional: Query test
    retriever = vectorstore.as_retriever()
    results = retriever.get_relevant_documents(f"Explain key concepts in {subject}")

    print(f"\nSample query results for {subject}:")
    for i, doc in enumerate(results[:2]):
        print(f"\nResult {i+1}:")
        print(doc.page_content[:300])
        print("Metadata:", doc.metadata)


process_subject(subject=subject)
