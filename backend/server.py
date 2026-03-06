from fastapi import FastAPI, HTTPException, Request, Depends, BackgroundTasks, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
import logging
import asyncio
import secrets
import stripe
from pathlib import Path
from eth_account.messages import encode_defunct
from web3.auto import w3

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    HAS_RATE_LIMIT = True
except ImportError:
    HAS_RATE_LIMIT = False

from config import settings
from database import connect_to_mongodb, close_mongodb_connection, get_database
from models import (
    WalletLoginRequest, WalletLoginResponse, WalletScanRequest, WalletScanResponse,
    ScamContract, ChainType, RiskLevel, User, AlertConfig, MonitoringTask,
    PaymentTransaction, TokenApproval, RevokeApprovalRequest
)
from services.security_scan_service import security_scan_service
from services.alchemy_service import alchemy_service
from services.revoke_service import revoke_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def run_monitoring_loop():
    """Background task to scan premium wallets periodically"""
    while True:
        try:
            db = get_database()
            if db is not None:
                # Find users with monitoring enabled (premium users with email/telegram configured)
                users = await db.users.find({
                    "is_premium": True,
                    "$or": [{"email": {"$ne": None}}, {"telegram_chat_id": {"$ne": None}}]
                }).to_list(100)
                
                for user in users:
                    wallet = user.get("wallet_address")
                    # In a real system we'd enqueue a task to handle this scan rather than blocking
                    # Example: await security_scan_service.scan_wallet(WalletScanRequest(wallet_address=wallet))
                    logger.info(f"Running background monitoring scan for {wallet}")
                    
            await asyncio.sleep(3600) # Run every hour (simulated)
        except Exception as e:
            logger.error(f"Monitoring loop error: {e}")
            await asyncio.sleep(60)

# In-memory nonce store (use Redis in multi-worker production)
_nonce_store: dict = {}

# Security bearer scheme
security_scheme = HTTPBearer(auto_error=False)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    db = get_database()
    if db is not None:
        security_scan_service.set_db(db)
    task = asyncio.create_task(run_monitoring_loop())
    yield
    task.cancel()
    await close_mongodb_connection()
    await alchemy_service.close()

app = FastAPI(
    title="WalletSecure API",
    description="Web3 Wallet Security Scanner & Monitoring Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Rate limiting
if HAS_RATE_LIMIT:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def create_access_token(wallet_address: str, is_admin: bool = False) -> str:
    """Create JWT access token"""
    payload = {
        "wallet_address": wallet_address,
        "is_admin": is_admin,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def verify_token(token: str) -> Optional[dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        return payload
    except:
        return None

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme),
) -> dict:
    """Dependency: extract and verify the current authenticated user from JWT"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

async def require_admin(
    user: dict = Depends(get_current_user),
) -> dict:
    """Dependency: require admin role"""
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

def require_db(db=Depends(get_database)):
    """Dependency: ensure database is available"""
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db

@app.get("/api/")
async def root():
    return {"message": "WalletSecure API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# ===== AUTH ENDPOINTS =====

@app.get("/api/auth/nonce/{wallet_address}")
async def get_nonce(wallet_address: str):
    """Generate and store a server-side nonce for wallet login"""
    nonce = secrets.token_hex(16)
    _nonce_store[wallet_address.lower()] = {
        "nonce": nonce,
        "expires": datetime.utcnow() + timedelta(minutes=5)
    }
    message = f"Welcome to WalletSecure!\n\nSign this message to verify you own this wallet.\n\nWallet: {wallet_address}\nNonce: {nonce}"
    return {"nonce": nonce, "message": message}

@app.post("/api/auth/wallet-login", response_model=WalletLoginResponse)
async def wallet_login(request: WalletLoginRequest, db=Depends(require_db)):
    """Authenticate user with wallet signature (server-side nonce verified)"""
    try:
        wallet_address = request.wallet_address.lower()
        
        # Verify server-side nonce exists and hasn't expired
        stored = _nonce_store.pop(wallet_address, None)
        if not stored:
            raise HTTPException(status_code=401, detail="Nonce not found. Request /api/auth/nonce first.")
        if datetime.utcnow() > stored["expires"]:
            raise HTTPException(status_code=401, detail="Nonce expired. Request a new one.")
        
        # Verify the signed message contains our nonce
        if stored["nonce"] not in request.message:
            raise HTTPException(status_code=401, detail="Message does not contain valid nonce")
        
        # Verify cryptographic signature
        try:
            message = encode_defunct(text=request.message)
            recovered_address = w3.eth.account.recover_message(message, signature=request.signature)
            
            if recovered_address.lower() != wallet_address:
                raise HTTPException(status_code=401, detail="Invalid signature")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Signature verification failed: {e}")
            raise HTTPException(status_code=401, detail="Signature verification failed")
        
        # Check if user exists
        user = await db.users.find_one({"wallet_address": wallet_address})
        
        # Check admin list from config
        is_admin = wallet_address in getattr(settings, 'admin_wallets_list', [])
        
        if not user:
            new_user = User(
                wallet_address=wallet_address,
                is_premium=False
            )
            await db.users.insert_one(new_user.model_dump())
            is_premium = False
        else:
            is_premium = user.get("is_premium", False)
            await db.users.update_one(
                {"wallet_address": wallet_address},
                {"$set": {"last_login": datetime.utcnow()}}
            )
        
        access_token = create_access_token(wallet_address, is_admin=is_admin)
        
        return WalletLoginResponse(
            access_token=access_token,
            wallet_address=wallet_address,
            is_premium=is_premium
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")

# ===== SCAN ENDPOINTS =====

@app.post("/api/scan/wallet", response_model=WalletScanResponse)
async def scan_wallet(request: WalletScanRequest, db=Depends(require_db)):
    """Scan wallet for security risks"""
    try:
        result = await security_scan_service.scan_wallet(request)
        return result
    except Exception as e:
        logger.error(f"Scan error: {e}")
        raise HTTPException(status_code=500, detail="Scan failed")

@app.get("/api/scan/history/{wallet_address}")
async def get_scan_history(wallet_address: str, db=Depends(require_db)):
    """Get scan history for wallet"""
    try:
        scans = await db.wallet_scans.find(
            {"wallet_address": wallet_address.lower()},
            {"_id": 0}
        ).sort("scan_timestamp", -1).limit(10).to_list(10)
        
        return {"scans": scans, "count": len(scans)}
    except Exception as e:
        logger.error(f"Error fetching scan history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scan history")

@app.get("/api/scan/approvals/{wallet_address}")
async def get_approvals(wallet_address: str, chain: ChainType, db=Depends(require_db)):
    """Get token approvals for wallet on specific chain"""
    try:
        approvals = await security_scan_service._get_wallet_approvals(wallet_address, chain)
        return {
            "wallet_address": wallet_address,
            "chain": chain,
            "approvals": [a.model_dump() for a in approvals],
            "count": len(approvals)
        }
    except Exception as e:
        logger.error(f"Error fetching approvals: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch approvals")

@app.get("/api/wallet/info/{wallet_address}")
async def get_wallet_info(wallet_address: str, db=Depends(require_db)):
    """Get comprehensive wallet info for the dashboard"""
    try:
        address = wallet_address.lower()
        chain = ChainType.ETHEREUM

        # 1. Get ETH balance via Alchemy RPC
        from services.alchemy_service import CHAIN_RPC_URLS
        import httpx
        eth_balance = "0"
        eth_usd = "$0.00"
        try:
            url = CHAIN_RPC_URLS.get(chain)
            if url:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, json={
                        "jsonrpc": "2.0",
                        "method": "eth_getBalance",
                        "params": [address, "latest"],
                        "id": 1
                    })
                    data = resp.json()
                    if "result" in data:
                        wei = int(data["result"], 16)
                        eth_val = wei / 1e18
                        eth_balance = f"{eth_val:.4f} ETH"
                        eth_usd = f"${eth_val * 3000:.2f}"  # Approximate price
        except Exception as e:
            logger.warning(f"ETH balance fetch failed: {e}")

        # 2. Get token balances
        token_balances = await alchemy_service.get_token_balances(address, chain)

        # 3. Get transaction count
        tx_count = await alchemy_service.get_transaction_count(address, chain)

        # 4. Get latest scan from database
        latest_scan = None
        scan_history = []
        try:
            scans = await db.wallet_scans.find(
                {"wallet_address": address},
                {"_id": 0}
            ).sort("scan_timestamp", -1).limit(10).to_list(10)
            if scans:
                latest_scan = scans[0]
                scan_history = scans
        except Exception:
            pass

        # 5. Get current approvals
        approvals = await security_scan_service._get_wallet_approvals(address, chain)
        total_approvals = len(approvals)
        risky_approvals = len([a for a in approvals if a.is_risky])

        return {
            "wallet_address": address,
            "eth_balance": eth_balance,
            "eth_usd": eth_usd,
            "token_count": len(token_balances),
            "tx_count": tx_count,
            "total_approvals": total_approvals,
            "risky_approvals": risky_approvals,
            "approvals": [a.model_dump() for a in approvals],
            "latest_scan": latest_scan,
            "scan_history": scan_history,
        }
    except Exception as e:
        logger.error(f"Error fetching wallet info: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch wallet info")

@app.post("/api/scan/revoke")
async def get_revoke_payload(request: RevokeApprovalRequest):
    """Generate unsigned transaction payload to revoke a token approval"""
    try:
        payload = revoke_service.generate_revoke_payload(
            token_address=request.token_address,
            spender_address=request.spender_address
        )
        return payload
    except Exception as e:
        logger.error(f"Error generating revoke payload: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ===== SCAM CONTRACT MANAGEMENT =====

@app.get("/api/scam-contracts")
async def get_scam_contracts(chain: Optional[ChainType] = None, db=Depends(require_db)):
    """Get list of scam contracts"""
    try:
        query = {}
        if chain:
            query["chain"] = chain.value
        
        contracts = await db.scam_contracts.find(query, {"_id": 0}).to_list(1000)
        return {"contracts": contracts, "count": len(contracts)}
    except Exception as e:
        logger.error(f"Error fetching scam contracts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scam contracts")

@app.post("/api/scam-contracts")
async def add_scam_contract(
    contract: ScamContract,
    admin: dict = Depends(require_admin),
    db=Depends(require_db),
):
    """Add new scam contract (admin only — requires JWT with is_admin=True)"""
    try:
        doc = contract.model_dump()
        doc["added_date"] = doc["added_date"].isoformat()
        
        await db.scam_contracts.insert_one(doc)
        return {"message": "Scam contract added", "contract_address": contract.contract_address}
    except Exception as e:
        logger.error(f"Error adding scam contract: {e}")
        raise HTTPException(status_code=500, detail="Failed to add scam contract")

@app.delete("/api/scam-contracts/{contract_address}")
async def delete_scam_contract(
    contract_address: str,
    chain: ChainType,
    admin: dict = Depends(require_admin),
    db=Depends(require_db),
):
    """Delete scam contract (admin only — requires JWT with is_admin=True)"""
    try:
        result = await db.scam_contracts.delete_one({
            "contract_address": contract_address.lower(),
            "chain": chain.value
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contract not found")
        
        return {"message": "Scam contract deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting scam contract: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete scam contract")

# ===== MONITORING & ALERTS =====

@app.post("/api/monitoring/enable")
async def enable_monitoring(
    config: AlertConfig,
    user_auth: dict = Depends(get_current_user),
    db=Depends(require_db),
):
    """Enable continuous monitoring for wallet (authenticated users only)"""
    try:
        user = await db.users.find_one({"wallet_address": config.wallet_address.lower()})
        if not user or not user.get("is_premium", False):
            raise HTTPException(status_code=403, detail="Premium subscription required")
        
        await db.users.update_one(
            {"wallet_address": config.wallet_address.lower()},
            {"$set": {
                "email": config.email,
                "telegram_chat_id": config.telegram_chat_id,
            }}
        )
        
        return {"message": "Monitoring enabled", "wallet_address": config.wallet_address}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enabling monitoring: {e}")
        raise HTTPException(status_code=500, detail="Failed to enable monitoring")

# ===== PAYMENT ENDPOINTS =====

PACKAGES = {
    "premium_monthly": {"name": "Premium Monthly", "amount": 9.99, "duration_days": 30},
    "premium_yearly": {"name": "Premium Yearly", "amount": 99.99, "duration_days": 365}
}

@app.post("/api/payments/create-checkout")
async def create_checkout(package_id: str, wallet_address: str, request: Request, db=Depends(get_database)):
    """Create Stripe checkout session"""
    try:
        if package_id not in PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package")
        
        package = PACKAGES[package_id]
        
        # Get origin from request
        origin = request.headers.get("origin", "https://walletsecure.preview.emergentagent.com")
        
        # Initialize stripe with our API key
        stripe.api_key = settings.stripe_api_key
        
        # Create checkout session natively via stripe SDK
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": package["name"]},
                    "unit_amount": int(package["amount"] * 100),  # in cents
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{origin}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin}/pricing",
            metadata={
                "package_id": package_id,
                "duration_days": str(package["duration_days"]),
                "wallet_address": wallet_address.lower()
            }
        )
        
        # Save payment transaction
        transaction = PaymentTransaction(
            session_id=session.id,
            user_wallet="pending",
            package=package_id,
            amount=package["amount"],
            currency="usd",
            payment_status="pending",
            status="initiated",
            metadata={"package_id": package_id}
        )
        
        doc = transaction.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        
        await db.payment_transactions.insert_one(doc)
        
        return {"url": session.url, "session_id": session.id}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

@app.get("/api/payments/status/{session_id}")
async def get_payment_status(session_id: str, db=Depends(get_database)):
    """Get payment status"""
    try:
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment status")

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request, db=Depends(get_database)):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        # 1. Mathematically verify the webhook signature to guarantee it came from Stripe
        try:
            event = stripe.Webhook.construct_event(
                payload=body,
                sig_header=signature,
                secret=settings.webhook_secret
            )
        except ValueError as e:
            # Invalid payload
            logger.error(f"Invalid Stripe webhook payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature - This prevents hackers from faking payments!
            logger.error(f"Invalid Stripe webhook signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")

        # 2. Extract the session ID from the verified event object
        if event["type"] == "checkout.session.completed":
            session_id = event["data"]["object"]["id"]
            
            # Update transaction status
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            
            if transaction and transaction.get("payment_status") != "paid":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "status": "completed",
                        "updated_at": datetime.utcnow().isoformat()
                    }}
                )
                
                # Upgrade user to premium
                # Extract metadata from the verified Stripe event object
                stripe_session = event["data"]["object"]
                metadata = stripe_session.get("metadata") or {}
                duration_days = int(metadata.get("duration_days", 30))
                wallet_address = metadata.get("wallet_address")
                
                if wallet_address:
                    await db.users.update_one(
                        {"wallet_address": wallet_address},
                        {"$set": {
                            "is_premium": True,
                            "subscription_end": datetime.utcnow() + timedelta(days=duration_days)
                        }}
                    )
        
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")

# ===== ADMIN ENDPOINTS =====

@app.get("/api/admin/stats")
async def get_admin_stats(
    admin: dict = Depends(require_admin),
    db=Depends(require_db),
):
    """Get platform statistics (admin only — requires JWT with is_admin=True)"""
    try:
        total_users = await db.users.count_documents({})
        premium_users = await db.users.count_documents({"is_premium": True})
        total_scans = await db.wallet_scans.count_documents({})
        scam_contracts = await db.scam_contracts.count_documents({})
        
        return {
            "total_users": total_users,
            "premium_users": premium_users,
            "total_scans": total_scans,
            "scam_contracts_count": scam_contracts,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching admin stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch statistics")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
