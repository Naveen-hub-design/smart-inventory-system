import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5000'

# 1. Login to get token
login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "admin",
    "password": "admin123"
})

if login_resp.status_code != 200:
    print(f"Login failed ({login_resp.status_code}): {login_resp.text}")
    exit(1)

token = login_resp.json().get('access_token')
print("Successfully logged in.")

headers = {
    'Authorization': f'Bearer {token}'
}

# 2. Call /api/ai/reorder-recommendations (warm request test)
print("\nSending request to /api/ai/reorder-recommendations...")
t0 = time.perf_counter()
resp = requests.get(f"{BASE_URL}/api/ai/reorder-recommendations", headers=headers)
t1 = time.perf_counter()

http_wall_time_ms = (t1 - t0) * 1000.0
print(f"HTTP Status Code: {resp.status_code}")
print(f"Wall Clock HTTP Time: {http_wall_time_ms:.2f} ms")

if resp.status_code == 200:
    data = resp.json()
    debug_timing = data.get('_debug_timing', {})
    print("\n" + "="*80)
    print("AI REORDER RECOMMENDATIONS DIAGNOSTIC BREAKDOWN")
    print("="*80)
    stages = debug_timing.get('stages', {})
    print(f"| {'Stage':<35} | {'Time (ms)':>15} |")
    print("|" + "-"*37 + "|" + "-"*17 + "|")
    for stage, t in stages.items():
        print(f"| {stage:<35} | {t:>15.2f} ms |")
    print("="*80)
    
    sql_stats = debug_timing.get('sql_stats', {})
    print(f"\nTotal SQL queries: {sql_stats.get('total_sql_queries')}")
    print(f"Total DB time: {sql_stats.get('total_db_time_ms')} ms")
    print(f"Total Python processing time: {sql_stats.get('total_python_processing_time_ms')} ms")
    
    queries_sample = debug_timing.get('sql_queries_sample', [])
    print(f"\nSQL Queries Executed ({len(queries_sample)} total):")
    for idx, q in enumerate(queries_sample, 1):
        print(f"{idx:3d}. [{q['duration_ms']:7.2f} ms] {q['sql']}")
else:
    print(f"Error: {resp.text}")
