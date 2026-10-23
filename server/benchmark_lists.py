import time
import requests

server_url = "http://127.0.0.1:5000"
login_res = requests.post(f"{server_url}/api/auth/login", json={"username": "admin", "password": "password123"})
if login_res.status_code != 200:
    login_res = requests.post(f"{server_url}/api/auth/login", json={"username": "admin", "password": "admin123"})
token = login_res.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

endpoints = [
    "/api/dashboard/summary",
    "/api/sales/",
    "/api/purchases/",
    "/api/inventory/stock",
    "/api/inventory/movements",
    "/api/inventory/timeline"
]

print(f"{'Endpoint':<30} | {'Warm (ms)':<10} | {'Size (B)':<10}")
print("-" * 60)
for ep in endpoints:
    try:
        # Warm up
        requests.get(f"{server_url}{ep}", headers=headers)
        
        t0 = time.perf_counter()
        res = requests.get(f"{server_url}{ep}", headers=headers)
        t1 = time.perf_counter()
        duration_ms = (t1 - t0) * 1000
        print(f"{ep:<30} | {duration_ms:<10.1f} | {len(res.content):<10}")
    except Exception as e:
        print(f"Error on {ep}: {e}")
