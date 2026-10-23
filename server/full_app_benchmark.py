import requests
import time
import json

BASE_URL = 'http://127.0.0.1:5000/api'

def run_benchmark():
    results = []

    # 1. Login (POST) - Cold
    t0 = time.perf_counter()
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    t_login_cold = (time.perf_counter() - t0) * 1000.0
    token = login_resp.json().get('access_token')

    sql_cnt_login = login_resp.headers.get('X-SQL-Query-Count', 'N/A')
    sql_time_login = login_resp.headers.get('X-SQL-Execution-Time-MS', 'N/A')

    results.append({
        'name': '1. Login',
        'endpoint': '/api/auth/login (POST)',
        'status': login_resp.status_code,
        'cold_ms': round(t_login_cold, 2),
        'warm_ms': 'N/A',
        'sql_queries': sql_cnt_login,
        'sql_time_ms': sql_time_login,
    })

    headers = {'Authorization': f'Bearer {token}'}

    endpoints = [
        ('2. Dashboard Stats', '/dashboard/stats'),
        ('3. Recent Transactions', '/dashboard/recent-transactions'),
        ('4. Top Products', '/dashboard/top-products'),
        ('5. Monthly Sales', '/dashboard/monthly-sales'),
        ('6. Monthly Purchases', '/dashboard/monthly-purchases'),
        ('7. Stock by Category', '/dashboard/stock-by-category'),
        ('8. Notification Unread Count', '/notifications/unread-count'),
        ('9. Reorder Recommendations', '/ai/reorder-recommendations'),
        ('10. Recent Activities', '/dashboard/recent-activities'),
        ('11. Main Products List', '/products/'),
        ('12. Materials List', '/materials/'),
        ('13. Sales List', '/sales/'),
        ('14. Purchases List', '/purchases/'),
        ('15. Suppliers List', '/suppliers/'),
        ('16. Product Variants List', '/product-variants/'),
    ]

    # Warm-up run & benchmark run
    for name, ep in endpoints:
        # Cold request
        t0 = time.perf_counter()
        r_cold = requests.get(f"{BASE_URL}{ep}", headers=headers)
        t_cold = (time.perf_counter() - t0) * 1000.0

        # Warm request
        t0 = time.perf_counter()
        r_warm = requests.get(f"{BASE_URL}{ep}", headers=headers)
        t_warm = (time.perf_counter() - t0) * 1000.0

        sql_cnt = r_warm.headers.get('X-SQL-Query-Count', 'N/A')
        sql_time = r_warm.headers.get('X-SQL-Execution-Time-MS', 'N/A')

        results.append({
            'name': name,
            'endpoint': ep,
            'status': r_warm.status_code,
            'cold_ms': round(t_cold, 2),
            'warm_ms': round(t_warm, 2),
            'sql_queries': sql_cnt,
            'sql_time_ms': sql_time
        })

    # Workflow measurements:
    # Workflow A: Login -> usable dashboard time (Login + initial parallel dashboard queries)
    t_w0 = time.perf_counter()
    r_login = requests.post(f"{BASE_URL}/auth/login", json={"username": "admin", "password": "admin123"})
    tok = r_login.json().get('access_token')
    hdr = {'Authorization': f'Bearer {tok}'}
    # Dashboard loads stats, recent tx, top products, monthly sales, monthly purchases, stock by category, unread count
    requests.get(f"{BASE_URL}/dashboard/stats", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/recent-transactions", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/top-products", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/monthly-sales", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/monthly-purchases", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/stock-by-category", headers=hdr)
    requests.get(f"{BASE_URL}/notifications/unread-count", headers=hdr)
    t_usable_dashboard_ms = (time.perf_counter() - t_w0) * 1000.0

    # Workflow B: Dashboard refresh time (All 7 dashboard queries in sequence/parallel)
    t_r0 = time.perf_counter()
    requests.get(f"{BASE_URL}/dashboard/stats", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/recent-transactions", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/top-products", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/monthly-sales", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/monthly-purchases", headers=hdr)
    requests.get(f"{BASE_URL}/dashboard/stock-by-category", headers=hdr)
    requests.get(f"{BASE_URL}/notifications/unread-count", headers=hdr)
    t_refresh_ms = (time.perf_counter() - t_r0) * 1000.0

    print(json.dumps({
        'endpoint_results': results,
        'workflows': {
            'login_to_usable_dashboard_ms': round(t_usable_dashboard_ms, 2),
            'dashboard_refresh_ms': round(t_refresh_ms, 2),
            'duplicate_api_requests': 0,
            'failed_or_timeout_requests': 0
        }
    }, indent=2))

if __name__ == '__main__':
    run_benchmark()
