import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'sims-secret-key-2024')
    _db_url = os.getenv('DATABASE_URL', 'mysql+pymysql://root:@localhost:3306/smart_inventory')
    # Render sets DATABASE_URL with postgresql:// scheme; SQLAlchemy 2.x on Python 3.14
    # defaults to the psycopg (v3) driver. Force psycopg2 by rewriting the scheme.
    if _db_url.startswith('postgresql://'):
        _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Connection pool tuning for remote Neon cloud DB (high latency)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'max_overflow': 10,
        'pool_recycle': 300,       # Recycle connections every 5 min (Neon drops idle ones)
        'pool_pre_ping': True,     # Test connection health before use
        'pool_timeout': 30,
        'connect_args': {
            'connect_timeout': 30,
        },
    }
    env = os.getenv('FLASK_ENV', os.getenv('APP_ENV', 'production'))
    
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        if env in ('development', 'testing'):
            JWT_SECRET_KEY = 'dev-fallback-secret-key-sims-must-be-32bytes!'
        else:
            raise RuntimeError("CRITICAL: JWT_SECRET_KEY environment variable is missing in production.")
            
    if len(JWT_SECRET_KEY.encode('utf-8')) < 32:
        raise RuntimeError("CRITICAL: JWT_SECRET_KEY must be at least 32 bytes long for secure HMAC-SHA256 signatures.")

    JWT_ACCESS_TOKEN_EXPIRES = 28800
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
