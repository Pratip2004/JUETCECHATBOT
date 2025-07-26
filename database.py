from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
client = AsyncIOMotorClient("mongodb://localhost:27017/")
db = client["chatbot_db"]
users_collection = db["userprofile"] 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def find_user(user):
    db_user = await users_collection.find_one({"username": user.username})
    return db_user 