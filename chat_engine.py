from memory_handler import get_memory
from query_optimizer import optimize_query
from image_retriever import get_images_by_doc_and_pages
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from sentence_transformers import CrossEncoder
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from pathlib import Path
from dotenv import load_dotenv
import os
import tiktoken

load_dotenv()

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.5,
    max_tokens=600,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

prompt_template = PromptTemplate.from_template("""
You are an expert university-level electronics teaching assistant.

Your task is to answer the student's question using only the provided textbook excerpts. Be clear, precise, and academically accurate.

======================
PREVIOUS CHAT:
{chat_history}
======================

----------------------
CONTEXT EXCERPTS:
{context}
----------------------

STUDENT QUESTION:
{question}

GUIDELINES:
- Only answer using the information provided in the context above.
- If the context does not mention something, respond with "I don't know based on the given context."
- Structure your response using relevant headers **only if they are supported by the content**. Possible headers include:
    • Description  
    • Derivation  
    • Formula  
    • Example  
    • Application  
    • Key Points  
    • Important Notes  
    • Code (if applicable)  
- ⚠️ **Regardless of the content, your answer must always end with a proper "Conclusion" or "Summary" section that summarizes the answer clearly.**
- Avoid including unsupported information.
- Maintain an academic yet easy-to-understand tone.

FINAL ANSWER:
""")

answer_chain = prompt_template | llm | StrOutputParser()

encoding = tiktoken.get_encoding("cl100k_base")
def count_tokens(text: str) -> int:
    return len(encoding.encode(text))

## Loading VectorStores

def load_vectorstore(subject: str, semester: str, year: str):
    vectorstore_path = Path(f"vectorstores/{subject}_{year}_{semester}").resolve()
    if not vectorstore_path.exists():
        raise ValueError(f"Vectorstore for {subject} Semester {semester}, Year {year} not found.")
    return FAISS.load_local(vectorstore_path, embeddings=embedding_model, allow_dangerous_deserialization=True)

def get_token_limits(question: str) -> tuple[int, int]:
    # Keywords indicating brief/short responses
    brief_keywords = ['brief', 'short', 'summarize', 'quick', 'concise', 'overview', 'gist', 'main points']
    # Keywords indicating detailed responses
    detailed_keywords = ['detailed', 'explain', 'elaborate', 'comprehensive', 'thorough', 'in-depth', 'complete', 'full']
    
    question_lower = question.lower()
    
    # Check for brief response keywords
    if any(keyword in question_lower for keyword in brief_keywords):
        return 600, 300  # Reduced context and output tokens for brief responses
    
    # Check for detailed response keywords
    if any(keyword in question_lower for keyword in detailed_keywords):
        return 1000, 600  # Increased context and output tokens for detailed responses
    
    # Default values
    return 800, 500

def get_prompt_template(is_brief: bool) -> str:
    if is_brief:
        return """
You are an expert university-level electronics teaching assistant.

Your task is to provide a concise answer to the student's question using only the provided textbook excerpts.

======================
PREVIOUS CHAT:
{chat_history}
======================

----------------------
CONTEXT EXCERPTS:
{context}
----------------------

STUDENT QUESTION:
{question}

GUIDELINES:
- Provide a brief, focused answer using only the context above.
- If the context doesn't contain the information, respond with "I don't know based on the given context."
- Structure your response with only the most relevant headers:
    • Key Points
    • Brief Explanation
    • Summary
- Keep the response concise and to the point.
- End with a brief summary.

FINAL ANSWER:
"""
    else:
        return """
You are an expert university-level electronics teaching assistant.

Your task is to provide a comprehensive answer to the student's question using the provided textbook excerpts.

======================
PREVIOUS CHAT:
{chat_history}
======================

----------------------
CONTEXT EXCERPTS:
{context}
----------------------

STUDENT QUESTION:
{question}

GUIDELINES:
- Provide a detailed answer using only the information provided in the context above.
- If the context does not mention something, respond with "I don't know based on the given context."
- Structure your response using relevant headers:
    • Description  
    • Derivation  
    • Formula  
    • Example  
    • Application  
    • Key Points  
    • Important Notes  
    • Code (if applicable)  
- Include mathematical expressions and formulas where relevant.
- Provide detailed examples and applications.
- End with a comprehensive conclusion.

FINAL ANSWER:
"""

def get_chat_response(username: str, question: str, session_id: str, year: str, semester: str, subject: str):
    memory = get_memory(username, session_id, year, semester, subject)
    chat_history = memory.load_memory_variables({}).get("history", [])
    chat_history_str = "\n".join([f"{msg.type.upper()}: {msg.content}" for msg in chat_history])

    chat_tokens = count_tokens(chat_history_str)
    max_chat_tokens = 400
    if chat_tokens > max_chat_tokens:
        trimmed_history = chat_history[-5:]
        chat_history_str = "\n".join([f"{msg.type.upper()}: {msg.content}" for msg in trimmed_history])

    optimized_query = optimize_query(question, chat_history_str)
    
    # Get dynamic token limits based on the question
    max_context_tokens, max_output_tokens = get_token_limits(question)
    
    # Update LLM configuration with dynamic token limit
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.5,
        max_tokens=max_output_tokens,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Get appropriate prompt template
    is_brief = any(keyword in question.lower() for keyword in ['brief', 'short', 'summarize', 'quick', 'concise'])
    prompt_template = PromptTemplate.from_template(get_prompt_template(is_brief))
    answer_chain = prompt_template | llm | StrOutputParser()
    
    #Load the vectorstore
    vectorstore = load_vectorstore(subject, semester, year)
    
    #Retrieved Docs
    initial_docs = vectorstore.similarity_search(optimized_query, k=10)
    doc_texts = [doc.page_content for doc in initial_docs]
    scores = reranker.predict([(optimized_query, text) for text in doc_texts])
    ranked_docs = sorted(zip(initial_docs, scores), key=lambda x: x[1], reverse=True)
    top_docs = [doc for doc, _ in ranked_docs[:5]]

    context = ""
    total_tokens = 0

    for doc in top_docs:
        doc_tokens = count_tokens(doc.page_content)
        if total_tokens + doc_tokens > max_context_tokens:
            break
        context += doc.page_content + "\n\n"
        total_tokens += doc_tokens

    response = answer_chain.invoke({
        "chat_history": chat_history_str,
        "context": context,
        "question": optimized_query
    })

    memory.chat_memory.add_user_message(question)
    memory.chat_memory.add_ai_message(response)

    doc_filename = os.path.basename(top_docs[0].metadata["source"])
    page_numbers = [doc.metadata["page"] for doc in top_docs if "page" in doc.metadata]
    images = get_images_by_doc_and_pages(doc_filename, page_numbers)

    return {
        "answer": response,
        "images": images
    }
