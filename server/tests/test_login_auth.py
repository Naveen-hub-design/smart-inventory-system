import os
import sys
import tempfile
import pytest
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-must-be-32-bytes-long'

from app.config.config import Config
Config.SQLALCHEMY_ENGINE_OPTIONS = {}

from app import create_app, db
from app.models.user import User


@pytest.fixture(scope='module')
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    with app.app_context():
        db.create_all()
        db.session.query(User).delete()
        user = User(
            username='testuser',
            email='test@example.com',
            password_hash=generate_password_hash('password123'),
            full_name='Test User',
            role='admin',
            is_active=True
        )
        db.session.add(user)
        db.session.commit()

    with app.test_client() as client:
        yield client


def test_login_success_shape_and_authentication(client):
    """Confirm POST /api/auth/login returns exact expected structure without extra post-commit queries."""
    res = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    assert res.status_code == 200
    data = res.get_json()

    assert data['message'] == 'Login successful'
    assert 'access_token' in data
    assert 'refresh_token' in data
    assert 'user' in data

    user = data['user']
    expected_keys = {
        'id', 'username', 'email', 'full_name', 'employee_id',
        'role', 'phone', 'avatar', 'is_active', 'password_reset_required',
        'last_login', 'created_at'
    }
    assert expected_keys.issubset(set(user.keys()))
    assert user['username'] == 'testuser'
    assert user['email'] == 'test@example.com'
    assert user['role'] == 'admin'
    assert user['last_login'] is not None


def test_login_invalid_password(client):
    res = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'wrongpassword'
    })
    assert res.status_code == 401
    assert res.get_json()['error'] == 'Invalid credentials'


def test_login_missing_fields(client):
    res = client.post('/api/auth/login', json={'username': 'testuser'})
    assert res.status_code == 400


def test_staff_role_permissions_and_admin_endpoints(client):
    """Verify Staff user gets 200 on staff endpoints, but 403 on admin-only settings."""
    with client.application.app_context():
        staff_user = User(
            username='teststaff',
            email='staff@example.com',
            password_hash=generate_password_hash('staffpass123'),
            full_name='Test Staff',
            role='staff',
            is_active=True
        )
        db.session.add(staff_user)
        db.session.commit()

    # Staff login
    res = client.post('/api/auth/login', json={
        'username': 'teststaff',
        'password': 'staffpass123'
    })
    assert res.status_code == 200
    staff_data = res.get_json()
    assert staff_data['user']['role'] == 'staff'
    staff_token = staff_data['access_token']
    staff_headers = {'Authorization': f'Bearer {staff_token}'}

    # Staff accessing permitted dashboard stats -> 200 OK
    stat_res = client.get('/api/dashboard/stats', headers=staff_headers)
    assert stat_res.status_code == 200

    # Staff attempting admin-only settings -> 403 Forbidden with exact message
    settings_res = client.get('/api/settings/', headers=staff_headers)
    assert settings_res.status_code == 403
    assert settings_res.get_json() == {'error': 'Admin access required'}

    # Admin accessing settings -> 200 OK
    admin_login = client.post('/api/auth/login', json={
        'username': 'testuser',
        'password': 'password123'
    })
    admin_token = admin_login.get_json()['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}

    admin_settings_res = client.get('/api/settings/', headers=admin_headers)
    assert admin_settings_res.status_code == 200

