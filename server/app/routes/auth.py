from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt, decode_token
)
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.user import User, generate_employee_id
from app.models.token_blocklist import TokenBlocklist
from app.models.password_reset_request import PasswordResetRequest
from app.middleware.auth import admin_required, get_current_user
from app.models.audit_log import create_audit_log
from app.routes.settings import get_setting
from app import db
from datetime import datetime, timedelta


def _get_session_expiry():
    try:
        minutes = int(get_setting('security_session_timeout', '30'))
        return timedelta(minutes=max(5, min(minutes, 480)))
    except (ValueError, TypeError):
        return timedelta(minutes=30)

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password required'}), 400

    user = User.query.filter_by(username=data['username']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        create_audit_log(
            username=data['username'],
            role='unknown',
            action='login',
            module='auth',
            description=f'Failed login attempt for {data["username"]}',
            status='failure'
        )
        db.session.commit()
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user.is_active:
        create_audit_log(
            username=data['username'],
            role=user.role,
            action='login',
            module='auth',
            description=f'Login attempt for deactivated account {data["username"]}',
            status='failure'
        )
        db.session.commit()
        return jsonify({'error': 'Account is deactivated'}), 403

    user.last_login = datetime.utcnow()
    create_audit_log(
        username=user.username,
        role=user.role,
        action='login',
        module='auth',
        description=f'User {user.username} logged in'
    )
    db.session.commit()

    claims = {'role': user.role, 'username': user.username}
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims=claims,
        expires_delta=_get_session_expiry()
    )
    refresh_token = create_refresh_token(
        identity=str(user.id),
        additional_claims=claims
    )

    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    access_jti = get_jwt()['jti']
    blocklist = [TokenBlocklist(jti=access_jti, token_type='access')]

    data = request.get_json()
    if data and data.get('refresh_token'):
        try:
            refresh_decoded = decode_token(data['refresh_token'])
            blocklist.append(TokenBlocklist(
                jti=refresh_decoded['jti'],
                token_type='refresh'
            ))
        except Exception:
            pass

    for entry in blocklist:
        db.session.add(entry)

    user = get_current_user()
    if user:
        create_audit_log(
            username=user.username,
            role=user.role,
            action='logout',
            module='auth',
            description=f'User {user.username} logged out'
        )
    db.session.commit()
    return jsonify({'message': 'Logged out'}), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    access_token = create_access_token(
        identity=identity,
        additional_claims={
            'role': claims.get('role', 'staff'),
            'username': claims.get('username', '')
        }
    )
    return jsonify({'access_token': access_token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    if data.get('full_name'):
        user.full_name = data['full_name']
    if data.get('phone'):
        user.phone = data['phone']
    if data.get('email'):
        if User.query.filter(User.email == data['email'], User.id != user.id).first():
            return jsonify({'error': 'Email already in use'}), 409
        user.email = data['email']

    db.session.commit()
    return jsonify({'message': 'Profile updated', 'user': user.to_dict()}), 200


@auth_bp.route('/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new password required'}), 400

    if not check_password_hash(user.password_hash, data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401

    user.password_hash = generate_password_hash(data['new_password'])
    user.password_reset_required = False
    create_audit_log(
        username=user.username,
        role=user.role,
        action='password_reset',
        module='auth',
        description=f'User {user.username} changed their own password'
    )
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'}), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    if not data or not (data.get('username') or data.get('email')):
        return jsonify({'error': 'Username or email required'}), 400

    username_input = data.get('username', '')
    email_input = data.get('email', '')

    user = None
    if username_input:
        user = User.query.filter_by(username=username_input).first()
    if not user and email_input:
        user = User.query.filter_by(email=email_input).first()

    if user:
        req = PasswordResetRequest(
            user_id=user.id,
            username_input=username_input or user.username,
            email_input=email_input or user.email,
            status='pending'
        )
        db.session.add(req)
        create_audit_log(
            username=user.username,
            role=user.role,
            action='password_reset_request',
            module='auth',
            description=f'Password reset requested for {user.username}'
        )
        db.session.commit()

    return jsonify({'message': 'Your password reset request has been sent to the system administrator.'}), 200


@auth_bp.route('/password-reset-requests', methods=['GET'])
@jwt_required()
@admin_required
def get_password_reset_requests():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status', '')

    query = PasswordResetRequest.query.order_by(PasswordResetRequest.created_at.desc())

    if status_filter:
        query = query.filter(PasswordResetRequest.status == status_filter)

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'requests': [r.to_dict() for r in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200


@auth_bp.route('/password-reset-requests/<int:id>/approve', methods=['PUT'])
@jwt_required()
@admin_required
def approve_password_reset(id):
    req = PasswordResetRequest.query.get(id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    if req.status != 'pending':
        return jsonify({'error': 'Request already resolved'}), 400

    data = request.get_json()
    if not data or not data.get('new_password'):
        return jsonify({'error': 'new_password required'}), 400
    if len(data['new_password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if not req.user_id:
        return jsonify({'error': 'User not found'}), 404

    user = User.query.get(req.user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = generate_password_hash(data['new_password'])
    user.password_reset_required = True
    req.status = 'approved'
    req.resolved_at = datetime.utcnow()
    admin = get_current_user()
    if admin:
        req.resolved_by = admin.id

    create_audit_log(
        username=user.username,
        role=user.role,
        action='password_reset_approved',
        module='auth',
        description=f'Admin {admin.username if admin else "unknown"} approved password reset for {user.username}'
    )
    db.session.commit()

    return jsonify({'message': 'Password reset approved. User must change password on next login.'}), 200


@auth_bp.route('/password-reset-requests/<int:id>/reject', methods=['PUT'])
@jwt_required()
@admin_required
def reject_password_reset(id):
    req = PasswordResetRequest.query.get(id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    if req.status != 'pending':
        return jsonify({'error': 'Request already resolved'}), 400

    data = request.get_json()
    req.status = 'rejected'
    req.admin_notes = (data or {}).get('notes', '')
    req.resolved_at = datetime.utcnow()
    admin = get_current_user()
    if admin:
        req.resolved_by = admin.id

    db.session.commit()
    return jsonify({'message': 'Request rejected'}), 200


@auth_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = User.query

    if search:
        q = f'%{search}%'
        query = query.filter(
            db.or_(
                User.username.like(q),
                User.full_name.like(q),
                User.email.like(q)
            )
        )
    if status == 'active':
        query = query.filter(User.is_active == True)
    elif status == 'inactive':
        query = query.filter(User.is_active == False)

    sort_column = getattr(User, sort_by, User.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200


@auth_bp.route('/users', methods=['POST'])
@jwt_required()
@admin_required
def create_user():
    data = request.get_json()
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Username, email and password required'}), 400

    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409

    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409

    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password']),
        full_name=data.get('full_name', data['username']),
        role='staff',
        phone=data.get('phone'),
        employee_id=generate_employee_id()
    )
    db.session.add(user)
    admin = get_current_user()
    create_audit_log(
        username=admin.username,
        role=admin.role,
        action='create',
        module='auth',
        description=f'Admin {admin.username} created user {data["username"]}'
    )
    db.session.commit()

    return jsonify({'message': 'User created successfully', 'user': user.to_dict()}), 201


@auth_bp.route('/users/<int:id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'admin':
        return jsonify({'error': 'Cannot modify admin users'}), 403

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    changed = []
    if data.get('username') and data['username'] != user.username:
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 409
        user.username = data['username']
        changed.append('username')

    if data.get('email') and data['email'] != user.email:
        if User.query.filter(User.email == data['email'], User.id != user.id).first():
            return jsonify({'error': 'Email already exists'}), 409
        user.email = data['email']
        changed.append('email')

    if data.get('full_name'):
        user.full_name = data['full_name']
        changed.append('full name')

    if data.get('phone') is not None:
        user.phone = data['phone']
        changed.append('phone')

    admin = get_current_user()
    create_audit_log(
        username=admin.username,
        role=admin.role,
        action='update',
        module='auth',
        description=f'Admin {admin.username} updated user {user.username} ({", ".join(changed) if changed else "no changes"})'
    )
    db.session.commit()
    return jsonify({'message': 'User updated', 'user': user.to_dict()}), 200


@auth_bp.route('/users/<int:id>/status', methods=['PUT'])
@jwt_required()
@admin_required
def toggle_user_status(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'admin':
        return jsonify({'error': 'Cannot modify admin users'}), 403

    data = request.get_json()
    if data is None or 'is_active' not in data:
        return jsonify({'error': 'is_active field required'}), 400

    user.is_active = bool(data['is_active'])
    status = 'activated' if user.is_active else 'deactivated'
    admin = get_current_user()
    create_audit_log(
        username=admin.username,
        role=admin.role,
        action='update',
        module='auth',
        description=f'Admin {admin.username} {status} user {user.username}'
    )
    db.session.commit()
    return jsonify({'message': f'User {status}', 'user': user.to_dict()}), 200


@auth_bp.route('/users/<int:id>/reset-password', methods=['PUT'])
@jwt_required()
@admin_required
def reset_user_password(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'admin':
        return jsonify({'error': 'Cannot modify admin users'}), 403

    data = request.get_json()
    if not data or not data.get('new_password'):
        return jsonify({'error': 'new_password required'}), 400

    user.password_hash = generate_password_hash(data['new_password'])
    admin = get_current_user()
    create_audit_log(
        username=admin.username,
        role=admin.role,
        action='password_reset',
        module='auth',
        description=f'Admin {admin.username} reset password for user {user.username}'
    )
    db.session.commit()
    return jsonify({'message': 'Password reset successfully'}), 200


@auth_bp.route('/users/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if user.role == 'admin':
        return jsonify({'error': 'Cannot delete admin users'}), 403

    username = user.username
    admin = get_current_user()
    create_audit_log(
        username=admin.username,
        role=admin.role,
        action='delete',
        module='auth',
        description=f'Admin {admin.username} deleted user {username}'
    )
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted'}), 200
