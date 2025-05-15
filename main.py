from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from pymongo import MongoClient
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
import logging
from auth import create_access_token, create_refresh_token, refresh_access_token, get_current_user
from datetime import timedelta
from chat_engine import get_chat_response  # Make sure to import this
from multimodal import extract_text_and_images_from_pdf,extract_text_from_image

app = FastAPI()
client = MongoClient("mongodb://localhost:27017/")
db = client["chatbot_db"]
users_collection = db["userprofile"]
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class User(BaseModel):
    email:str
    username: str
    password: str
    confirm_password: str

class LoginUser(BaseModel):
    username: str
    password: str

class RefreshToken(BaseModel):
    refresh_token: str

class Chat(BaseModel):
    question: str
    answer: str


class ChatRequest(BaseModel):
    question: str
    session_id: str
    year: str
    semester: str
    subject: str
    
class UpdateProfileRequest(BaseModel):
    mobile: str | None = None
    location: str | None = None
    github: str | None = None
    linkedin: str | None = None
    portfolio: str | None = None


@app.post("/register")
def register(user: User):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = pwd_context.hash(user.password)
    
    users_collection.insert_one({
        "email": user.email,
        "username": user.username,
        "password": hashed_password,
        "chats": []
    })

    user_data = {
        "username": user.username,
        "email": user.email,
        "chats": []
    }

    return {"message": "User registered", "user": user_data}


@app.post("/login")
def login(user: LoginUser):
    db_user = users_collection.find_one({"username": user.username})
    
    if not db_user:
        print("User not found")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})
    
    user_data = {
        "username": db_user["username"],
        "email": db_user["email"],
        "chats": db_user.get("chats", [])
    }

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data
    }

@app.post("/refresh")
def refresh_token(refresh_token_data: RefreshToken):
    try:
        tokens = refresh_access_token(refresh_token_data.refresh_token)
        return tokens
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.put("/update_profile")
def update_profile(update: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    update_fields = {}

    if update.mobile:
        update_fields["mobile"] = update.mobile
    if update.location:
        update_fields["location"] = update.location
    if update.github:
        update_fields["github"] = update.github
    if update.linkedin:
        update_fields["linkedin"] = update.linkedin
    if update.portfolio:
        update_fields["portfolio"] = update.portfolio

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    users_collection.update_one(
        {"username": current_user["username"]},
        {"$set": update_fields}
    )

    updated_user = users_collection.find_one({"username": current_user["username"]})
    user_data = {
        "username": updated_user["username"],
        "email": updated_user["email"],
        "mobile": updated_user.get("mobile"),
        "location": updated_user.get("location"),
        "github": updated_user.get("github"),
        "linkedin": updated_user.get("linkedin"),
        "portfolio": updated_user.get("portfolio"),
        "chats": updated_user.get("chats", [])
    }

    return {"message": "Profile updated successfully", "user": user_data}

@app.get("/get_profile")
def get_profile(user: User = Depends(get_current_user)):
    try:
        logging.info(f"Authenticated user: {user}")
        return {
            "username": user.username,
            "email": user.email,
            "mobile": user.mobile or "",
            "location": user.location or "",
            "github": user.github or "",
            "linkedin": user.linkedin or "",
            "portfolio": user.portfolio or "",
        }
    except Exception as e:
        logging.error(f"Error in get_profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get profile")


@app.post("/save_chat")
def save_chat(chat: Chat, current_user: dict = Depends(get_current_user)):
    users_collection.update_one(
        {"username": current_user["username"]},
        {"$push": {"chats": chat.dict()}}
    )
    return {"message": "Chat saved"}


@app.get("/search_chats")
def search_chats(query: str, current_user: dict = Depends(get_current_user)):
    user = users_collection.find_one({"username": current_user["username"]})
    if not user or "chats" not in user:
        return {"matches": []}

    matches = [
        chat for chat in user["chats"]
        if query.lower() in chat["question"].lower() or query.lower() in chat["answer"].lower()
    ]
    return {"matches": matches}


@app.post("/start_chat")
def start_chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        result = get_chat_response(
            current_user["username"],
            request.question,
            request.session_id,
            request.year,
            request.semester,
            request.subject
        )

        users_collection.update_one(
            {"username": current_user["username"]},
            {"$push": {"chats": {
                "session_id": request.session_id,
                "year": request.year,
                "semester": request.semester,
                "subject": request.subject,
                "question": request.question,
                "answer": result["answer"],
                "images": result["images"]
            }}}
        )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Multimodal chat route
@app.post("/multimodal_chat")
async def multimodal_chat(
    question: str = Form(...),
    session_id: str = Form(...),
    year: str = Form(...),
    semester: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    file_ext = file.filename.split(".")[-1].lower()
    contents = await file.read()

    if file_ext == "pdf":
        text, ocr_text = extract_text_and_images_from_pdf(contents)
        extracted_text = f"{text}\n\n[Image Text]\n{ocr_text}"
    elif file_ext in ["png", "jpg", "jpeg"]:
        extracted_text = extract_text_from_image(contents)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    combined_prompt = f"{question}\n\n[File Content]\n{extracted_text}"

    # ✅ Include session_id in the call
    result = get_chat_response(
        username=current_user["username"],
        question=combined_prompt,
        session_id=session_id,
        year=year,
        semester=semester,
        subject=subject
    )

    # ✅ Save all fields including session_id into MongoDB
    users_collection.update_one(
        {"username": current_user["username"]},
        {"$push": {"chats": {
            "session_id": session_id,
            "question": question,
            "file_used": file.filename,
            "answer": result["answer"],
            "images": result["images"],
            "year": year,
            "semester": semester,
            "subject": subject
        }}}
    )

    return result

