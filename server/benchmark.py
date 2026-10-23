import requests
import time
import sys

BASE_URL = "http://127.0.0.1:5000/api"

def login():
    # Attempt login with known credentials or ask user
    # Assuming standard admin/admin or test credentials
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "password"})
    if resp.status_code == 200:
        return resp.json().get("access_token")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
    if resp.status_code == 200:
        return resp.json().get("access_token")
    print(f"Login failed: {resp.text}")
    return None

def measure_endpoint(endpoint, token, name):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Cold
    start = time.time()
    resp1 = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    t1 = time.time() - start
    
    # Warm 1
    start = time.time()
    resp2 = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    t2 = time.time() - start
    
    # Warm 2
    start = time.time()
    resp3 = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
    t3 = time.time() - start
    
    size = len(resp1.content)
    status = resp1.status_code
    
    print(f"| {name} | {t1:.3f}s | {t2:.3f}s | {t3:.3f}s | {size} bytes | {status} |")

def main():
    token = login()
    if not token:
        sys.exit(1)
        
    endpoints = {
        "Stats": "/dashboard/stats",
        "Recent Tx": "/dashboard/recent-transactions",
        "Top Products": "/dashboard/top-products",
        "Monthly Sales": "/dashboard/monthly-sales",
        "Monthly Purch": "/dashboard/monthly-purchases",
        "Stock by Cat": "/dashboard/stock-by-category",
        "Forecast AI": "/ai/forecast",
        "Health AI": "/ai/health",
        "Reorder AI": "/ai/reorder-recommendations"
    }
    
    print("| Endpoint | Cold | Warm #1 | Warm #2 | Size | Status |")
    print("|----------|------|---------|---------|------|--------|")
    for name, ep in endpoints.items():
        measure_endpoint(ep, token, name)

if __name__ == "__main__":
    main()
