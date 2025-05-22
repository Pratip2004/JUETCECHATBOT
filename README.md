# JUETCECHATBOT

# University Electronics Q\&A Chatbot (RAG-based)

A full-stack **Retrieval-Augmented Generation (RAG)** chatbot system built for university-level electronics students. This application enables students to query topics from curated textbooks and get accurate, contextual answers powered by **OpenAI's LLM**, FAISS-based vector retrieval, and CrossEncoder reranking.

---

## ✨ What is RAG?

**Retrieval-Augmented Generation (RAG)** is an architecture that enhances language models by combining retrieval-based information with generative capabilities.

* **Retrieval**: Relevant text chunks are fetched from a knowledge base (e.g., textbooks) using vector similarity.
* **Augmentation**: These chunks are passed along with the user query to an LLM.
* **Generation**: The LLM generates a response **grounded** in the retrieved context.

### Why RAG over pure LLM?

| Feature                           | Plain LLM | RAG + LLM |
| --------------------------------- | --------- | --------- |
| Real-time domain knowledge        | ❌         | ✅         |
| Faithful, grounded answers        | ❌         | ✅         |
| Small context window optimization | ❌         | ✅         |
| Lower hallucination risk          | ❌         | ✅         |

---

## 🔍 Use Case

* Designed to help students understand microprocessors and electronics concepts by asking natural language questions.
* Only **admin-curated PDFs** are vectorized (students don't upload searchable PDFs).
* Useful for universities to integrate an intelligent, syllabus-aligned teaching assistant.

---

## 🚀 Tech Stack

### Backend

* **FastAPI** – Web framework for serving chat API and user management
* **MongoDB** – User info and persistent chat history
* **FAISS** – Vector search from pre-uploaded PDF chunks
* **HuggingFace Transformers** – Sentence embedding (`all-MiniLM-L6-v2`)
* **CrossEncoder** – For reranking search results
* **OpenAI GPT-4 / GPT-3.5** – For generating final answers
* **Tiktoken** – Token counting to avoid overflow

### Frontend

* **React.js** – Frontend UI
* **TailwindCSS** – Styling
* **Axios** – API communication

---

## ⚙️ Installation

### 1. Clone the Repo

```bash
git clone https://github.com/your-username/ju-ece-chatbot.git
cd ju-ece-chatbot
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd client
npm install
npm run dev
```

---

## 🔐 Features

* ✅ User registration & login (JWT-authenticated)
* ✅ Interactive chat interface with LLM-powered answers
* ✅ Chat memory using MongoDB
* ✅ PDF upload (admin only) + automatic vectorization
* ✅ Image-based diagram support for context
* ✅ Chat export (PDF/JSON)
* ✅ Usage analytics
* ✅ Profile update functionality
* ✅ Academic flow: users select **year**, **semester**, and **subject** before chatting

---

## 💡 How it Works

1. **User logs in**, selects academic details (year, sem, subject)
2. **Asks a question** from the interactive chat UI
3. **Query optimized** to improve search quality
4. **Vector store searched** using FAISS + HuggingFace embeddings
5. **CrossEncoder reranks** the results
6. **Top-ranked text chunks** passed to OpenAI LLM
7. **Answer generated** grounded in source context
8. **Images retrieved** by document name & page number
9. **Chat & academic context stored** for history/analytics

---

## 📄 Example Prompt

```
Question: Explain the working of 8085 ALU with an example
```

---

## 🌐 Deployment Notes

* Works locally with MongoDB
* Can be deployed with Docker, Railway, Render, or any FastAPI-friendly PaaS
* Add your OpenAI key in environment variables

---

## 🚫 Disclaimer

This is an academic-focused demo and not suitable for medical, legal, or production-critical applications.

---

## 🌟 Credits

* OpenAI for LLMs
* HuggingFace for embeddings and rerankers
* LangChain for vector & memory wrappers
