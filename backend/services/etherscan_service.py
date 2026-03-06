import httpx
from typing import List, Dict, Optional
import logging
from config import settings

logger = logging.getLogger(__name__)

CHAIN_ETHERSCAN_IDS = {
    "eth-mainnet": "1",
    "polygon-mainnet": "137",
    "arb-mainnet": "42161",
    "opt-mainnet": "10",
    "base-mainnet": "8453",
    "bnb-mainnet": "56",
}

class EtherscanService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        # We don't strictly *need* an API key for Etherscan public endpoints, 
        # but it rate limits to 5 requests / sec without one, which is plenty for our use case right now.
        
    async def get_erc20_transfers(self, wallet_address: str, chain: str) -> List[Dict]:
        """Fetch all ERC20 token transfers for a wallet to find what tokens they own/interacted with"""
        try:
            chain_id = CHAIN_ETHERSCAN_IDS.get(chain)
            if not chain_id:
                return []
                
            url = "https://api.etherscan.io/v2/api"
            params = {
                "chainid": chain_id,
                "module": "account",
                "action": "tokentx",
                "address": wallet_address,
                "startblock": 0,
                "endblock": 99999999,
                "sort": "desc",
                "apikey": settings.etherscan_api_key
            }
            
            response = await self.client.get(url, params=params)
            data = response.json()
            
            if data.get("status") == "1" and data.get("message") == "OK":
                return data.get("result", [])
                
            # Etherscan returns status 0 for "No transactions found"
            if data.get("message") == "No transactions found":
                return []
                
            logger.warning(f"Etherscan error: {data.get('message')} - {data.get('result')}")
            return []
            
        except Exception as e:
            logger.error(f"Error fetching Etherscan token txs: {e}")
            return []

    async def get_contract_abi(self, contract_address: str, chain: str) -> Optional[str]:
        """Fetch ABI for a contract to check if it's verified (often used for risk scoring)"""
        try:
            url = CHAIN_ETHERSCAN_URLS.get(chain)
            if not url:
                return None
                
            params = {
                "module": "contract",
                "action": "getabi",
                "address": contract_address,
            }
            
            response = await self.client.get(url, params=params)
            data = response.json()
            
            if data.get("status") == "1":
                return data.get("result")
                
            return None
        except Exception as e:
            return None

    async def close(self):
        await self.client.aclose()

etherscan_service = EtherscanService()
