import pytest
import os
import tempfile
import time

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-must-be-32-bytes-long'

from app.config.config import Config
Config.SQLALCHEMY_ENGINE_OPTIONS = {}

from app import create_app, db
from app.routes.dashboard import _SUMMARY_CACHE, clear_dashboard_cache, CACHE_TTL
from app.models.sale import Sale
from app.models.purchase import Purchase

@pytest.fixture
def app():
    app = create_app()
    app.config['TESTING'] = True
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    with app.test_client() as client:
        yield client

@pytest.fixture
def login_as_admin(client):
    def _login():
        res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
        token = res.json['access_token']
        return {'Authorization': f'Bearer {token}'}
    return _login
def test_dashboard_cache_hits_and_expires(client, login_as_admin, monkeypatch):
    """
    Test that the dashboard cache actually hits and skips DB lookups,
    and then successfully invalidates after TTL.
    """
    headers = login_as_admin()
    
    # 1. Clear cache manually to ensure clean state
    clear_dashboard_cache()
    
    # 2. First call should populate cache
    resp1 = client.get('/api/dashboard/summary', headers=headers)
    assert resp1.status_code == 200
    assert _SUMMARY_CACHE['data'] is not None
    assert _SUMMARY_CACHE['timestamp'] > 0
    
    original_timestamp = _SUMMARY_CACHE['timestamp']
    
    # 3. Second call should hit the cache immediately (timestamp should match)
    resp2 = client.get('/api/dashboard/summary', headers=headers)
    assert resp2.status_code == 200
    assert _SUMMARY_CACHE['timestamp'] == original_timestamp
    
    # 4. Mock time to simulate cache expiration
    future_time = original_timestamp + CACHE_TTL + 5
    
    class MockTime:
        def time(self):
            return future_time
            
    monkeypatch.setattr('app.routes.dashboard.time', MockTime())
    
    # 5. Third call should miss the cache because of TTL, timestamp will be updated
    resp3 = client.get('/api/dashboard/summary', headers=headers)
    assert resp3.status_code == 200
    assert _SUMMARY_CACHE['timestamp'] == future_time

def test_sales_list_omits_items_but_detail_includes_them(client, login_as_admin, app):
    """
    Test that the /api/sales/ list endpoint omits nested items to prevent N+1 serialization,
    while /api/sales/<id> still returns them.
    """
    headers = login_as_admin()
    
    # Find any existing sale
    with app.app_context():
        sale = Sale.query.first()
        if not sale:
            pytest.skip("No sales in database to test against")
        sale_id = sale.id
        
    # Check List
    list_resp = client.get('/api/sales/', headers=headers)
    assert list_resp.status_code == 200
    list_data = list_resp.json['sales']
    assert len(list_data) > 0
    
    # The items array shouldn't be loaded or serialized on list responses
    for s in list_data:
        assert 'items' not in s or s['items'] == [] or s['items'] is None
        
    # Check Detail
    detail_resp = client.get(f'/api/sales/{sale_id}', headers=headers)
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json['sale']
    
    # The detail endpoint uses the default to_dict() which includes items
    assert 'items' in detail_data
    assert isinstance(detail_data['items'], list)

def test_ai_reorder_payload_optimization(client, login_as_admin):
    """
    Test that the AI reorder payload optimization is active, verifying that
    it returns counts instead of massive redundant arrays.
    """
    headers = login_as_admin()
    resp = client.get('/api/ai/reorder-recommendations', headers=headers)
    
    assert resp.status_code == 200
    data = resp.json
    
    # Assert counts exist
    assert 'high_priority_count' in data
    assert 'medium_priority_count' in data
    assert 'safe_items_count' in data
    
    # Assert massive arrays are NOT present
    assert 'high_priority' not in data
    assert 'medium_priority' not in data
    assert 'safe_items' not in data
