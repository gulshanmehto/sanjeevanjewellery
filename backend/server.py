from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Form, Header
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64
import asyncio
from passlib.context import CryptContext
from pymongo import ReturnDocument

# Import middleware
from middleware import add_security_headers, limiter

# Import super-resolution pipeline
from services.super_resolution import upscale_base64_image, get_superresolution_pipeline
from services.s3_storage import S3Storage

ROOT_DIR = Path(__file__).parent

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'jewelai')]  # Default to 'jewelai' if not set

# Create the main app without a prefix
app = FastAPI(
    title="JewelAI Studio Pro API",
    description="AI-powered jewelry image generation platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add security headers middleware
add_security_headers(app)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# S3 storage (optional)
try:
    s3_storage = S3Storage.from_env()
except Exception as s3_error:
    s3_storage = None
    logger.warning(f"S3 storage not configured: {s3_error}")

SIGNED_URL_TTL = int(os.environ.get("AWS_S3_SIGNED_URL_TTL", "3600"))

# ============== MODELS ==============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class GenerationRequest(BaseModel):
    jewellery_type: str
    shoot_type: str  # "product" or "model"
    preset_name: str
    preset_description: str

class GenerationResponse(BaseModel):
    id: str
    status: str
    generated_image: Optional[str] = None
    image: Optional[str] = None
    job_id: Optional[str] = None
    output_url: Optional[str] = None
    message: Optional[str] = None

class VideoGenerationResponse(BaseModel):
    id: str
    status: str
    video_url: Optional[str] = None
    message: Optional[str] = None

class JobCompleteRequest(BaseModel):
    output_s3_key: str

class JobFailRequest(BaseModel):
    error: str

class UserCredits(BaseModel):
    email: str
    name: Optional[str] = None
    password: Optional[str] = None  # Hashed password
    credits: int = 10
    role: str = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserSignupRequest(BaseModel):
    email: str
    name: str
    password: str
    credits: int = 10

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class CreditUpdateRequest(BaseModel):
    email: str
    amount: int
    operation: str  # "add" or "remove"

# ============== PROMPT TEMPLATE ==============

JEWELLERY_PROMPT_TEMPLATE = """You are a professional commercial jewellery photography AI.

TASK:
Create a high-end, photorealistic jewellery photoshoot image using the uploaded jewellery image as the only product reference.
⚠️ CRITICAL: Output image MUST be EXACTLY {exact_dimensions} pixels ({ratio_label}).

JEWELLERY TYPE:
{jewellery_type}

SHOOT TYPE:
{shoot_type} (product shoot OR model shoot)

STYLE / PRESET:
{preset_name}

SCENE & MOOD:
{preset_description}

OUTPUT QUALITY:
{quality} resolution at EXACTLY {exact_dimensions} pixels ({ratio_label}).
Ensure the output image reflects this level of professional detail and clarity.

IMPORTANT PRODUCT PRESERVATION RULES (VERY STRICT):
The jewellery shown in the uploaded image must remain:
- exactly the same design
- exactly the same stones and stone placement
- exactly the same metal colour
- exactly the same proportions and shape
- exactly the same engravings and details

Do NOT redesign, re-style, replace, simplify, upscale or alter the jewellery.
Only change lighting, background, environment, pose and composition.

{shoot_type_instructions}

COMPOSITION RULES:
- Jewellery must be the main hero of the image
- No text, logos, or watermarks
- No blur on the jewellery
- No cropping of the jewellery
- Proper scale and realistic perspective

LIGHTING & QUALITY:
Professional DSLR photography, soft cinematic lighting, high dynamic range, natural shadows, ultra-realistic texture, clean background separation, premium commercial advertising look.

CAMERA & OUTPUT:
50mm–85mm lens look, f/2.8 – f/5.6 depth of field, sharp focus on jewellery, high resolution, social media & catalogue ready.
⚠️ MANDATORY OUTPUT SIZE: {exact_dimensions} pixels ({ratio_label}) - DO NOT generate any other dimensions.

FINAL GOAL:
A realistic, premium, sell-ready jewellery photoshoot image at EXACTLY {exact_dimensions} pixels suitable for a real jewellery store catalogue and marketing campaigns in India.
"""

PRODUCT_SHOOT_INSTRUCTIONS = """
Generate a clean professional jewellery product photoshoot.
No human model.
No hands unless explicitly part of the preset.
Focus sharply on the jewellery.
Commercial catalogue quality.
Perfect lighting and reflections.
Premium studio finish.
"""

MODEL_SHOOT_INSTRUCTIONS = """
Place the jewellery naturally on a realistic Indian model.
The jewellery must be worn correctly and clearly visible.
Natural skin tones.
Luxury fashion photography look.
No over-stylisation.
"""

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "JewelAI Studio API - v1.0"}

@api_router.get("/ping")
async def ping():
    """Simple ping endpoint for health checks."""
    return {"status": "pong", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# ============== JEWELLERY GENERATION API ==============

@api_router.post("/generate", response_model=GenerationResponse)
async def generate_jewellery_photo(
    image: UploadFile = File(...),
    jewellery_type: str = Form(...),
    shoot_type: str = Form(...),
    preset_name: str = Form(...),
    preset_description: str = Form(...),
    quality: str = Form("HD"),
    email: str = Form("anonymous"),
    aspect_ratio: str = Form(None),
    aspect_ratio_label: str = Form(None),
    aspect_ratio_dimensions: str = Form(None)
):
    """
    Generate a professional jewellery photoshoot using AI.
    
    - image: The jewellery image to use as reference
    - jewellery_type: Type of jewellery (ring, necklace, etc.)
    - shoot_type: "product" or "model"
    - preset_name: Name of the style preset
    - preset_description: Description of the scene/mood
    """
    try:
        # Read and encode the uploaded image
        image_data = await image.read()
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # DEBUG: Log received aspect ratio parameters
        logger.info(f"Received aspect_ratio: {aspect_ratio}")
        logger.info(f"Received aspect_ratio_label: {aspect_ratio_label}")
        logger.info(f"Received aspect_ratio_dimensions: {aspect_ratio_dimensions}")
        
        # Build aspect ratio instruction with exact dimensions
        dimension_map = {
            "1:1": ("1024x1024", "Square (1:1)"),
            "9:13": ("1152x1664", "Portrait (9:13)"),
            "16:9": ("1920x1080", "Landscape (16:9)"),
            "9:16": ("1080x1920", "Tall (9:16)"),
            "21:9": ("2560x1097", "Wide (21:9)"),
            "32:9": ("3840x1080", "Ultra Wide (32:9)")
        }
        
        if aspect_ratio and aspect_ratio in dimension_map:
            exact_dimensions, ratio_label = dimension_map[aspect_ratio]
        else:
            exact_dimensions = "1920x1080"
            ratio_label = "Landscape (16:9)"
        
        # Build the prompt with exact dimensions embedded throughout
        shoot_instructions = PRODUCT_SHOOT_INSTRUCTIONS if shoot_type == "product" else MODEL_SHOOT_INSTRUCTIONS
        prompt = JEWELLERY_PROMPT_TEMPLATE.format(
            jewellery_type=jewellery_type,
            shoot_type=shoot_type.upper(),
            preset_name=preset_name,
            preset_description=preset_description,
            quality=quality,
            shoot_type_instructions=shoot_instructions,
            exact_dimensions=exact_dimensions,
            ratio_label=ratio_label
        )
        
        logger.info(f"Generating {shoot_type} shoot for {jewellery_type} with preset: {preset_name}")
        
        # Using Google Generative AI directly
        import google.generativeai as genai
        
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")
            
        genai.configure(api_key=api_key)
        
        # Use the specific model requested
        model_name = os.environ.get("GEMINI_MODEL", "gemini-3-pro-image-preview")
        model = genai.GenerativeModel(model_name)
        
        # Request content for image generation
        # Prompt includes specific instructions for jewellery photography  
        generation_config = {
            "temperature": 0.4,
        }
        
        logger.info(f"Generating with exact dimensions: {exact_dimensions} ({ratio_label})")
        
        response = model.generate_content(
            [prompt, {"mime_type": "image/png", "data": image_data}],
            generation_config=generation_config
        )
        
        if response:
            generation_id = str(uuid.uuid4())

            # Extract generated image data (bytes + base64)
            generated_image_bytes = None
            if hasattr(response, 'candidates') and response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'inline_data'):
                        generated_image_bytes = part.inline_data.data
                        break

            if not generated_image_bytes:
                raise HTTPException(
                    status_code=500,
                    detail="Model did not return an image. Please try again or use a supported image-capable model."
                )

            generated_image_b64 = base64.b64encode(generated_image_bytes).decode('utf-8')

            # If S3 is configured, enqueue a GPU job and return job_id
            if s3_storage:
                job_id = str(uuid.uuid4())

                original_ext = "png"
                if image.filename and "." in image.filename:
                    original_ext = image.filename.rsplit(".", 1)[-1].lower()

                original_key = f"jobs/{job_id}/original.{original_ext}"
                generated_key = f"jobs/{job_id}/generated.png"
                output_key = f"jobs/{job_id}/output.png"

                s3_storage.upload_bytes(
                    original_key,
                    image_data,
                    content_type=image.content_type or "image/png"
                )
                s3_storage.upload_bytes(
                    generated_key,
                    generated_image_bytes,
                    content_type="image/png"
                )

                job_record = {
                    "job_id": job_id,
                    "generation_id": generation_id,
                    "status": "queued",
                    "input_s3_key": generated_key,
                    "output_s3_key": output_key,
                    "original_s3_key": original_key,
                    "preset_name": preset_name,
                    "aspect_ratio": aspect_ratio,
                    "aspect_ratio_label": aspect_ratio_label,
                    "aspect_ratio_dimensions": aspect_ratio_dimensions,
                    "email": email,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.jobs.insert_one(job_record)

                generation_record = {
                    "id": generation_id,
                    "job_id": job_id,
                    "jewellery_type": jewellery_type,
                    "shoot_type": shoot_type,
                    "preset_name": preset_name,
                    "aspect_ratio": aspect_ratio,
                    "aspect_ratio_label": aspect_ratio_label,
                    "aspect_ratio_dimensions": aspect_ratio_dimensions,
                    "email": email,
                    "status": "processing",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.generations.insert_one(generation_record)

                return GenerationResponse(
                    id=generation_id,
                    status="processing",
                    job_id=job_id,
                    message="Image queued for GPU upscaling"
                )

            # Fallback: inline super-resolution (no S3 configured)
            logger.info("S3 not configured, applying inline super-resolution...")
            try:
                upscaled_image_data = upscale_base64_image(
                    f"data:image/png;base64,{generated_image_b64}"
                )
                if upscaled_image_data.startswith('data:image'):
                    upscaled_image_data = upscaled_image_data.split(',')[1]
                generated_image_b64 = upscaled_image_data
            except Exception as sr_error:
                logger.warning(f"Super-resolution failed, using original: {str(sr_error)}")

            generation_record = {
                "id": generation_id,
                "jewellery_type": jewellery_type,
                "shoot_type": shoot_type,
                "preset_name": preset_name,
                "aspect_ratio": aspect_ratio,
                "aspect_ratio_label": aspect_ratio_label,
                "aspect_ratio_dimensions": aspect_ratio_dimensions,
                "email": email,
                "status": "completed",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.generations.insert_one(generation_record)

            return GenerationResponse(
                id=generation_id,
                status="completed",
                generated_image=f"data:image/png;base64,{generated_image_b64}",
                image=f"data:image/png;base64,{generated_image_b64}",
                message="Jewellery photoshoot generated successfully!"
            )
        
        return GenerationResponse(
            id=str(uuid.uuid4()),
            status="failed",
            message="No image was generated. Please try again."
        )
            
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@api_router.post("/generate-video", response_model=VideoGenerationResponse)
async def generate_video_from_image(
    image: UploadFile = File(...)
):
    """
    Convert a generated image to a promotional video.
    Note: This is a placeholder - actual video generation would require a video AI service.
    """
    try:
        # For now, return a mock response indicating this feature is coming soon
        return VideoGenerationResponse(
            id=str(uuid.uuid4()),
            status="mock",
            video_url=None,
            message="Video generation is a premium feature coming soon. Currently showing demo video."
        )
    except Exception as e:
        logger.error(f"Video generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Video generation failed: {str(e)}")

# ============== GPU JOB QUEUE API ==============

@api_router.post("/jobs/next")
async def claim_next_job(worker_id: Optional[str] = Header(None)):
    """Worker claims the next queued job."""
    job = await db.jobs.find_one_and_update(
        {"status": "queued"},
        {
            "$set": {
                "status": "processing",
                "worker_id": worker_id,
                "started_at": datetime.now(timezone.utc).isoformat()
            }
        },
        sort=[("created_at", 1)],
        return_document=ReturnDocument.AFTER
    )

    if not job:
        return {"job": None}

    return {
        "job_id": job.get("job_id"),
        "input_s3_key": job.get("input_s3_key"),
        "output_s3_key": job.get("output_s3_key"),
        "aspect_ratio": job.get("aspect_ratio"),
        "preset_name": job.get("preset_name")
    }


@api_router.post("/jobs/{job_id}/complete")
async def complete_job(job_id: str, request: JobCompleteRequest):
    """Worker marks a job as completed and stores output key."""
    result = await db.jobs.update_one(
        {"job_id": job_id},
        {
            "$set": {
                "status": "completed",
                "output_s3_key": request.output_s3_key,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.generations.update_one(
        {"job_id": job_id},
        {"$set": {"status": "completed"}}
    )

    return {"job_id": job_id, "status": "completed"}


@api_router.post("/jobs/{job_id}/fail")
async def fail_job(job_id: str, request: JobFailRequest):
    """Worker marks a job as failed."""
    result = await db.jobs.update_one(
        {"job_id": job_id},
        {
            "$set": {
                "status": "failed",
                "error": request.error,
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    await db.generations.update_one(
        {"job_id": job_id},
        {"$set": {"status": "failed"}}
    )

    return {"job_id": job_id, "status": "failed"}


@api_router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Return job status and signed URL when completed."""
    job = await db.jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    response = {
        "job_id": job.get("job_id"),
        "status": job.get("status"),
        "output_s3_key": job.get("output_s3_key")
    }

    if job.get("status") == "completed" and s3_storage and job.get("output_s3_key"):
        response["output_url"] = s3_storage.generate_signed_url(
            job.get("output_s3_key"),
            expires_in=SIGNED_URL_TTL
        )

    return response

# ============== USER & CREDITS API ==============

@api_router.get("/user/{email}/credits")
async def get_user_credits(email: str):
    """Get user credits balance without creating user"""
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sign up.")
    return {"email": email, "credits": user.get("credits", 10)}

@api_router.post("/user/signup")
async def signup_user(request: UserSignupRequest):
    """Register a new user with email, password and initial credits"""
    exists = await db.users.find_one({"email": request.email})
    if exists:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(request.password)
    new_user = UserCredits(
        email=request.email,
        name=request.name,
        password=hashed_password,
        credits=request.credits,
    ).model_dump()
    new_user["created_at"] = new_user["created_at"].isoformat()
    await db.users.insert_one(new_user)
    return {
        "email": request.email,
        "name": request.name,
        "credits": request.credits,
        "message": "Signup successful"
    }

@api_router.post("/user/login")
async def login_user(request: UserLoginRequest):
    """Authenticate a user with email and password"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed_password = user.get("password")
    if not hashed_password:
        raise HTTPException(status_code=400, detail="Password not set for this account")

    if not verify_password(request.password, hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "email": user.get("email"),
        "name": user.get("name"),
        "credits": user.get("credits", 10)
    }

@api_router.post("/user/{email}/use-credits")
async def use_credits(email: str, amount: int = 1):
    """Deduct credits from user account"""
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_credits = user.get("credits", 0)
    if current_credits < amount:
        raise HTTPException(status_code=400, detail="Insufficient credits")
    
    await db.users.update_one(
        {"email": email},
        {"$inc": {"credits": -amount}}
    )
    return {"email": email, "credits": current_credits - amount}

@api_router.post("/user/{email}/add-credits")
async def add_credits(email: str, amount: int):
    """Add credits to user account (mock payment)"""
    result = await db.users.update_one(
        {"email": email},
        {"$inc": {"credits": amount}},
        upsert=True
    )
    user = await db.users.find_one({"email": email}, {"_id": 0})
    return {"email": email, "credits": user.get("credits", amount), "message": f"{amount} credits added successfully (MOCKED)"}

# ============== ADMIN API ==============

@api_router.post("/admin/setup")
async def setup_admin():
    """Initialize the admin user requested by the user"""
    admin_user = {
        "username": "sanjeevansahu",
        "password": "Sanjeevan@850", # In a real app, this should be hashed
        "role": "admin",
        "email": "admin@jewelai.com",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Check if admin already exists
    exists = await db.admins.find_one({"username": "sanjeevansahu"})
    if not exists:
        await db.admins.insert_one(admin_user)
        return {"message": "Admin user created successfully"}
    return {"message": "Admin user already exists"}

@api_router.post("/admin/login")
async def admin_login(request: AdminLoginRequest):
    """Authenticate admin user"""
    # Lazy-setup for the specific admin user requested
    if request.username == "sanjeevansahu":
        exists = await db.admins.find_one({"username": "sanjeevansahu"})
        if not exists:
            admin_user = {
                "username": "sanjeevansahu",
                "password": "Sanjeevan@850",
                "role": "admin",
                "email": "admin@jewelai.com",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(admin_user)
            logger.info("Auto-initialized admin user: sanjeevansahu")

    admin = await db.admins.find_one({
        "username": request.username,
        "password": request.password
    })
    
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    return {
        "status": "success",
        "user": {
            "username": admin["username"],
            "role": "admin"
        },
        "token": "mock-admin-token-123"
    }

@api_router.get("/admin/users")
async def admin_get_users():
    """Get all registered users"""
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.post("/admin/users/update-credits")
async def admin_update_credits(request: CreditUpdateRequest):
    """Admin tool to add or remove credits from any user"""
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    change = request.amount if request.operation == "add" else -request.amount
    
    new_balance = user.get("credits", 0) + change
    if new_balance < 0:
        new_balance = 0
        
    await db.users.update_one(
        {"email": request.email},
        {"$set": {"credits": new_balance}}
    )
    
    return {
        "email": request.email,
        "new_balance": new_balance,
        "message": f"Successfully {request.operation}ed {request.amount} credits"
    }

@api_router.get("/admin/analytics")
async def admin_get_analytics():
    """Get platform-wide analytics"""
    total_users = await db.users.count_documents({})
    total_generations = await db.generations.count_documents({})
    
    # Simple aggregation for credit usage (if we had logs)
    # For now, just sum all current user credits
    cursor = db.users.aggregate([
        {"$group": {"_id": None, "total_credits": {"$sum": "$credits"}}}
    ])
    result = await cursor.to_list(1)
    platform_credits = result[0]["total_credits"] if result else 0
    
    return {
        "total_users": total_users,
        "total_generations": total_generations,
        "platform_credits": platform_credits,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/user/{email}/generations")
async def get_user_generations(email: str):
    """Get generation history for a specific user"""
    generations = await db.generations.find({"email": email}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return generations

@api_router.get("/admin/generations")
async def admin_get_all_generations():
    """View all platform generations"""
    generations = await db.generations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return generations

# Include the router in the main app
app.include_router(api_router)

# Configure CORS with secure defaults
cors_origins = os.environ.get('CORS_ORIGINS', '*')
if cors_origins == '*':
    allowed_origins = ['*']
else:
    allowed_origins = [origin.strip() for origin in cors_origins.split(',')]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False if '*' in allowed_origins else True,
    allow_origins=allowed_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    max_age=3600,
)

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown."""
    client.close()
    logger.info("Database connection closed")
