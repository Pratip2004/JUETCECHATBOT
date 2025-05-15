from langchain_core.chat_history import BaseChatMessageHistory
from langchain_mongodb import MongoDBChatMessageHistory
from langchain.memory import ConversationBufferMemory
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
DB_NAME = "ju_ece_chatbot"
COLLECTION_NAME = "chat_memory"
MAX_MESSAGES = 10

def get_memory(username: str, session_id: str, year: str, semester: str, subject: str) -> ConversationBufferMemory:
    combined_session_id = f"{username}_{year}_{semester}_{subject}_{session_id}"
    history = MongoDBChatMessageHistory(
        connection_string=MONGO_URL,
        session_id=combined_session_id,
        database_name=DB_NAME,
        collection_name=COLLECTION_NAME
    )

    # Trim old messages
    all_messages = history.messages
    if len(all_messages) > MAX_MESSAGES:
        history.messages = all_messages[-MAX_MESSAGES:]

    memory = ConversationBufferMemory(
        chat_memory=history,
        return_messages=True,
        memory_key="history"
    )
    return memory