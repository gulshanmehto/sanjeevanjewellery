"""Pydantic models for request/response validation."""
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, timezone
import uuid


# ============== Status Check Models ==============
class StatusCheckCreate(BaseModel):
    """Create a status check entry."""
    client_name: str = Field(..., min_length=1, max_length=100)


class StatusCheckResponse(BaseModel):
    """Status check response."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ============== Authentication Models ==============
class UserSignupRequest(BaseModel):
    """User signup request."""
    email: EmailStr
    name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        """Validate password strength."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserLoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    """Admin login request."""
    username: str = Field(..., min_length=3)
    password: str = Field(...)


class TokenResponse(BaseModel):
    """JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user_id: str
    expires_in: int


# ============== User Models ==============
class UserCreditsResponse(BaseModel):
    """User credits and profile response."""
    email: str
    name: Optional[str] = None
    credits: int
    role: str
    created_at: datetime


class CreditUpdateRequest(BaseModel):
    """Request to update user credits."""
    email: EmailStr
    amount: int = Field(..., gt=0)
    operation: str = Field(..., pattern="^(add|remove)$")


# ============== Generation Models ==============
class GenerationRequest(BaseModel):
    """Image generation request."""
    jewellery_type: str = Field(..., min_length=1, max_length=50)
    shoot_type: str = Field(..., pattern="^(product|model)$")
    preset_name: str = Field(..., min_length=1, max_length=100)
    preset_description: str = Field(..., min_length=1, max_length=500)
    quality: str = Field("HD", pattern="^(HD|4K)$")
    aspect_ratio: Optional[str] = None
    aspect_ratio_label: Optional[str] = None
    aspect_ratio_dimensions: Optional[str] = None


class GenerationResponse(BaseModel):
    """Image generation response."""
    id: str
    status: str = Field(..., pattern="^(completed|failed|processing)$")
    generated_image: Optional[str] = None
    message: Optional[str] = None


# ============== Video Generation Models ==============
class VideoGenerationRequest(BaseModel):
    """Video generation request."""
    image_url: str = Field(..., min_length=1)
    duration: int = Field(default=5, ge=3, le=30)


class VideoGenerationResponse(BaseModel):
    """Video generation response."""
    id: str
    status: str = Field(..., pattern="^(completed|failed|processing)$")
    video_url: Optional[str] = None
    message: Optional[str] = None


# ============== History Models ==============
class GenerationHistory(BaseModel):
    """Generation history entry."""
    id: str
    jewellery_type: str
    shoot_type: str
    preset_name: str
    aspect_ratio: Optional[str] = None
    email: str
    status: str
    created_at: datetime
    original_image: Optional[str] = None
    generated_image: Optional[str] = None


class HistoryResponse(BaseModel):
    """History list response."""
    total: int
    items: List[GenerationHistory]


# ============== Health Check Models ==============
class HealthCheckResponse(BaseModel):
    """API health check response."""
    status: str = "healthy"
    database: str
    api: str
    timestamp: datetime
