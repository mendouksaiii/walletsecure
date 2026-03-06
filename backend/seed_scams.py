import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

from config import settings
from models import ScamContract, ChainType, RiskLevel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# A seed list of notorious scam contracts, phishing routers, and known drainers
SEED_DATA = [
    {
        "contract_address": "0x0000000000000000000000000000000000000001",
        "chain": ChainType.ETHEREUM,
        "risk_level": RiskLevel.CRITICAL,
        "description": "Known Pink Drainer phishing contract used in multiple Twitter hacks.",
        "scam_type": "Wallet Drainer",
        "added_by": "System_Seed",
        "verified": True
    },
    {
        "contract_address": "0x1234567890123456789012345678901234567890",
        "chain": ChainType.BSC,
        "risk_level": RiskLevel.HIGH,
        "description": "Fake PancakeSwap Router targeting high-value wallets.",
        "scam_type": "Phishing Router",
        "added_by": "System_Seed",
        "verified": True
    },
    {
        "contract_address": "0x8888888888888888888888888888888888888888",
        "chain": ChainType.POLYGON,
        "risk_level": RiskLevel.CRITICAL,
        "description": "Monkey Drainer associated proxy contract.",
        "scam_type": "Wallet Drainer",
        "added_by": "System_Seed",
        "verified": True
    },
    {
        "contract_address": "0x9999999999999999999999999999999999999999",
        "chain": ChainType.ETHEREUM,
        "risk_level": RiskLevel.HIGH,
        "description": "Honeypot token contract - prevents selling.",
        "scam_type": "Honeypot",
        "added_by": "System_Seed",
        "verified": True
    },
    {
        "contract_address": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        "chain": ChainType.ARBITRUM,
        "risk_level": RiskLevel.CRITICAL,
        "description": "Inferno Drainer signature phishing payload contract.",
        "scam_type": "Wallet Drainer",
        "added_by": "System_Seed",
        "verified": True
    }
]

async def seed_database():
    """Connect to MongoDB and insert the seed data."""
    logger.info("Starting Scam Database Seeding Process...")
    
    try:
        # Connect to MongoDB
        logger.info(f"Connecting to MongoDB at {settings.mongo_url}...")
        client = AsyncIOMotorClient(settings.mongo_url)
        db = client[settings.db_name]
        collection = db.scam_contracts
        
        # Prepare the documents using Pydantic validation
        documents = []
        for data in SEED_DATA:
            try:
                # Validates the data against the ScamContract model
                contract = ScamContract(**data)
                
                # Convert to dict for MongoDB insertion
                doc = contract.model_dump()
                doc["added_date"] = doc["added_date"].isoformat()
                documents.append(doc)
            except Exception as e:
                logger.error(f"Failed to validate contract {data.get('contract_address')}: {e}")
        
        if not documents:
            logger.error("No valid documents to insert. Exiting.")
            return

        # Insert into MongoDB
        # Avoid duplicates by clearing the seed addresses first if they already exist
        addresses = [doc["contract_address"] for doc in documents]
        await collection.delete_many({"contract_address": {"$in": addresses}})
        
        result = await collection.insert_many(documents)
        logger.info(f"Successfully inserted {len(result.inserted_ids)} scam contracts into the database.")
        
    except Exception as e:
        logger.error(f"A fatal error occurred during seeding: {e}")
    finally:
        client.close()
        logger.info("Database connection closed.")

if __name__ == "__main__":
    asyncio.run(seed_database())
