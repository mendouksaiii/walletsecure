import asyncio
import httpx
from eth_account import Account
import json
import logging
from eth_account.messages import encode_defunct

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

API_BASE = "http://127.0.0.1:8001"

async def test_auth_flow():
    logger.info("--- Testing Authentication Flow ---")
    
    # 1. Create a dynamic test wallet
    Account.enable_unaudited_hdwallet_features()
    acct = Account.create()
    test_address = acct.address
    logger.info(f"Generated test wallet: {test_address}")

    async with httpx.AsyncClient() as client:
        # 2. Get Nonce
        logger.info("[1/3] Fetching login nonce...")
        res = await client.get(f"{API_BASE}/api/auth/nonce/{test_address}")
        assert res.status_code == 200, f"Failed to get nonce: {res.text}"
        nonce_data = res.json()
        message_to_sign = nonce_data["message"]
        logger.info(f"Received message to sign: {message_to_sign}")

        # 3. Sign Message
        msg = encode_defunct(text=message_to_sign)
        signed_message = acct.sign_message(msg)
        signature_hex = signed_message.signature.hex()
        logger.info("[2/3] Cryptographically signed message.")

        # 4. Login
        logger.info("[3/3] Exchanging signature for JWT...")
        login_payload = {
            "wallet_address": test_address,
            "message": message_to_sign,
            "signature": signature_hex
        }
        res = await client.post(f"{API_BASE}/api/auth/wallet-login", json=login_payload)
        assert res.status_code == 200, f"Login failed: {res.text}"
        login_data = res.json()
        token = login_data["access_token"]
        logger.info(f"Login successful! JWT Token obtained: {token[:20]}...")
        
        return token, test_address

async def test_protected_routes(token: str, test_address: str):
    logger.info("--- Testing Protected Routes & Security Limits ---")
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # 1. Test unauthenticated request to a protected route (should fail)
        logger.info("[1/4] Testing /api/monitoring/enable without token...")
        alert_payload = {
            "wallet_address": test_address,
            "telegram_chat_id": "test_123",
            "email": "test@example.com",
            "alert_on_new_approval": True
        }
        res = await client.post(f"{API_BASE}/api/monitoring/enable", json=alert_payload)
        assert res.status_code == 403 or res.status_code == 401, f"Security flaw: accessed protected route without token - got {res.status_code}"
        logger.info("Blocked successfully (401/403)")
        
        # 2. Test authenticated request
        logger.info("[2/4] Testing /api/monitoring/enable WITH token...")
        res = await client.post(f"{API_BASE}/api/monitoring/enable", headers=headers, json=alert_payload)
        # It should return 403 Premium Subscription Required because new users aren't premium by default
        assert res.status_code == 403, f"Authenticated access failed or Premium bypass allowed: {res.text}"
        logger.info("Protected route accessed successfully")
        
        # 3. Test Admin privileges (Test wallet is NOT an admin)
        logger.info("[3/4] Testing Admin boundary traversal (Attempting to fetch admin stats)...")
        res = await client.get(f"{API_BASE}/api/admin/stats", headers=headers)
        assert res.status_code == 403, "Security flaw: Non-admin accessed admin stats"
        logger.info("Admin boundary held successfully (403 Forbidden)")

async def test_deep_scanner():
    logger.info("--- Testing Live Deep Scanner ---")
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Test Vitalik's wallet
        target_wallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        logger.info(f"[1/1] Deep scanning highly active wallet: {target_wallet}")
        
        payload = {
            "wallet_address": target_wallet,
            "chains": ["eth-mainnet"]
        }
        res = await client.post(f"{API_BASE}/api/scan/wallet", json=payload)
        assert res.status_code == 200, f"Scan failed: {res.text}"
        
        data = res.json()
        logger.info(f"Scan complete. Score: {data.get('security_score')}/100")
        logger.info(f"Total Risks Found: {len(data.get('risks_found', []))}")
        
async def run_all():
    try:
        logger.info("STARTING DEEP INTEGRATION TEST SUITE")
        token, wallet = await test_auth_flow()
        await test_protected_routes(token, wallet)
        await test_deep_scanner()
        logger.info("ALL DEEP TESTS PASSED SUCCESSFULLY ✅")
    except AssertionError as e:
        logger.error(f"TEST FAILED ❌ : {str(e)}")
    except Exception as e:
        logger.error(f"UNEXPECTED ERROR ❌ : {str(e)}")

if __name__ == "__main__":
    asyncio.run(run_all())
