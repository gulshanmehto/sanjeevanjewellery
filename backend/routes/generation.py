"""Image and video generation routes."""
import logging
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Header
from typing import Optional
from datetime import datetime, timezone

from models import GenerationResponse
from services import AIService
from services.database import DatabaseService
from routes.user import get_current_user
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize AI service
ai_service = AIService()


@router.post("/image", response_model=GenerationResponse)
async def generate_image(
    image: UploadFile = File(...),
    jewellery_type: str = Form(...),
    shoot_type: str = Form(...),
    preset_name: str = Form(...),
    preset_description: str = Form(...),
    quality: str = Form("HD"),
    aspect_ratio: Optional[str] = Form(None),
    aspect_ratio_label: Optional[str] = Form(None),
    aspect_ratio_dimensions: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None)
) -> GenerationResponse:
    """Generate a jewellery photoshoot image."""
    try:
        # Verify authentication
        if authorization:
            auth_email = await get_current_user(authorization)
        else:
            auth_email = email or "anonymous"
        
        # Validate file
        if not image.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No image file provided"
            )
        
        file_ext = image.filename.rsplit(".", 1)[-1].lower() if "." in image.filename else ""
        if file_ext not in settings.ALLOWED_IMAGE_FORMATS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file format. Allowed: {', '.join(settings.ALLOWED_IMAGE_FORMATS)}"
            )
        
        # Check credits (if authenticated)
        if authorization:
            credits = await db.get_user_credits(auth_email)
            if credits and credits < 1:
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Insufficient credits"
                )
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum: {settings.MAX_FILE_SIZE_MB}MB"
            )
        
        logger.info(f"Generating image for {auth_email}: {jewellery_type} - {shoot_type}")
        
        # Generate image
        generated_image_b64, status_str = await ai_service.generate_image(
            image_data=image_data,
            jewellery_type=jewellery_type,
            shoot_type=shoot_type,
            preset_name=preset_name,
            preset_description=preset_description,
            quality=quality,
            aspect_ratio=aspect_ratio,
            aspect_ratio_label=aspect_ratio_label,
            aspect_ratio_dimensions=aspect_ratio_dimensions
        )
        
        # Don't store full base64 images in MongoDB - they're too large
        # Store only metadata and image references instead
        
        # Save generation record (without storing full base64 image data)
        generation_data = {
            "jewellery_type": jewellery_type,
            "shoot_type": shoot_type,
            "preset_name": preset_name,
            "aspect_ratio": aspect_ratio,
            "aspect_ratio_label": aspect_ratio_label,
            "aspect_ratio_dimensions": aspect_ratio_dimensions,
            "email": auth_email,
            "status": status_str,
            "created_at": datetime.now(timezone.utc)
        }
        
        generation_id = await db.save_generation(generation_data)
        
        # Deduct credit
        if authorization:
            await db.update_user_credits(auth_email, 1, "remove")
        
        return GenerationResponse(
            id=generation_id,
            status=status_str,
            generated_image=f"data:image/png;base64,{generated_image_b64}" if generated_image_b64 else None,
            message="Image generated successfully" if status_str == "completed" else "Failed to generate image"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate image"
        )


@router.get("/history")
async def get_generation_history(
    skip: int = 0,
    limit: int = 50,
    authorization: Optional[str] = Header(None)
) -> dict:
    """Get user's generation history."""
    email = await get_current_user(authorization)
    
    generations = await db.get_user_generations(email, limit, skip)
    total = await db.count_user_generations(email)
    
    # Format history items
    items = []
    for gen in generations:
        items.append({
            "id": str(gen.get("_id", "")),
            "jewellery_type": gen.get("jewellery_type"),
            "shoot_type": gen.get("shoot_type"),
            "preset_name": gen.get("preset_name"),
            "aspect_ratio": gen.get("aspect_ratio"),
            "status": gen.get("status"),
            "created_at": gen.get("created_at")
        })
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items
    }
