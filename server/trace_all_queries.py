import requests
import json

BASE_URL = 'http://127.0.0.1:5000'

# Login
login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "admin123"})
token = login_resp.json().get('access_token')

headers = {'Authorization': f'Bearer {token}'}

# Run /api/ai/reorder-recommendations
resp = requests.get(f"{BASE_URL}/api/ai/reorder-recommendations", headers=headers)
print(f"Status Code: {resp.status_code}")
if resp.status_code != 200:
    print(f"Response Text: {resp.text}")
    exit(1)
data = resp.json()
debug_timing = data.get('_debug_timing', {})

print("STAGES BREAKDOWN:")
print(json.dumps(debug_timing.get('stages'), indent=2))

print("\nSQL STATS:")
print(json.dumps(debug_timing.get('sql_stats'), indent=2))

print("\nALL QUERIES EXECUTED:")
queries = debug_timing.get('sql_queries_sample', [])
for i, q in enumerate(queries, 1):
    print(f"Query {i:2d}: [{q['duration_ms']:7.2f} ms] -> {q['sql']}")
