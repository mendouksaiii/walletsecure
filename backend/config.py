from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    mongo_url: str
    db_name: str
    cors_origins: str = "*"
    alchemy_api_key: str = "demo_key"
    stripe_api_key: str
    sendgrid_api_key: str = ""
    sender_email: str = "noreply@walletsecure.com"
    etherscan_api_key: str = "demo_key"
    telegram_bot_token: str = ""
    jwt_secret: str = "dev_secret_key_change_in_production"
    webhook_secret: str
    admin_wallets: str = ""  # Comma-separated list of admin wallet addresses
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def admin_wallets_list(self) -> List[str]:
        if not self.admin_wallets:
            return []
        return [w.strip().lower() for w in self.admin_wallets.split(",")]

settings = Settings()
