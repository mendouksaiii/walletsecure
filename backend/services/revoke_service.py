from web3 import Web3
from models import ChainType

class RevokeService:
    def __init__(self):
        # We don't need an active node connection just to ABI encode data, 
        # but we initialize a dummy Web3 instance to access its encoding utilities.
        self.w3 = Web3()
        
        # Standard ERC-20 ABI for the approve function
        self.erc20_abi = [
            {
                "constant": False,
                "inputs": [
                    {"name": "_spender", "type": "address"},
                    {"name": "_value", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"name": "", "type": "bool"}],
                "payable": False,
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]

    def generate_revoke_payload(self, token_address: str, spender_address: str) -> dict:
        """
        Generates the raw hexadecimal data payload to set an ERC-20 approval to 0.
        Returns the data needed for a Wagmi / Ethers.js frontend to securely broadcast.
        """
        try:
            # Checksum addresses strictly required by Web3.py
            token = self.w3.to_checksum_address(token_address.lower())
            spender = self.w3.to_checksum_address(spender_address.lower())
            
            # Create a dummy contract reference
            contract = self.w3.eth.contract(address=token, abi=self.erc20_abi)
            
            # Encode the `approve(spender, 0)` function call
            hex_data = contract.encodeABI(fn_name="approve", args=[spender, 0])
            
            return {
                "to": token,
                "data": hex_data,
                "value": "0x0" # Approvals cost 0 ETH/BNB (only gas)
            }
            
        except ValueError as e:
            raise Exception(f"Invalid address format: {e}")
        except Exception as e:
            raise Exception(f"Failed to encode revoke payload: {e}")

revoke_service = RevokeService()
