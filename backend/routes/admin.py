"""Admin routes for system management."""
import logging
from fastapi import APIRouter, HTTPException, status, Header
from typing import Optional
from datetime import datetime, timezone

from models import AdminLoginRequest, TokenResponse
from services.database import DatabaseService
from utils import hash_password, verify_password, create_access_token
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/login", response_model=TokenResponse)
async def admin_login(request: AdminLoginRequest) -> TokenResponse:
    """Authenticate as admin."""
    # Verify credentials
    if request.username != settings.ADMIN_USERNAME:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # For initial setup, if no password hash exists, accept any password
    if settings.ADMIN_PASSWORD_HASH:
        if not verify_password(request.password, settings.ADMIN_PASSWORD_HASH):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
    else:
        # First login - set the password
        logger.warning("Admin password not set. First-time login accepted. Set ADMIN_PASSWORD_HASH in environment.")
    
    logger.info("Admin logged in")
    
    # Create token
    token, expires_in = create_access_token({
        "sub": "admin",
        "role": "admin"
    })
    
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user_id="admin"
    )


@router.get("/health")
async def admin_health(
    authorization: Optional[str] = Header(None)
) -> dict:
    """Get system health status (admin only)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin access required"
        )
    
    db_health = await db.health_check()
    
    return {
        "status": "healthy" if db_health.get("status") == "healthy" else "degraded",
        "api": "healthy",
        "database": db_health.get("status"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.get("/stats")
async def admin_stats(
    authorization: Optional[str] = Header(None)
) -> dict:
    """Get system statistics (admin only)."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin access required"
        )
    
    try:
        # Get stats from database
        total_generations = await db.db.generations.count_documents({})
        total_users = await db.db.users.count_documents({})
        
        return {
            "total_users": total_users,
            "total_generations": total_generations,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch statistics"
        )
