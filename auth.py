from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
import os
from passlib.context import CryptContext
from typing import Optional
from models.user import User, UserRole
from database import users_collection
from bson import ObjectId

load_dotenv()

# Settings
SECRET_KEY = os.getenv("SECRET")  # This reads SECRET from your .env file
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET", SECRET_KEY)  # Use same key if not specified
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30  # 30 minutes for access token
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days for refresh token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    print(f"Creating access token with data: {to_encode}")  # Debug log
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    print(f"Creating refresh token with data: {to_encode}")  # Debug log
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

def refresh_access_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")  # Get role from refresh token
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        # Create new access token with both username and role
        access_token = create_access_token(data={"sub": username, "role": role})
        return {"access_token": access_token, "refresh_token": refresh_token}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Verifying token: {token[:10]}...")  # Log first 10 chars of token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Decoded token payload: {payload}")  # Log entire payload
        
        username: str = payload.get("sub")
        if username is None:
            print("No username in token payload")
            raise credentials_exception
        
        # Get role from token
        role = payload.get("role")
        print(f"Token payload - username: {username}, role: {role}")
        
        # Get user from database
        user = await users_collection.find_one({"username": username})
        if user is None:
            print(f"No user found for username: {username}")
            raise credentials_exception
            
        print(f"User from database: {user}")  # Log user data from database
        
        # Convert role to string for comparison
        db_role = str(user.get("role", UserRole.USER))
        token_role = str(role) if role is not None else None
        
        print(f"Role comparison - Token role: {token_role}, DB role: {db_role}")
        
        # Verify role matches
        if token_role != db_role:
            print(f"Role mismatch - token: {token_role}, user: {db_role}")
            raise credentials_exception
            
        return User(**user)
    except JWTError as e:
        print(f"JWT verification failed: {str(e)}")
        raise credentials_exception
    except Exception as e:
        print(f"Unexpected error in get_current_user: {str(e)}")
        raise credentials_exception

async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
