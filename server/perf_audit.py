import requests
import time
import json

BASE_URL = 'http://127.0.0.1:5000/api'

def run():
    print("Logging in...")
    r = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    endpoints = [
        ("Dashboard Summary", "/dashboard/summary"),
        ("Products List", "/products/"),
        ("Sales List", "/sales/"),
        ("Purchases List", "/purchases/"),
        ("Inventory/Materials List", "/materials/"),
        ("Suppliers List", "/suppliers/"),
        ("AI Reorder", "/ai/reorder-recommendations"),
        ("Monthly Sales", "/dashboard/monthly-sales"),
    ]
    
    results = []
    print(f"{'Endpoint':<25} | {'Cold (ms)':<10} | {'Warm (ms)':<10} | {'SQL Cnt':<7} | {'SQL Time':<8} | {'Payload':<10}")
    print("-" * 80)
    
    for name, path in endpoints:
        # Cold run
        t0 = time.perf_counter()
        rc = requests.get(f"{BASE_URL}{path}", headers=headers)
        cold_ms = (time.perf_counter() - t0) * 1000.0
        
        # Warm run
        t0 = time.perf_counter()
        rw = requests.get(f"{BASE_URL}{path}", headers=headers)
        warm_ms = (time.perf_counter() - t0) * 1000.0
        
        sql_cnt = rw.headers.get('X-SQL-Query-Count', 'N/A')
        sql_time = rw.headers.get('X-SQL-Execution-Time-MS', 'N/A')
        payload_size = len(rw.content)
        
        print(f"{name:<25} | {cold_ms:<10.1f} | {warm_ms:<10.1f} | {sql_cnt:<7} | {sql_time:<8} | {payload_size:<10}")

if __name__ == '__main__':
    run()
