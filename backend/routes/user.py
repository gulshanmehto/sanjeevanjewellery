"""User routes for credits and profile management."""
import logging
from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional

from models import UserCreditsResponse, CreditUpdateRequest
from services.database import DatabaseService
from utils import verify_token

logger = logging.getLogger(__name__)
router = APIRouter()


async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """Extract and verify JWT token from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    try:
        payload = verify_token(token)
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return email
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=UserCreditsResponse)
async def get_user_profile(
    authorization: Optional[str] = Header(None)
) -> UserCreditsResponse:
    """Get current user profile and credits."""
    email = await get_current_user(authorization)
    
    user = await db.get_user(email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserCreditsResponse(
        email=user.get("email"),
        name=user.get("name"),
        credits=user.get("credits", 0),
        role=user.get("role", "user"),
        created_at=user.get("created_at")
    )


@router.get("/credits")
async def get_credits(
    authorization: Optional[str] = Header(None)
) -> dict:
    """Get user credits."""
    email = await get_current_user(authorization)
    
    credits = await db.get_user_credits(email)
    if credits is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {"email": email, "credits": credits}


@router.post("/credits/use")
async def use_credits(
    amount: int = 1,
    authorization: Optional[str] = Header(None)
) -> dict:
    """Deduct credits from user account."""
    email = await get_current_user(authorization)
    
    # Check if user has enough credits
    credits = await db.get_user_credits(email)
    if credits is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if credits < amount:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Insufficient credits. Required: {amount}, Available: {credits}"
        )
    
    # Deduct credits
    success = await db.update_user_credits(email, amount, "remove")
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update credits"
        )
    
    logger.info(f"Deducted {amount} credits from {email}")
    
    new_credits = await db.get_user_credits(email)
    return {
        "email": email,
        "deducted": amount,
        "remaining": new_credits
    }


@router.post("/credits/add")
async def add_credits(
    request: CreditUpdateRequest,
    authorization: Optional[str] = Header(None)
) -> dict:
    """Add credits to user account (admin only)."""
    email = await get_current_user(authorization)
    
    # Verify requester is admin (simplified check)
    user = await db.get_user(email)
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    # Add credits
    success = await db.update_user_credits(request.email, request.amount, "add")
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update credits"
        )
    
    logger.info(f"Added {request.amount} credits to {request.email}")
    
    return {
        "email": request.email,
        "added": request.amount,
        "message": "Credits added successfully"
    }
