from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
import logging
from auth import create_access_token, create_refresh_token, refresh_access_token, get_current_user, get_current_admin
from datetime import timedelta
from chat_engine import get_chat_response
from multimodal import extract_text_and_images_from_pdf, extract_text_from_image
from models.user import User, UserRole
from database import users_collection, pwd_context
from typing import Optional, List
from documentloader import load_documents
from splitter_vectorstore import split_documents, build_vectorstore
import os
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UserCreate(BaseModel):
    email: str
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

# Admin Models
class DashboardMetrics(BaseModel):
    totalUsers: int
    totalQueries: int
    totalPDFs: int
    topQueries: List[dict]
    recentActivity: List[dict]

class PDFDocument(BaseModel):
    filename: str
    pages: int
    uploadedAt: str

class UserResponse(BaseModel):
    username: str
    email: str
    role: str
    mobile: Optional[str] = None
    location: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    created_at: Optional[str] = None

@app.post("/register")
async def register(user: UserCreate):
    if user.password != user.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    if await users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = pwd_context.hash(user.password)
    
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        role=UserRole.USER
    )
    
    await users_collection.insert_one(new_user.model_dump())

    user_data = {
        "username": user.username,
        "email": user.email,
        "role": UserRole.USER
    }

    return {"message": "User registered", "user": user_data}

@app.post("/login")
async def login(user: LoginUser):
    print(f"Login attempt for user: {user.username}")  # Debug log
    
    db_user = await users_collection.find_one({"username": user.username})
    if not db_user:
        print(f"No user found in database for: {user.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not pwd_context.verify(user.password, db_user["password"]):
        print(f"Password verification failed for user: {user.username}")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Get user role from database
    user_role = db_user.get("role", UserRole.USER)
    print(f"User role from database: {user_role}")  # Debug log

    # Include role in token data
    token_data = {
        "sub": user.username,
        "role": str(user_role)  # Convert role to string
    }
    print(f"Token data being created: {token_data}")  # Debug log
    
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    user_data = {
        "username": db_user["username"],
        "email": db_user["email"],
        "role": str(user_role)  # Convert role to string
    }
    print(f"User data being returned: {user_data}")  # Debug log

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": user_data
    }

@app.post("/refresh")
async def refresh_token(refresh_token_data: RefreshToken):
    try:
        tokens = refresh_access_token(refresh_token_data.refresh_token)
        return tokens
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@app.put("/update_profile")
async def update_profile(update: UpdateProfileRequest, current_user: User = Depends(get_current_user)):
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

    await users_collection.update_one(
        {"username": current_user.username},
        {"$set": update_fields}
    )

    updated_user = await users_collection.find_one({"username": current_user.username})
    user_data = {
        "username": updated_user["username"],
        "email": updated_user["email"],
        "role": updated_user.get("role", UserRole.USER),
        "mobile": updated_user.get("mobile"),
        "location": updated_user.get("location"),
        "github": updated_user.get("github"),
        "linkedin": updated_user.get("linkedin"),
        "portfolio": updated_user.get("portfolio")
    }

    return {"message": "Profile updated successfully", "user": user_data}

@app.get("/get_profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    try:
        return {
            "username": current_user.username,
            "email": current_user.email,
            "role": current_user.role,
            "mobile": current_user.mobile or "",
            "location": current_user.location or "",
            "github": current_user.github or "",
            "linkedin": current_user.linkedin or "",
            "portfolio": current_user.portfolio or "",
        }
    except Exception as e:
        logging.error(f"Error in get_profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get profile")

@app.post("/save_chat")
async def save_chat(chat: Chat, current_user: User = Depends(get_current_user)):
    await users_collection.update_one(
        {"username": current_user.username},
        {"$push": {"chats": chat.dict()}}
    )
    return {"message": "Chat saved"}

@app.get("/search_chats")
async def search_chats(query: str, current_user: User = Depends(get_current_user)):
    user = await users_collection.find_one({"username": current_user.username})
    if not user or "chats" not in user:
        return {"matches": []}

    matches = [
        chat for chat in user["chats"]
        if query.lower() in chat["question"].lower() or query.lower() in chat["answer"].lower()
    ]
    return {"matches": matches}

@app.post("/start_chat")
async def start_chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    try:
        result = get_chat_response(
            current_user.username,
            request.question,
            request.session_id,
            request.year,
            request.semester,
            request.subject
        )

        await users_collection.update_one(
            {"username": current_user.username},
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

@app.post("/multimodal_chat")
async def multimodal_chat(
    question: str = Form(...),
    session_id: str = Form(...),
    year: str = Form(...),
    semester: str = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
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

    result = get_chat_response(
        username=current_user.username,
        question=combined_prompt,
        session_id=session_id,
        year=year,
        semester=semester,
        subject=subject
    )

    await users_collection.update_one(
        {"username": current_user.username},
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

# Admin Routes
@app.get("/admin/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=401, detail="Not authorized")
    
    try:
        # Get total users
        total_users = await users_collection.count_documents({})
        
        # Get all users to count their queries
        users = await users_collection.find({}).to_list(length=None)
        
        # Count total queries from all users' chat history
        total_queries = sum(len(user.get("chats", [])) for user in users)
        
        # Get top queries by counting occurrences
        query_counts = {}
        for user in users:
            for chat in user.get("chats", []):
                question = chat.get("question", "").lower()
                if question:
                    query_counts[question] = query_counts.get(question, 0) + 1
        
        # Sort and get top 5 queries
        top_queries = [
            {"query": query, "count": count}
            for query, count in sorted(query_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        # Get recent activity (last 10 chats across all users)
        recent_activity = []
        for user in users:
            for chat in user.get("chats", [])[-10:]:  # Get last 10 chats per user
                recent_activity.append({
                    "query": chat.get("question", ""),
                    "timestamp": chat.get("timestamp", ""),
                    "username": user.get("username", "")
                })
        
        # Sort recent activity by timestamp (most recent first)
        recent_activity.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        recent_activity = recent_activity[:10]  # Keep only the 10 most recent
        
        # Count total PDFs (assuming PDFs are stored in a separate collection)
        total_pdfs = 0  # TODO: Implement PDF counting when PDF storage is set up
        
        return DashboardMetrics(
            totalUsers=total_users,
            totalQueries=total_queries,
            totalPDFs=total_pdfs,
            topQueries=top_queries,
            recentActivity=recent_activity
        )
    except Exception as e:
        logging.error(f"Error in get_dashboard_metrics: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard metrics")

@app.get("/admin/pdfs", response_model=List[PDFDocument])
async def get_pdfs(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # TODO: Implement PDF listing from your storage
    return []

@app.post("/admin/pdfs/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    year: str = Form(...),
    semester: str = Form(...),
    subject: str = Form(...),
    current_user: User = Depends(get_current_admin)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Create directory structure if it doesn't exist
        base_path = f"./data/year_{year}/sem_{semester}/subject_{subject}"
        os.makedirs(base_path, exist_ok=True)
        
        # Save the file with its original filename
        file_path = os.path.join(base_path, file.filename)
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        # Load documents
        docs = load_documents(year=year, semester=semester, subject=subject)
        
        # Split into chunks
        chunks = split_documents(docs)
        
        # Build and persist vectorstore
        persist_path = f"vectorstores/{subject}_{year}_{semester}"
        os.makedirs("vectorstores", exist_ok=True)
        vectorstore = build_vectorstore(chunks, persist_path=persist_path)
        
        return {
            "message": "PDF uploaded and processed successfully",
            "metadata": {
                "filename": file.filename,
                "year": year,
                "semester": semester,
                "subject": subject,
                "vectorstore_path": persist_path
            }
        }
        
    except Exception as e:
        logging.error(f"Error in upload_pdf: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

@app.delete("/admin/pdfs/{filename}")
async def delete_pdf(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # TODO: Implement PDF deletion from your storage
    return {"message": "PDF deleted successfully"}

@app.post("/admin/pdfs/{filename}/reprocess")
async def reprocess_pdf(
    filename: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # TODO: Implement PDF reprocessing
    return {"message": "PDF reprocessed successfully"}

@app.get("/admin/queries/time")
async def get_queries_over_time(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # TODO: Implement query time series data
    # This should return data in the format: [{"name": "date", "value": count}, ...]
    return []

@app.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: User = Depends(get_current_admin)):
    try:
        print(f"Fetching all users. Current user: {current_user.username}")  # Debug log
        
        # Get all users from the database
        users = await users_collection.find({}).to_list(length=None)
        print(f"Found {len(users)} users in database")  # Debug log
        
        # Convert users to response model
        user_list = []
        for user in users:
            try:
                user_response = UserResponse(
                    username=user["username"],
                    email=user["email"],
                    role=str(user.get("role", UserRole.USER)),
                    mobile=user.get("mobile"),
                    location=user.get("location"),
                    github=user.get("github"),
                    linkedin=user.get("linkedin"),
                    portfolio=user.get("portfolio"),
                    created_at=user.get("created_at")
                )
                user_list.append(user_response)
            except Exception as e:
                print(f"Error processing user {user.get('username', 'unknown')}: {str(e)}")
                continue
        
        print(f"Successfully processed {len(user_list)} users")  # Debug log
        return user_list
        
    except Exception as e:
        print(f"Error in get_all_users: {str(e)}")  # Debug log
        logging.error(f"Error in get_all_users: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(e)}"
        )

