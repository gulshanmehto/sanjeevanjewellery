"""Database service for MongoDB operations."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional, List, Dict, Any
from datetime import datetime

from config import settings

logger = logging.getLogger(__name__)


class DatabaseService:
    """MongoDB database service with connection pooling."""
    
    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None
    
    @classmethod
    async def connect(cls) -> None:
        """Initialize database connection."""
        try:
            cls._client = AsyncIOMotorClient(
                settings.MONGO_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=10000
            )
            cls._db = cls._client[settings.DB_NAME]
            
            # Test connection
            await cls._client.admin.command("ping")
            logger.info("MongoDB connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise
    
    @classmethod
    async def disconnect(cls) -> None:
        """Close database connection."""
        if cls._client:
            cls._client.close()
            logger.info("MongoDB disconnected")
    
    @classmethod
    async def health_check(cls) -> bool:
        """Check database health status."""
        try:
            await cls._client.admin.command("ping")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
    
    @classmethod
    def get_db(cls):
        """Get database instance."""
        if cls._db is None:
            raise Exception("Database not connected. Call connect() first.")
        return cls._db
    
    # User operations
    @classmethod
    async def create_user(cls, user_data: Dict[str, Any]) -> str:
        """Create a new user."""
        user_data['created_at'] = datetime.utcnow()
        user_data['credits'] = user_data.get('credits', 100)
        result = await cls._db.users.insert_one(user_data)
        return str(result.inserted_id)
    
    @classmethod
    async def get_user(cls, query: dict) -> Optional[Dict[str, Any]]:
        """Get user by query."""
        return await cls._db.users.find_one(query)
    
    @classmethod
    async def get_user_credits(cls, user_id: str) -> int:
        """Get user credits."""
        user = await cls.get_user({"_id": user_id})
        return user.get("credits", 0) if user else 0
    
    @classmethod
    async def update_user_credits(cls, user_id: str, amount: int) -> bool:
        """Update user credits (can be positive or negative)."""
        result = await cls._db.users.update_one(
            {"_id": user_id},
            {"$inc": {"credits": amount}}
        )
        return result.modified_count > 0
    
    @classmethod
    async def update_user_login(cls, user_id: str):
        """Update user's last login timestamp."""
        await cls._db.users.update_one(
            {"_id": user_id},
            {"$set": {"last_login": datetime.utcnow()}}
        )
    
    # Generation history operations
    @classmethod
    async def save_generation(cls, generation_data: Dict[str, Any]) -> str:
        """Save a generation record."""
        generation_data['created_at'] = datetime.utcnow()
        result = await cls._db.generations.insert_one(generation_data)
        return str(result.inserted_id)
    
    @classmethod
    async def get_user_generations(cls, user_id: str, skip: int = 0, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's generation history."""
        cursor = cls._db.generations.find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
        return await cursor.to_list(length=limit)
    
    @classmethod
    async def count_user_generations(cls, user_id: str) -> int:
        """Count user's generations."""
        return await cls._db.generations.count_documents({"user_id": user_id})
    
    # Admin/Stats operations
    @classmethod
    async def get_total_users(cls) -> int:
        """Get total user count."""
        return await cls._db.users.count_documents({})
    
    @classmethod
    async def get_total_generations(cls) -> int:
        """Get total generation count."""
        return await cls._db.generations.count_documents({})
    
    @classmethod
    async def get_active_users_today(cls) -> int:
        """Get count of users active today."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        return await cls._db.users.count_documents({"last_login": {"$gte": today_start}})
    
    @classmethod
    async def get_generations_today(cls) -> int:
        """Get count of generations created today."""
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        return await cls._db.generations.count_documents({"created_at": {"$gte": today_start}})
