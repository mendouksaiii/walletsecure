import httpx
from typing import List, Dict, Optional, Any
from config import settings
from models import ChainType, TokenApproval, RiskItem, RiskLevel
import logging

logger = logging.getLogger(__name__)

CHAIN_RPC_URLS = {
    ChainType.ETHEREUM: f"https://eth-mainnet.g.alchemy.com/v2/{settings.alchemy_api_key}",
    ChainType.POLYGON: f"https://polygon-mainnet.g.alchemy.com/v2/{settings.alchemy_api_key}",
    ChainType.ARBITRUM: f"https://arb-mainnet.g.alchemy.com/v2/{settings.alchemy_api_key}",
    ChainType.OPTIMISM: f"https://opt-mainnet.g.alchemy.com/v2/{settings.alchemy_api_key}",
    ChainType.BASE: f"https://base-mainnet.g.alchemy.com/v2/{settings.alchemy_api_key}",
    ChainType.BSC: "https://bsc-dataseed.binance.org/",
}

ERC20_APPROVE_TOPIC = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"

class AlchemyService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get_token_balances(self, wallet_address: str, chain: ChainType) -> List[Dict]:
        """Get ERC-20 token balances for a wallet"""
        try:
            url = CHAIN_RPC_URLS.get(chain)
            if not url:
                return []
            
            payload = {
                "jsonrpc": "2.0",
                "method": "alchemy_getTokenBalances",
                "params": [wallet_address, "erc20"],
                "id": 1
            }
            
            response = await self.client.post(url, json=payload)
            data = response.json()
            
            if "result" in data:
                balances = data["result"].get("tokenBalances", [])
                return [b for b in balances if int(b.get("tokenBalance", "0"), 16) > 0]
            
            return []
        except Exception as e:
            logger.error(f"Error fetching token balances: {e}")
            return []
    
    async def get_token_metadata(self, token_address: str, chain: ChainType) -> Optional[Dict]:
        """Get token metadata (name, symbol, decimals)"""
        try:
            url = CHAIN_RPC_URLS.get(chain)
            if not url:
                return None
            
            payload = {
                "jsonrpc": "2.0",
                "method": "alchemy_getTokenMetadata",
                "params": [token_address],
                "id": 1
            }
            
            response = await self.client.post(url, json=payload)
            data = response.json()
            
            if "result" in data:
                return data["result"]
            
            return None
        except Exception as e:
            logger.error(f"Error fetching token metadata: {e}")
            return None
    
    async def get_approval_events(self, wallet_address: str, chain: ChainType) -> List[Dict]:
        """Get token approval events for a wallet"""
        try:
            url = CHAIN_RPC_URLS.get(chain)
            if not url:
                return []
            
            # Step 1: Get the latest block number
            block_payload = {
                "jsonrpc": "2.0",
                "method": "eth_blockNumber",
                "params": [],
                "id": 1
            }
            block_resp = await self.client.post(url, json=block_payload)
            block_data = block_resp.json()
            
            if "result" not in block_data:
                logger.error(f"Could not get latest block: {block_data}")
                return []
            
            latest_block = int(block_data["result"], 16)
            # Scan the last ~100,000 blocks (~2 weeks on Ethereum)
            from_block = max(0, latest_block - 100_000)
            
            # Step 2: Query approval events within that range
            payload = {
                "jsonrpc": "2.0",
                "method": "eth_getLogs",
                "params": [{
                    "fromBlock": hex(from_block),
                    "toBlock": "latest",
                    "topics": [ERC20_APPROVE_TOPIC, f"0x000000000000000000000000{wallet_address[2:].lower()}"],
                }],
                "id": 2
            }
            
            response = await self.client.post(url, json=payload)
            data = response.json()
            
            if "error" in data:
                logger.error(f"Alchemy eth_getLogs error: {data['error']}")
                return []
            
            if "result" in data:
                logger.info(f"Found {len(data['result'])} approval events for {wallet_address}")
                return data["result"]
            
            return []
        except Exception as e:
            logger.error(f"Error fetching approval events: {e}")
            return []
    
    async def get_transaction_count(self, wallet_address: str, chain: ChainType) -> int:
        """Get transaction count for wallet"""
        try:
            url = CHAIN_RPC_URLS.get(chain)
            if not url:
                return 0
            
            payload = {
                "jsonrpc": "2.0",
                "method": "eth_getTransactionCount",
                "params": [wallet_address, "latest"],
                "id": 1
            }
            
            response = await self.client.post(url, json=payload)
            data = response.json()
            
            if "result" in data:
                return int(data["result"], 16)
            
            return 0
        except Exception as e:
            logger.error(f"Error fetching transaction count: {e}")
            return 0
    
    async def close(self):
        await self.client.aclose()

alchemy_service = AlchemyService()
