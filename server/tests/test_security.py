import pytest
import os
import tempfile
import time

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-must-be-32-bytes-long'
os.environ['FLASK_ENV'] = 'testing'

from app.config.config import Config
Config.SQLALCHEMY_ENGINE_OPTIONS = {}

from app import create_app, db
from app.models.user import User

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.test_client() as client:
        with app.app_context():
            yield client
            
@pytest.fixture
def auth_headers(client):
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    token = res.json['access_token']
    return {'Authorization': f'Bearer {token}'}

def test_deactivated_user_rejected(client):
    # Deactivate admin
    with client.application.app_context():
        u = User.query.filter_by(username='admin').first()
        u.is_active = False
        db.session.commit()
    
    # Try to login
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    assert res.status_code == 403
    assert 'Account is deactivated' in res.json['error']

    # Reactivate admin
    with client.application.app_context():
        u = User.query.filter_by(username='admin').first()
        u.is_active = True
        db.session.commit()

def test_password_reset_revokes_old_token(client):
    # 1. Login to get a token
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    assert res.status_code == 200
    token = res.json['access_token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Token works initially
    res2 = client.get('/api/auth/me', headers=headers)
    assert res2.status_code == 200

    # 3. Change password
    res3 = client.put('/api/auth/change-password', headers=headers, json={
        'current_password': 'admin123',
        'new_password': 'newpassword123'
    })
    assert res3.status_code == 200

    # 4. Old token should now be rejected (token_version mismatch)
    res4 = client.get('/api/auth/me', headers=headers)
    assert res4.status_code == 401
    assert 'revoked' in res4.json['error'].lower()

    # Reset password back for other tests
    res5 = client.post('/api/auth/login', json={'username': 'admin', 'password': 'newpassword123'})
    assert res5.status_code == 200
    token_new = res5.json['access_token']
    headers_new = {'Authorization': f'Bearer {token_new}'}
    client.put('/api/auth/change-password', headers=headers_new, json={
        'current_password': 'newpassword123',
        'new_password': 'admin123'
    })

def test_strict_secret_key_requirements():
    from app.config.config import Config
    import importlib
    import app.config.config
    
    # Temporarily set a short key
    os.environ['JWT_SECRET_KEY'] = 'short-key'
    with pytest.raises(RuntimeError, match='must be at least 32 bytes'):
        importlib.reload(app.config.config)
        
    # Restore valid key
    os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-must-be-32-bytes-long'
    importlib.reload(app.config.config)

def test_database_exception_in_blocklist_loader(client, auth_headers):
    import unittest.mock

    # Verify token works normally first
    res1 = client.get('/api/auth/me', headers=auth_headers)
    assert res1.status_code == 200

    # Mock the database session query to raise an Exception
    with unittest.mock.patch('app.models.token_blocklist.TokenBlocklist.query') as mock_query:
        # Simulate a database connection loss
        mock_query.filter_by.side_effect = Exception("Simulated DB OperationalError")

        res2 = client.get('/api/auth/me', headers=auth_headers)

        # Should fail closed (revoked) instead of crashing with 500
        assert res2.status_code == 401
        assert 'revoked' in res2.json.get('error', '').lower()
