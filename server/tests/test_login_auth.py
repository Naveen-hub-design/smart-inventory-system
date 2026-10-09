import os
import sys
import tempfile
import pytest
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret'

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
