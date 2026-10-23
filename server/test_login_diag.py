import requests
import json
import time

BASE_URL = 'http://127.0.0.1:5000'

print("=" * 80)
print("TESTING POST /api/auth/login HIGH-RESOLUTION PERFORMANCE PROFILING")
print("=" * 80)

# 1. First Login Call (Cold / Standard Warm Connection)
t0 = time.perf_counter()
resp = requests.post(f"{BASE_URL}/api/auth/login", json={
    "username": "admin",
    "password": "admin123"
})
t1 = time.perf_counter()

http_wall_ms = (t1 - t0) * 1000.0
print(f"HTTP Response Status Code : {resp.status_code}")
print(f"Wall Clock HTTP Request Time: {http_wall_ms:.2f} ms")

if resp.status_code == 200:
    data = resp.json()
    debug_timing = data.get('_debug_timing', {})
    
    print("\n" + "=" * 80)
    print("STAGE-BY-STAGE TIMING BREAKDOWN (from server high-res perf_counter)")
    print("=" * 80)
    stages = debug_timing.get('stages', {})
    for stage, t in stages.items():
        print(f"  {stage:<32} : {t:10.2f} ms")
    print("=" * 80)
    
    sql_stats = debug_timing.get('sql_stats', {})
    print(f"\nSQL Statistics:")
    print(f"  Total SQL Queries Executed  : {sql_stats.get('total_sql_queries')}")
    print(f"  Total Database Execution Time: {sql_stats.get('total_db_time_ms')} ms")
    print(f"  Total Python CPU Processing Time: {sql_stats.get('total_python_time_ms')} ms")
    
    sql_queries = debug_timing.get('sql_queries', [])
    print(f"\nIndividual SQL Query Details ({len(sql_queries)} total):")
    for idx, q in enumerate(sql_queries, 1):
        print(f"  Query {idx}: [{q['duration_ms']:7.2f} ms] {q['sql'].strip()}")
else:
    print(f"Login failed: {resp.text}")

print("=" * 80)
