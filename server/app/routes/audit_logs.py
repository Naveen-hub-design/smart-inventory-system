from flask import Blueprint, request, jsonify
from app.models.audit_log import AuditLog
from app.middleware.auth import admin_required
from app import db
from app.utils.helpers import parse_date

audit_logs_bp = Blueprint('audit_logs', __name__)


@audit_logs_bp.route('/', methods=['GET'])
@admin_required
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    action = request.args.get('action', '')
    module = request.args.get('module', '')
    username = request.args.get('username', '')
    status = request.args.get('status', '')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'timestamp')
    sort_order = request.args.get('sort_order', 'desc')

    query = AuditLog.query

    if search:
        q = f'%{search}%'
        query = query.filter(
            db.or_(
                AuditLog.username.like(q),
                AuditLog.description.like(q),
                AuditLog.module.like(q),
                AuditLog.action.like(q),
                AuditLog.ip_address.like(q)
            )
        )
    if action:
        query = query.filter(AuditLog.action == action)
    if module:
        query = query.filter(AuditLog.module == module)
    if username:
        query = query.filter(AuditLog.username == username)
    if status:
        query = query.filter(AuditLog.status == status)

    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)
    if start_dt:
        query = query.filter(AuditLog.timestamp >= start_dt)
    if end_dt:
        query = query.filter(AuditLog.timestamp <= end_dt)

    sort_column = getattr(AuditLog, sort_by, AuditLog.timestamp)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'logs': [log.to_dict() for log in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200


@audit_logs_bp.route('/<int:id>', methods=['GET'])
@admin_required
def get_audit_log(id):
    log = AuditLog.query.get(id)
    if not log:
        return jsonify({'error': 'Audit log not found'}), 404
    return jsonify({'log': log.to_dict()}), 200
