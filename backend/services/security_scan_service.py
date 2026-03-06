from datetime import datetime, timedelta
from typing import List, Dict, Optional
from models import (
    WalletScanRequest, WalletScanResponse, RiskItem, RiskLevel,
    TokenApproval, ChainType, ScamContract
)
from services.alchemy_service import alchemy_service
from services.etherscan_service import etherscan_service
from database import get_database
import logging
from eth_abi import decode

logger = logging.getLogger(__name__)

UNLIMITED_APPROVAL = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

KNOWN_SAFE_CONTRACTS = {
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap V2 Router",
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap V3 Router",
    "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x Exchange Proxy",
    "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch V5 Router",
}

class SecurityScanService:
    def __init__(self):
        self.db = None
    
    def set_db(self, db):
        self.db = db
    
    async def scan_wallet(self, request: WalletScanRequest) -> WalletScanResponse:
        """Perform comprehensive security scan on wallet"""
        try:
            risks_found: List[RiskItem] = []
            total_approvals = 0
            risky_approvals = 0
            
            for chain in request.chains:
                # Get token approvals
                approvals = await self._get_wallet_approvals(request.wallet_address, chain)
                total_approvals += len(approvals)
                
                # Check for unlimited approvals
                unlimited_risks = await self._check_unlimited_approvals(approvals, chain)
                risks_found.extend(unlimited_risks)
                
                # Check for scam contracts
                scam_risks = await self._check_scam_contracts(request.wallet_address, chain)
                risks_found.extend(scam_risks)
                
                # Check approval risks
                for approval in approvals:
                    if approval.is_risky:
                        risky_approvals += 1
            
            # Calculate security score
            security_score = self._calculate_security_score(total_approvals, risky_approvals, risks_found)
            risk_level = self._get_risk_level(security_score)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(risks_found, risky_approvals)
            
            # Save scan result
            scan_result = WalletScanResponse(
                wallet_address=request.wallet_address,
                chains_scanned=request.chains,
                security_score=security_score,
                risk_level=risk_level,
                risks_found=risks_found,
                total_approvals=total_approvals,
                risky_approvals=risky_approvals,
                recommendations=recommendations
            )
            
            await self._save_scan_result(scan_result)
            
            return scan_result
            
        except Exception as e:
            logger.error(f"Error scanning wallet: {e}")
            raise
    
    async def _get_wallet_approvals(self, wallet_address: str, chain: ChainType) -> List[TokenApproval]:
        """Get all token approvals for wallet using real Alchemy approval event logs"""
        approvals: List[TokenApproval] = []
        
        try:
            # Fetch real ERC-20 Approval event logs from the blockchain
            raw_logs = await alchemy_service.get_approval_events(wallet_address, chain)
            
            if not raw_logs:
                return approvals
            
            # Deduplicate: keep only the latest approval per (token, spender) pair
            latest_approvals: Dict[str, dict] = {}
            for log in raw_logs:
                token_addr = log.get("address", "").lower()
                topics = log.get("topics", [])
                if len(topics) < 3:
                    continue
                
                spender_addr = "0x" + topics[2][-40:]  # Extract spender from padded topic
                key = f"{token_addr}:{spender_addr}"
                latest_approvals[key] = log  # Later logs overwrite earlier ones
            
            # Process each unique (token, spender) approval
            processed = 0
            for key, log in latest_approvals.items():
                if processed >= 20:  # Cap to avoid rate limits
                    break
                    
                token_addr = log.get("address", "").lower()
                topics = log.get("topics", [])
                data = log.get("data", "0x0")
                spender_addr = "0x" + topics[2][-40:]
                
                # Parse approved amount from log data
                try:
                    approved_amount = str(int(data, 16))
                except (ValueError, TypeError):
                    approved_amount = "0"
                
                # Check if approval was revoked (amount = 0)
                if approved_amount == "0":
                    continue
                
                is_unlimited = approved_amount == str(int(UNLIMITED_APPROVAL, 16)) or len(approved_amount) > 70
                
                # Get token metadata
                token_name = "Unknown Token"
                token_symbol = "???"
                try:
                    metadata = await alchemy_service.get_token_metadata(token_addr, chain)
                    if metadata:
                        token_name = metadata.get("name", "Unknown Token")
                        token_symbol = metadata.get("symbol", "???")
                except Exception:
                    pass
                
                # Check if spender is a known safe contract
                spender_name = KNOWN_SAFE_CONTRACTS.get(spender_addr.lower(), None)
                is_risky = spender_name is None  # Unknown spenders are flagged risky
                
                approvals.append(
                    TokenApproval(
                        token_address=token_addr,
                        token_symbol=token_symbol,
                        token_name=token_name,
                        spender_address=spender_addr,
                        spender_name=spender_name or "Unknown Contract",
                        approved_amount=approved_amount if not is_unlimited else UNLIMITED_APPROVAL,
                        is_unlimited=is_unlimited,
                        is_risky=is_risky,
                        chain=chain
                    )
                )
                processed += 1
                
        except Exception as e:
            logger.error(f"Error getting wallet approvals: {e}")
        
        return approvals
    
    async def _check_unlimited_approvals(self, approvals: List[TokenApproval], chain: ChainType) -> List[RiskItem]:
        """Check for unlimited token approvals"""
        risks = []
        
        for approval in approvals:
            if approval.is_unlimited:
                risks.append(RiskItem(
                    risk_type="Unlimited Token Approval",
                    risk_level=RiskLevel.MEDIUM,
                    description=f"Unlimited approval given to {approval.spender_name or 'unknown contract'} for {approval.token_symbol}",
                    contract_address=approval.spender_address,
                    recommended_action="Revoke this approval to limit potential losses if the spender contract is compromised",
                    severity_score=50
                ))
        
        return risks
    
    async def _check_scam_contracts(self, wallet_address: str, chain: ChainType) -> List[RiskItem]:
        """Check wallet's real transaction history against known scam contracts in the database"""
        risks = []
        
        try:
            if not self.db:
                return risks
            
            # Get scam contracts from database
            scam_contracts = await self.db.scam_contracts.find(
                {"chain": chain.value},
                {"_id": 0}
            ).to_list(100)
            
            if not scam_contracts:
                return risks
            
            # Build a set of scam addresses for fast lookup
            scam_addresses = {}
            for scam in scam_contracts:
                addr = scam.get("contract_address", "").lower()
                if addr:
                    scam_addresses[addr] = scam
            
            # Fetch the wallet's real ERC-20 transfer history
            transfers = await etherscan_service.get_erc20_transfers(wallet_address, chain.value)
            
            # Check each transfer against known scam contracts
            flagged = set()  # Avoid duplicate flags for the same scam contract
            for tx in transfers:
                contract_addr = tx.get("contractAddress", "").lower()
                to_addr = tx.get("to", "").lower()
                from_addr = tx.get("from", "").lower()
                
                # Check if any address in the transaction matches a known scam
                for addr in [contract_addr, to_addr, from_addr]:
                    if addr in scam_addresses and addr not in flagged:
                        flagged.add(addr)
                        scam = scam_addresses[addr]
                        risks.append(RiskItem(
                            risk_type="Scam Contract Interaction",
                            risk_level=RiskLevel.HIGH,
                            description=f"Wallet has interacted with known scam contract: {scam.get('description', 'Unknown scam')}",
                            contract_address=scam.get("contract_address"),
                            recommended_action="Revoke all approvals to this contract immediately and avoid future interactions",
                            severity_score=80
                        ))
        
        except Exception as e:
            logger.error(f"Error checking scam contracts: {e}")
        
        return risks
    
    async def _is_scam_contract(self, contract_address: str, chain: ChainType) -> bool:
        """Check if contract is in scam database"""
        try:
            if not self.db:
                return False
            
            scam = await self.db.scam_contracts.find_one({
                "contract_address": contract_address.lower(),
                "chain": chain.value
            })
            
            return scam is not None
        
        except Exception as e:
            logger.error(f"Error checking scam contract: {e}")
            return False
    
    def _calculate_security_score(self, total_approvals: int, risky_approvals: int, risks: List[RiskItem]) -> int:
        """Calculate security score (0-100)"""
        base_score = 100
        
        # Deduct points for approvals
        if total_approvals > 0:
            approval_penalty = min(20, total_approvals * 2)
            base_score -= approval_penalty
        
        # Deduct points for risky approvals
        if risky_approvals > 0:
            risky_penalty = min(30, risky_approvals * 10)
            base_score -= risky_penalty
        
        # Deduct points for risks found
        for risk in risks:
            if risk.risk_level == RiskLevel.CRITICAL:
                base_score -= 30
            elif risk.risk_level == RiskLevel.HIGH:
                base_score -= 20
            elif risk.risk_level == RiskLevel.MEDIUM:
                base_score -= 10
            elif risk.risk_level == RiskLevel.LOW:
                base_score -= 5
        
        return max(0, min(100, base_score))
    
    def _get_risk_level(self, security_score: int) -> RiskLevel:
        """Determine risk level from security score"""
        if security_score >= 71:
            return RiskLevel.SAFE
        elif security_score >= 41:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.HIGH
    
    def _generate_recommendations(self, risks: List[RiskItem], risky_approvals: int) -> List[str]:
        """Generate security recommendations"""
        recommendations = []
        
        if risky_approvals > 0:
            recommendations.append(f"Revoke {risky_approvals} risky token approval(s) immediately")
        
        if any(r.risk_level in [RiskLevel.CRITICAL, RiskLevel.HIGH] for r in risks):
            recommendations.append("Address critical security risks as soon as possible")
        
        if len(risks) > 5:
            recommendations.append("Consider using a fresh wallet for high-value transactions")
        
        recommendations.append("Enable continuous monitoring to get real-time alerts for new risks")
        recommendations.append("Regularly review and revoke unused token approvals")
        
        return recommendations
    
    async def _save_scan_result(self, scan_result: WalletScanResponse):
        """Save scan result to database"""
        try:
            if not self.db:
                return
            
            doc = scan_result.model_dump()
            doc["scan_timestamp"] = doc["scan_timestamp"].isoformat()
            
            await self.db.wallet_scans.insert_one(doc)
        
        except Exception as e:
            logger.error(f"Error saving scan result: {e}")

security_scan_service = SecurityScanService()
