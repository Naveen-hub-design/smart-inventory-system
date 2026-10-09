import os
import sys
import tempfile
import pytest
from datetime import timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_tmp = tempfile.NamedTemporaryFile(suffix='.db', delete=False)
_tmp.close()
os.environ['DATABASE_URL'] = f'sqlite:///{_tmp.name}'
os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret'

from app.config.config import Config
Config.SQLALCHEMY_ENGINE_OPTIONS = {}

from app import create_app, db
from app.routes.settings import get_setting, set_setting, clear_settings_cache, DEFAULT_SETTINGS
from app.routes.auth import _get_session_expiry


@pytest.fixture(scope='module')
def app_ctx():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    with app.app_context():
        db.create_all()
        clear_settings_cache()
        yield app
        clear_settings_cache()


def test_get_setting_default_and_caching(app_ctx):
    clear_settings_cache()
    # Default setting fallback
    timeout_val = get_setting('security_session_timeout')
    assert timeout_val == '30'

    # Cache hit check (modifying in-memory cache directly)
    set_setting('security_session_timeout', '60')
    assert get_setting('security_session_timeout') == '60'


def test_setting_update_invalidation(app_ctx):
    clear_settings_cache()
    set_setting('security_session_timeout', '45')
    db.session.commit()
    assert get_setting('security_session_timeout') == '45'

    # Update to new value
    set_setting('security_session_timeout', '90')
    db.session.commit()
    assert get_setting('security_session_timeout') == '90'


def test_session_expiry_calculation_and_clamping(app_ctx):
    clear_settings_cache()
    set_setting('security_session_timeout', '60')
    expiry = _get_session_expiry()
    assert expiry == timedelta(minutes=60)

    # Test lower bound clamping (min 5 minutes)
    set_setting('security_session_timeout', '2')
    assert _get_session_expiry() == timedelta(minutes=5)

    # Test upper bound clamping (max 480 minutes)
    set_setting('security_session_timeout', '1000')
    assert _get_session_expiry() == timedelta(minutes=480)

    # Test invalid string fallback
    set_setting('security_session_timeout', 'invalid_val')
    assert _get_session_expiry() == timedelta(minutes=30)
