from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ChainType(str, Enum):
    ETHEREUM = "eth-mainnet"
    BSC = "bnb-mainnet"
    POLYGON = "polygon-mainnet"
    ARBITRUM = "arb-mainnet"
    OPTIMISM = "opt-mainnet"
    BASE = "base-mainnet"

class RiskLevel(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    SAFE = "safe"

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address')
        return v.lower()

class WalletLoginResponse(BaseModel):
    access_token: str
    wallet_address: str
    is_premium: bool = False

class User(BaseModel):
    wallet_address: str
    telegram_chat_id: Optional[str] = None
    email: Optional[str] = None
    is_premium: bool = False
    subscription_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)

class RiskItem(BaseModel):
    risk_type: str
    risk_level: RiskLevel
    description: str
    contract_address: Optional[str] = None
    recommended_action: str
    severity_score: int = 0

class TokenApproval(BaseModel):
    token_address: str
    token_symbol: str
    token_name: str
    spender_address: str
    spender_name: Optional[str] = None
    approved_amount: str
    is_unlimited: bool = False
    is_risky: bool = False
    risk_reason: Optional[str] = None
    chain: ChainType
    last_updated: datetime = Field(default_factory=datetime.utcnow)

class WalletScanRequest(BaseModel):
    wallet_address: str
    chains: List[ChainType] = [ChainType.ETHEREUM]
    
    @validator('wallet_address')
    def validate_wallet_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid wallet address')
        return v.lower()

class WalletScanResponse(BaseModel):
    wallet_address: str
    chains_scanned: List[ChainType]
    security_score: int
    risk_level: RiskLevel
    risks_found: List[RiskItem]
    total_approvals: int
    risky_approvals: int
    scan_timestamp: datetime = Field(default_factory=datetime.utcnow)
    recommendations: List[str] = []

class ScamContract(BaseModel):
    contract_address: str
    chain: ChainType
    risk_level: RiskLevel
    description: str
    scam_type: str
    added_by: str
    verified: bool = False
    added_date: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('contract_address')
    def validate_contract_address(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid contract address')
        return v.lower()

class MonitoringTask(BaseModel):
    wallet_address: str
    user_id: str
    chains: List[ChainType]
    alert_email: bool = False
    alert_telegram: bool = False
    active: bool = True
    last_scan: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AlertConfig(BaseModel):
    wallet_address: str
    email: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    alert_on_new_approval: bool = True
    alert_on_risky_transaction: bool = True
    alert_on_scam_interaction: bool = True

class PaymentTransaction(BaseModel):
    session_id: str
    user_wallet: str
    package: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"
    status: str = "initiated"
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RevokeApprovalRequest(BaseModel):
    wallet_address: str
    token_address: str
    spender_address: str
    chain: ChainType
    
    @validator('wallet_address', 'token_address', 'spender_address')
    def validate_addresses(cls, v):
        if not v.startswith('0x') or len(v) != 42:
            raise ValueError('Invalid Ethereum address')
        return v.lower()
