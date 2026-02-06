"""
Application Settings - Centralized configuration management
Uses Pydantic for validation and environment variable loading
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings with validation"""
    
    # MongoDB Configuration
    MONGO_URL: str = "mongodb://localhost:27017/"
    DB_NAME: str = "jewelai"
    
    # Gemini AI Configuration
    GEMINI_API_KEY: str = ""  # Must be set via environment variable or .env file
    GEMINI_MODEL: str = "gemini-3-pro-image-preview"
    GEMINI_TIMEOUT: int = 300  # seconds
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # CORS Configuration - will be parsed from comma-separated string
    CORS_ORIGINS: str = "http://localhost:31000,http://localhost:3000"
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Admin Configuration
    ADMIN_USERNAME: str = "admin"
    ADMIN_PASSWORD_HASH: str = "$2b$12$default_hash"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from string"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
        return self.CORS_ORIGINS
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Global settings instance
settings = Settings()
