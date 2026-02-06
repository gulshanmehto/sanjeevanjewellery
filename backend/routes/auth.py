"""Authentication routes."""
import logging
from fastapi import APIRouter, HTTPException, status
from datetime import datetime, timezone

from models import (
    UserSignupRequest, UserLoginRequest, TokenResponse, UserCreditsResponse
)
from services.database import DatabaseService
from utils import hash_password, verify_password, create_access_token

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(request: UserSignupRequest) -> TokenResponse:
    """Register a new user."""
    # Check if user already exists
    if await db.user_exists(request.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    try:
        # Create user document
        user_data = {
            "email": request.email,
            "name": request.name,
            "password": hash_password(request.password),
            "credits": 10,
            "role": "user",
            "created_at": datetime.now(timezone.utc)
        }
        
        user_id = await db.create_user(user_data)
        logger.info(f"New user registered: {request.email}")
        
        # Create token
        token, expires_in = create_access_token({
            "sub": request.email,
            "user_id": user_id,
            "role": "user"
        })
        
        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user_id=user_id
        )
    
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest) -> TokenResponse:
    """Authenticate user with email and password."""
    try:
        user = await db.get_user(request.email)
        
        if not user or not verify_password(request.password, user.get("password", "")):
            logger.warning(f"Failed login attempt for email: {request.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        logger.info(f"User logged in: {request.email}")
        
        # Create token
        token, expires_in = create_access_token({
            "sub": request.email,
            "user_id": str(user.get("_id", "")),
            "role": user.get("role", "user")
        })
        
        return TokenResponse(
            access_token=token,
            expires_in=expires_in,
            user_id=str(user.get("_id", ""))
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )
