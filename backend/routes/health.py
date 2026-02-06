"""Health check routes."""
import logging
from fastapi import APIRouter
from datetime import datetime, timezone

from models import HealthCheckResponse
from services.database import DatabaseService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/status")
async def health_check() -> HealthCheckResponse:
    """Check API and database health status."""
    db_check = await DatabaseService.health_check()
    
    return HealthCheckResponse(
        status="healthy" if db_check.get("status") == "healthy" else "degraded",
        database=db_check.get("status", "unknown"),
        api="healthy",
        timestamp=datetime.now(timezone.utc)
    )


@router.get("/ping")
async def ping():
    """Simple ping endpoint."""
    return {"status": "pong", "timestamp": datetime.now(timezone.utc).isoformat()}
