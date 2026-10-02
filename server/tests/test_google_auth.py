"""Tests for POST /api/auth/google (Google Identity Services login).

Security contract under test:
- Only a server-side-verified Google ID token is accepted.
- The email comes ONLY from the verified token, never from the client.
- NO account is ever created; unknown emails are rejected.
- Inactive accounts are rejected.
- The role always comes from the SIMS database; the client cannot
  supply or escalate it.
- Success returns the SAME JWT response shape as normal login.
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret'
os.environ['GOOGLE_CLIENT_ID'] = 'test-client-id.apps.googleusercontent.com'

import pytest
from werkzeug.security import generate_password_hash

from app import create_app, db
from app.models.user import User

EXPECTED_CLIENT_ID = 'test-client-id.apps.googleusercontent.com'


def fake_verify_factory(email=None, exc=None, verified=True, aud=EXPECTED_CLIENT_ID,
                         iss='accounts.google.com'):
    """Mimic google.oauth2.id_token.verify_oauth2_token.

    The real library raises ValueError for invalid/expired/wrong-audience
    tokens, so tests simulate those cases by raising ValueError.
    """
    def _fake(token, request, audience=None):
        if exc is not None:
            raise exc
        if audience != EXPECTED_CLIENT_ID or aud != EXPECTED_CLIENT_ID:
            raise ValueError('Wrong audience.')
        return {
            'iss': iss,
            'aud': aud,
            'email': email,
            'email_verified': verified,
        }
    return _fake


@pytest.fixture(scope='module')
def client():
    app = create_app()
    app.config['TESTING'] = True
    with app.app_context():
        db.session.query(User).delete()
        db.session.add(User(
            username='admin', email='Admin@Sims.Local',
            password_hash=generate_password_hash('admin123'),
            full_name='Admin User', role='admin', is_active=True,
        ))
        db.session.add(User(
            username='staff1', email='staff@sims.local',
            password_hash=generate_password_hash('staff123'),
            full_name='Staff User', role='staff', is_active=True,
        ))
        db.session.add(User(
            username='oldstaff', email='oldstaff@sims.local',
            password_hash=generate_password_hash('staff123'),
            full_name='Old Staff', role='staff', is_active=False,
        ))
        db.session.commit()
    with app.test_client() as c:
        yield c


def post_google(client, **kwargs):
    """POST /api/auth/google with a mocked Google verifier."""
    from unittest import mock
    with mock.patch(
        'google.oauth2.id_token.verify_oauth2_token',
        side_effect=lambda token, request, audience=None: fake_verify_factory(**kwargs)(
            token, request, audience
        ),
    ):
        return client.post('/api/auth/google', json={'credential': 'dummy-token'})


def test_1_admin_success_role_admin(client):
    res = post_google(client, email='admin@sims.local')
    assert res.status_code == 200, res.get_json()
    body = res.get_json()
    assert body['user']['role'] == 'admin'
    assert body['user']['email'] == 'Admin@Sims.Local'
    assert body['access_token'] and body['refresh_token']


def test_2_staff_success_role_staff(client):
    res = post_google(client, email='STAFF@SIMS.LOCAL')
    assert res.status_code == 200, res.get_json()
    assert res.get_json()['user']['role'] == 'staff'


def test_3_unregistered_email_rejected(client):
    res = post_google(client, email='unknown@gmail.com')
    assert res.status_code == 401
    assert 'not registered' in res.get_json()['error']


def test_4_inactive_account_rejected(client):
    res = post_google(client, email='oldstaff@sims.local')
    assert res.status_code == 403
    assert 'inactive' in res.get_json()['error']


def test_5_invalid_credential_rejected(client):
    res = post_google(client, exc=ValueError('Invalid token'))
    assert res.status_code == 401


def test_6_expired_credential_rejected(client):
    res = post_google(client, exc=ValueError('Token expired'))
    assert res.status_code == 401


def test_7_wrong_audience_rejected(client):
    res = post_google(
        client, email='admin@sims.local', aud='other-client.apps.googleusercontent.com'
    )
    assert res.status_code == 401


def test_8_client_cannot_escalate_role(client):
    from unittest import mock
    with mock.patch(
        'google.oauth2.id_token.verify_oauth2_token',
        side_effect=lambda token, request, audience=None: fake_verify_factory(
            email='staff@sims.local')(token, request, audience),
    ):
        # Attacker tries to smuggle role=admin alongside the credential.
        res = client.post('/api/auth/google', json={'credential': 'dummy-token', 'role': 'admin'})
    assert res.status_code == 200
    assert res.get_json()['user']['role'] == 'staff'


def test_9_normal_login_still_works(client):
    res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    assert res.status_code == 200
    assert res.get_json()['user']['role'] == 'admin'


def test_10_google_response_matches_login_shape(client):
    login_body = client.post(
        '/api/auth/login', json={'username': 'staff1', 'password': 'staff123'}
    ).get_json()
    google_body = post_google(client, email='staff@sims.local').get_json()
    assert set(google_body.keys()) == set(login_body.keys())
    assert set(google_body.keys()) == {'message', 'access_token', 'refresh_token', 'user'}


def test_missing_credential_bad_request(client):
    assert client.post('/api/auth/google', json={}).status_code == 400


def test_unverified_google_email_rejected(client):
    res = post_google(client, email='admin@sims.local', verified=False)
    assert res.status_code == 401
