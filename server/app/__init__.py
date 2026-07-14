from flask import Flask, jsonify
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
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=30)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"], supports_credentials=True)
    ma.init_app(app)

    from app.models.token_blocklist import TokenBlocklist
    from app.models.password_reset_request import PasswordResetRequest

    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        jti = jwt_payload['jti']
        token = TokenBlocklist.query.filter_by(jti=jti).first()
        return token is not None

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Invalid token'}), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token has been revoked'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Authentication required'}), 401

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
    from app.routes.audit_logs import audit_logs_bp
    from app.routes.product_variants import product_variants_bp
    from app.routes.ai_reorder import ai_bp
    from app.routes.ai_forecast import forecast_bp
    from app.routes.ai_insights import insights_bp
    from app.routes.ai_health import health_bp
    from app.routes.ai_suppliers import supplier_intel_bp
    from app.routes.ai_copilot import copilot_bp
    from app.routes.settings import settings_bp

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
    app.register_blueprint(audit_logs_bp, url_prefix='/api/audit-logs')
    app.register_blueprint(product_variants_bp, url_prefix='/api/product-variants')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(forecast_bp, url_prefix='/api/ai')
    app.register_blueprint(insights_bp, url_prefix='/api/ai')
    app.register_blueprint(health_bp, url_prefix='/api/ai')
    app.register_blueprint(supplier_intel_bp, url_prefix='/api/ai')
    app.register_blueprint(copilot_bp, url_prefix='/api/ai')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')

    # Static file serving for uploads
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'avatars'), exist_ok=True)
    os.makedirs(os.path.join(uploads_dir, 'company'), exist_ok=True)
    app.config['UPLOADS_DIR'] = uploads_dir

    # Serve uploads via Flask
    from flask import send_from_directory
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(uploads_dir, filename)

    # Migrate files from old uploads path (server/uploads/) to correct path (project-root/uploads/)
    old_uploads = os.path.join(os.path.dirname(uploads_dir), 'server', 'uploads')
    if os.path.isdir(old_uploads):
        import shutil
        for subdir in ['avatars', 'company']:
            old_sub = os.path.join(old_uploads, subdir)
            new_sub = os.path.join(uploads_dir, subdir)
            if os.path.isdir(old_sub):
                for fname in os.listdir(old_sub):
                    src = os.path.join(old_sub, fname)
                    dst = os.path.join(new_sub, fname)
                    if os.path.isfile(src) and not os.path.exists(dst):
                        shutil.copy2(src, dst)
                        os.remove(src)

    with app.app_context():
        db.create_all()

        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        audit_columns = [col['name'] for col in inspector.get_columns('audit_logs')]
        if 'user_id' not in audit_columns:
            db.session.execute(db.text('ALTER TABLE audit_logs ADD COLUMN user_id INTEGER REFERENCES users(id)'))
        if 'status' not in audit_columns:
            db.session.execute(db.text("ALTER TABLE audit_logs ADD COLUMN status VARCHAR(20) DEFAULT 'success'"))
        if 'request_method' not in audit_columns:
            db.session.execute(db.text('ALTER TABLE audit_logs ADD COLUMN request_method VARCHAR(10)'))
        if 'endpoint' not in audit_columns:
            db.session.execute(db.text('ALTER TABLE audit_logs ADD COLUMN endpoint VARCHAR(200)'))
        if 'created_at' not in audit_columns:
            db.session.execute(db.text('ALTER TABLE audit_logs ADD COLUMN created_at DATETIME'))
        db.session.commit()

        # Migration for variant_id columns
        try:
            si_columns = [col['name'] for col in inspector.get_columns('sale_items')]
            if 'variant_id' not in si_columns:
                db.session.execute(db.text('ALTER TABLE sale_items ADD COLUMN variant_id INTEGER REFERENCES product_variants(id)'))
        except Exception:
            pass
        try:
            pi_columns = [col['name'] for col in inspector.get_columns('purchase_items')]
            if 'variant_id' not in pi_columns:
                db.session.execute(db.text('ALTER TABLE purchase_items ADD COLUMN variant_id INTEGER REFERENCES product_variants(id)'))
        except Exception:
            pass
        try:
            il_columns = [col['name'] for col in inspector.get_columns('inventory_logs')]
            if 'variant_id' not in il_columns:
                db.session.execute(db.text('ALTER TABLE inventory_logs ADD COLUMN variant_id INTEGER REFERENCES product_variants(id)'))
        except Exception:
            pass
        try:
            pv_columns = [col['name'] for col in inspector.get_columns('product_variants')]
            if 'qr_code' not in pv_columns:
                db.session.execute(db.text('ALTER TABLE product_variants ADD COLUMN qr_code VARCHAR(255)'))
        except Exception:
            pass
        db.session.commit()

        from app.models.user import User
        from app.models.setting import SystemSetting
        from werkzeug.security import generate_password_hash

        if not User.query.filter_by(username='admin').first():
            db.session.add(User(
                username='admin',
                email='admin@sims.com',
                password_hash=generate_password_hash('admin123'),
                full_name='Admin User',
                role='admin',
                employee_id='EMP0001',
                is_active=True
            ))

        if not User.query.filter_by(username='staff1').first():
            db.session.add(User(
                username='staff1',
                email='staff1@sims.com',
                password_hash=generate_password_hash('staff123'),
                full_name='Staff One',
                role='staff',
                employee_id='EMP0002',
                is_active=True
            ))

        if not SystemSetting.query.first():
            from app.routes.settings import DEFAULT_SETTINGS, CATEGORY_MAP
            for key, value in DEFAULT_SETTINGS.items():
                cat = CATEGORY_MAP.get(key, 'general')
                db.session.add(SystemSetting(key=key, value=value, category=cat))

        db.session.commit()

    return app
