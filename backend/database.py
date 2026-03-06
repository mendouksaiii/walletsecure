from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

async def connect_to_mongodb():
    """Connect to MongoDB on startup – gracefully degrades if unavailable"""
    try:
        db_instance.client = AsyncIOMotorClient(
            settings.mongo_url,
            serverSelectionTimeoutMS=5000,   # fail fast
            connectTimeoutMS=5000,
        )
        db_instance.db = db_instance.client[settings.db_name]
        await db_instance.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB")
    except Exception as e:
        logger.warning(f"MongoDB is unavailable – running in degraded mode: {e}")
        db_instance.client = None
        db_instance.db = None

async def close_mongodb_connection():
    """Close MongoDB connection on shutdown"""
    if db_instance.client:
        db_instance.client.close()
        logger.info("Closed MongoDB connection")

def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db_instance.db
