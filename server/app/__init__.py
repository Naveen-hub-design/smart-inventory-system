from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_marshmallow import Marshmallow
from app.config.config import Config
from datetime import timedelta
import os

db = SQLAlchemy()
jwt = JWTManager()
ma = Marshmallow()

def create_app():
    app = Flask(__name__, static_folder='../static')
    app.config.from_object(Config)

    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-sims-2024')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=8)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"], supports_credentials=True)
    ma.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.products import products_bp
    from app.routes.materials import materials_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.purchases import purchases_bp
    from app.routes.sales import sales_bp
    from app.routes.inventory import inventory_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp
    from app.routes.search import search_bp
    from app.routes.notifications import notifications_bp
    from app.routes.categories import categories_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(materials_bp, url_prefix='/api/materials')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(purchases_bp, url_prefix='/api/purchases')
    app.register_blueprint(sales_bp, url_prefix='/api/sales')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(search_bp, url_prefix='/api/search')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')

    with app.app_context():
        db.create_all()

    return app
