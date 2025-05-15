from documentloader import load_documents
from splitter_vectorstore import split_documents, build_vectorstore
import os

# List of all subjects in 3rd year, 1st semester
subjects = [
    "Analog_CMOS",
    "microprocessor",
    "COA",
    "Control_Systems",
    "Digital_Communication",
    "antena"
]

year = "3"
semester = "1"

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

def main():
    print("🚀 Starting document processing for all subjects...")
    
    # Create vectorstores directory if it doesn't exist
    os.makedirs("vectorstores", exist_ok=True)
    
    # Process each subject
    for subject in subjects:
        try:
            print(f"\n{'='*50}")
            print(f"Processing {subject}")
            print(f"{'='*50}")
            process_subject(subject)
            print(f"✅ Successfully processed {subject}")
        except Exception as e:
            print(f"❌ Error processing {subject}: {str(e)}")
    
    print("\n✨ All subjects processing completed!")

if __name__ == "__main__":
    main()
