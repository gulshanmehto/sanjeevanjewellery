"""
StudioJewelai Backend - Main Application Entry Point
Modular FastAPI application with proper separation of concerns
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config.settings import settings
from services.database import DatabaseService
from routes import health, auth, user, generation, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown"""
    # Startup
    await DatabaseService.connect()
    print(f"✅ Connected to MongoDB: {settings.DB_NAME}")
    yield
    # Shutdown
    await DatabaseService.disconnect()
    print("✅ Disconnected from MongoDB")


# Initialize FastAPI application
app = FastAPI(
    title="StudioJewelai API",
    description="AI-powered jewelry image generation platform",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(generation.router, prefix="/api/generation", tags=["Generation"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "StudioJewelai API v2.0",
        "status": "running",
        "docs": "/docs"
    }
