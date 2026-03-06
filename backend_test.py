import requests
import sys
import json
from datetime import datetime

class WalletSecureAPITester:
    def __init__(self, base_url="https://walletsecure.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        return self.run_test("Health Check", "GET", "health", 200)

    def test_root_endpoint(self):
        """Test root endpoint"""
        return self.run_test("Root Endpoint", "GET", "", 200)

    def test_wallet_scan(self, wallet_address, chains):
        """Test wallet scanning"""
        scan_data = {
            "wallet_address": wallet_address,
            "chains": chains
        }
        return self.run_test("Wallet Scan", "POST", "scan/wallet", 200, data=scan_data)

    def test_scan_history(self, wallet_address):
        """Test getting scan history"""
        return self.run_test("Scan History", "GET", f"scan/history/{wallet_address}", 200)

    def test_get_scam_contracts(self):
        """Test getting scam contracts"""
        return self.run_test("Get Scam Contracts", "GET", "scam-contracts", 200)

    def test_admin_stats(self):
        """Test admin statistics"""
        return self.run_test("Admin Stats", "GET", "admin/stats", 200)

    def test_invalid_wallet_scan(self):
        """Test scanning with invalid wallet address"""
        scan_data = {
            "wallet_address": "0xinvalid",
            "chains": ["eth-mainnet"]
        }
        success, response = self.run_test("Invalid Wallet Scan", "POST", "scan/wallet", 422, data=scan_data)
        return success

def main():
    print("🚀 Starting WalletSecure API Tests")
    print("=" * 50)
    
    tester = WalletSecureAPITester()
    
    # Test valid wallet address
    valid_wallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbb"
    chains = ["eth-mainnet", "polygon-mainnet"]
    
    # Run all tests
    print("\n📋 Running Basic API Tests...")
    tester.test_health_check()
    tester.test_root_endpoint()
    
    print("\n📋 Running Wallet Scan Tests...")
    scan_success, scan_response = tester.test_wallet_scan(valid_wallet, chains)
    
    print("\n📋 Running History and Data Tests...")
    tester.test_scan_history(valid_wallet)
    tester.test_get_scam_contracts()
    tester.test_admin_stats()
    
    print("\n📋 Running Error Handling Tests...")
    tester.test_invalid_wallet_scan()
    
    # Print detailed results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    if scan_success and scan_response:
        print("\n🔍 SCAN RESPONSE ANALYSIS:")
        if 'security_score' in scan_response:
            score = scan_response['security_score']
            print(f"   Security Score: {score} (Valid range: 0-100)")
            if 0 <= score <= 100:
                print("   ✅ Security score is in valid range")
            else:
                print("   ❌ Security score is out of valid range")
        
        if 'risk_level' in scan_response:
            risk = scan_response['risk_level']
            print(f"   Risk Level: {risk}")
            if risk.lower() in ['safe', 'medium', 'high']:
                print("   ✅ Risk level is valid")
            else:
                print("   ❌ Risk level is invalid")
        
        if 'approvals_count' in scan_response:
            print(f"   Approvals Count: {scan_response['approvals_count']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n🎯 Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())