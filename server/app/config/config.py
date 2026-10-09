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
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-sims-2024')
    JWT_ACCESS_TOKEN_EXPIRES = 28800
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
