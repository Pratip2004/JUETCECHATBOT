from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import Runnable
from dotenv import load_dotenv
import os

load_dotenv()
# Initialize OpenAI client
llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.5,
    max_tokens=150,
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

# Prompt Template
template = """
You are an intelligent assistant helping refine user questions for academic document retrieval related to Electronics and Telecommunication subjects.

Given the chat history and current query, rewrite the query by:
- Expanding it to cover textbook-style subtopics such as:
    1. Description
    2. Derivation
    3. Example
    4. Key Points
    5. Important Information
    6. Notes
    7. Conclusion
- Additionally, only if relevant to the context, include:
    8. Warning (if the topic involves risks, safety, or precautions)
    9. Formula (if the topic involves calculations or equations)
    10. Application (if the topic involves real-world usage)
    11. Theory (if conceptual background is required)
    12. Practice (if practical implementation or lab is implied)
    13. Summary (if a holistic recap is needed)

Guidelines:
- Only include headers/subtopics that are contextually relevant.
- If the original query implies multiple aspects (e.g., both derivation and application), structure the refined query accordingly.
- Ensure the final query is specific, academically focused, and avoids ambiguity.
- Use clear formatting and phrasing to help guide information retrieval from a textbook-like source.

PREVIOUS CHAT SUMMARY:
{chat_history}

RAW QUERY:
{query}

OPTIMIZED QUERY:
"""

prompt = PromptTemplate.from_template(template)

# Chain it all together
optimize_query_chain: Runnable = prompt | llm | StrOutputParser()

# Function to call
def optimize_query(raw_query, chat_history_str):
    return optimize_query_chain.invoke({
        "query": raw_query,
        "chat_history": chat_history_str
    })
