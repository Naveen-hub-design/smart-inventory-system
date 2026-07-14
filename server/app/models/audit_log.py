from app import db
from datetime import datetime
from flask import request

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    username = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    module = db.Column(db.String(50), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='success')
    ip_address = db.Column(db.String(45))
    request_method = db.Column(db.String(10))
    endpoint = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('audit_logs', lazy='dynamic'))

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'user_id': self.user_id,
            'username': self.username,
            'role': self.role,
            'module': self.module,
            'action': self.action,
            'description': self.description,
            'status': self.status,
            'ip_address': self.ip_address,
            'request_method': self.request_method,
            'endpoint': self.endpoint,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


def create_audit_log(username, role, action, module, description, ip_address=None,
                     user_id=None, status='success', request_method=None, endpoint=None):
    if ip_address is None:
        try:
            ip_address = request.remote_addr
        except RuntimeError:
            ip_address = None
    if request_method is None:
        try:
            request_method = request.method
        except RuntimeError:
            request_method = None
    if endpoint is None:
        try:
            endpoint = request.path
        except RuntimeError:
            endpoint = None
    log = AuditLog(
        username=username,
        role=role,
        action=action,
        module=module,
        description=description,
        status=status,
        ip_address=ip_address,
        user_id=user_id,
        request_method=request_method,
        endpoint=endpoint
    )
    db.session.add(log)
    return log
