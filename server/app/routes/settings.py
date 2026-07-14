from flask import Blueprint, request, jsonify, send_file, current_app
from app import db
from app.models.setting import SystemSetting
from app.models.user import User
from app.middleware.auth import admin_required, get_current_user
from app.models.audit_log import create_audit_log
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import json
import os
import io

settings_bp = Blueprint('settings', __name__)

CATEGORIES = {
    'company': ['company_name', 'company_logo', 'company_gst', 'company_address',
                'company_email', 'company_phone', 'company_website',
                'company_currency', 'company_timezone'],
    'inventory': ['inventory_low_stock_threshold', 'inventory_auto_sku',
                  'inventory_auto_barcode', 'inventory_auto_qr',
                  'inventory_default_category'],
    'ai': ['ai_enabled', 'ai_reorder', 'ai_forecasting', 'ai_health',
           'ai_supplier_intel', 'ai_response_style', 'ai_confidence_level'],
    'notifications': ['notify_low_stock', 'notify_sales', 'notify_purchases',
                      'notify_suppliers', 'notify_email'],
    'reports': ['report_default_format', 'report_company_logo',
                'report_default_date_range'],
    'appearance': ['appearance_theme', 'appearance_compact_sidebar'],
    'security': ['security_session_timeout'],
}

DEFAULT_SETTINGS = {
    'company_name': '', 'company_logo': '', 'company_gst': '',
    'company_address': '', 'company_email': '', 'company_phone': '',
    'company_website': '', 'company_currency': 'INR',
    'company_timezone': 'Asia/Kolkata',
    'inventory_low_stock_threshold': '10',
    'inventory_auto_sku': 'true', 'inventory_auto_barcode': 'false',
    'inventory_auto_qr': 'false', 'inventory_default_category': '',
    'ai_enabled': 'true', 'ai_reorder': 'true', 'ai_forecasting': 'true',
    'ai_health': 'true', 'ai_supplier_intel': 'true',
    'ai_response_style': 'professional', 'ai_confidence_level': '80',
    'notify_low_stock': 'true', 'notify_sales': 'false',
    'notify_purchases': 'false', 'notify_suppliers': 'false',
    'notify_email': 'false',
    'report_default_format': 'excel', 'report_company_logo': 'true',
    'report_default_date_range': '30',
    'appearance_theme': 'light', 'appearance_compact_sidebar': 'false',
    'security_session_timeout': '30',
}

CATEGORY_MAP = {}
for cat, keys in CATEGORIES.items():
    for k in keys:
        CATEGORY_MAP[k] = cat


def get_setting(key, default=''):
    setting = SystemSetting.query.filter_by(key=key).first()
    if setting:
        return setting.value
    return DEFAULT_SETTINGS.get(key, default)


def set_setting(key, value):
    setting = SystemSetting.query.filter_by(key=key).first()
    if setting:
        setting.value = str(value)
        setting.updated_at = datetime.utcnow()
    else:
        cat = CATEGORY_MAP.get(key, 'general')
        setting = SystemSetting(key=key, value=str(value), category=cat)
        db.session.add(setting)
    return setting


def is_ai_feature_enabled(feature_key):
    val = get_setting(feature_key, 'false')
    return val.lower() in ('true', '1', 'yes')


def is_notification_enabled(notify_key):
    val = get_setting(notify_key, 'false')
    return val.lower() in ('true', '1', 'yes')


@settings_bp.route('/', methods=['GET'])
@admin_required
def get_settings():
    rows = SystemSetting.query.all()
    stored = {r.key: r.value for r in rows}
    settings = {}
    for cat, keys in CATEGORIES.items():
        section = {}
        for k in keys:
            section[k] = stored.get(k, DEFAULT_SETTINGS.get(k, ''))
        settings[cat] = section
    return jsonify({'settings': settings}), 200


@settings_bp.route('/', methods=['PUT'])
@admin_required
def update_settings():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    user = get_current_user()
    updated = []
    for key, value in data.items():
        if key in CATEGORY_MAP or key in DEFAULT_SETTINGS:
            set_setting(key, value)
            updated.append(key)
    if updated:
        db.session.commit()
        create_audit_log(
            username=user.username if user else 'system',
            role=user.role if user else 'system',
            action='update_settings',
            module='settings',
            description=f'Updated settings: {", ".join(updated[:10])}'
        )
    return get_settings()


@settings_bp.route('/reset', methods=['POST'])
@admin_required
def reset_settings():
    user = get_current_user()
    SystemSetting.query.delete()
    for key, value in DEFAULT_SETTINGS.items():
        cat = CATEGORY_MAP.get(key, 'general')
        setting = SystemSetting(key=key, value=value, category=cat)
        db.session.add(setting)
    db.session.commit()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='reset_settings',
        module='settings',
        description='Settings reset to defaults'
    )
    return get_settings()


@settings_bp.route('/profile', methods=['PUT'])
@admin_required
def update_profile():
    user = get_current_user()
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'email' in data:
        if User.query.filter(User.email == data['email'], User.id != user.id).first():
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email']
    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200


@settings_bp.route('/password', methods=['PUT'])
@admin_required
def change_password():
    user = get_current_user()
    data = request.get_json()
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password required'}), 400
    from werkzeug.security import check_password_hash
    if not check_password_hash(user.password_hash, data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    user.password_hash = generate_password_hash(data['new_password'])
    db.session.commit()
    create_audit_log(
        username=user.username, role=user.role,
        action='password_change', module='settings',
        description=f'User {user.username} changed their password'
    )
    return jsonify({'message': 'Password changed successfully'}), 200


@settings_bp.route('/avatar', methods=['POST'])
@admin_required
def upload_avatar():
    user = get_current_user()
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    allowed = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed:
        return jsonify({'error': f'File type .{ext} not allowed'}), 400
    upload_dir = os.path.join(current_app.config['UPLOADS_DIR'], 'avatars')
    os.makedirs(upload_dir, exist_ok=True)
    filename = f'user_{user.id}_{int(datetime.utcnow().timestamp())}.{ext}'
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    user.avatar = f'/uploads/avatars/{filename}'
    db.session.commit()
    return jsonify({'message': 'Avatar updated', 'avatar': user.avatar}), 200


@settings_bp.route('/avatar', methods=['DELETE'])
@admin_required
def remove_avatar():
    user = get_current_user()
    if user.avatar:
        filename = user.avatar.split('/')[-1]
        filepath = os.path.join(current_app.config['UPLOADS_DIR'], 'avatars', filename)
        if os.path.isfile(filepath):
            os.remove(filepath)
    user.avatar = None
    db.session.commit()
    return jsonify({'message': 'Avatar removed', 'avatar': None}), 200


@settings_bp.route('/logo', methods=['POST'])
@admin_required
def upload_logo():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    allowed = {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'}
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in allowed:
        return jsonify({'error': f'File type .{ext} not allowed'}), 400
    upload_dir = os.path.join(current_app.config['UPLOADS_DIR'], 'company')
    os.makedirs(upload_dir, exist_ok=True)
    filename = f'company_logo_{int(datetime.utcnow().timestamp())}.{ext}'
    filepath = os.path.join(upload_dir, filename)
    file.save(filepath)
    logo_url = f'/uploads/company/{filename}'
    set_setting('company_logo', logo_url)
    db.session.commit()
    return jsonify({'message': 'Company logo updated', 'logo': logo_url}), 200


@settings_bp.route('/logo', methods=['DELETE'])
@admin_required
def remove_logo():
    current_logo = get_setting('company_logo', '')
    if current_logo:
        filename = current_logo.split('/')[-1]
        filepath = os.path.join(current_app.config['UPLOADS_DIR'], 'company', filename)
        if os.path.isfile(filepath):
            os.remove(filepath)
    set_setting('company_logo', '')
    db.session.commit()
    return jsonify({'message': 'Company logo removed', 'logo': ''}), 200


@settings_bp.route('/about', methods=['GET'])
@admin_required
def get_about():
    db_status = 'connected'
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception:
        db_status = 'disconnected'
    ai_status = 'available'
    try:
        from app.services.erp_service_layer import erp_service
    except Exception:
        ai_status = 'unavailable'
    return jsonify({
        'project_name': 'Smart Inventory Management System',
        'version': '2.0.0',
        'backend_status': 'healthy',
        'database_status': db_status,
        'ai_status': ai_status,
    }), 200


@settings_bp.route('/security/sessions', methods=['GET'])
@admin_required
def get_active_sessions():
    from app.models.audit_log import AuditLog
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(hours=24)
    user = get_current_user()
    recent = AuditLog.query.filter(
        AuditLog.username == user.username,
        AuditLog.action == 'login',
        AuditLog.timestamp >= cutoff
    ).count()
    return jsonify({'active_sessions': max(1, recent)}), 200


@settings_bp.route('/security/login-history', methods=['GET'])
@admin_required
def get_login_history():
    user = get_current_user()
    from app.models.audit_log import AuditLog
    logs = AuditLog.query.filter_by(
        username=user.username, action='login'
    ).order_by(AuditLog.id.desc()).limit(20).all()
    history = []
    for log in logs:
        history.append({
            'timestamp': log.timestamp.isoformat() if log.timestamp else None,
            'ip_address': log.ip_address or 'Unknown',
            'status': log.status or 'success',
        })
    return jsonify({'history': history}), 200


@settings_bp.route('/backup/export', methods=['POST'])
@admin_required
def export_backup():
    rows = SystemSetting.query.all()
    data = {
        'exported_at': datetime.utcnow().isoformat(),
        'version': '2.0.0',
        'settings': {r.key: r.value for r in rows},
    }
    json_bytes = json.dumps(data, indent=2).encode('utf-8')
    return send_file(
        io.BytesIO(json_bytes),
        mimetype='application/json',
        as_attachment=True,
        download_name=f'sims-backup-{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}.json'
    )


@settings_bp.route('/backup/import', methods=['POST'])
@admin_required
def import_backup():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    try:
        raw = file.read().decode('utf-8')
        data = json.loads(raw)
    except Exception:
        return jsonify({'error': 'Invalid backup file'}), 400
    imported = data.get('settings', {})
    if not imported:
        return jsonify({'error': 'No settings found in backup file'}), 400
    user = get_current_user()
    count = 0
    for key, value in imported.items():
        if key in CATEGORY_MAP or key in DEFAULT_SETTINGS:
            set_setting(key, value)
            count += 1
    db.session.commit()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='import_settings',
        module='settings',
        description=f'Imported {count} settings from backup'
    )
    return jsonify({'message': f'Imported {count} settings', 'count': count}), 200
