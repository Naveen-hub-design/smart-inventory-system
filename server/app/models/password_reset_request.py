from datetime import datetime
from app import db


class PasswordResetRequest(db.Model):
    __tablename__ = 'password_reset_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    username_input = db.Column(db.String(100), nullable=False)
    email_input = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='pending')
    admin_notes = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def to_dict(self):
        from app.models.user import User
        result = {
            'id': self.id,
            'user_id': self.user_id,
            'username_input': self.username_input,
            'email_input': self.email_input,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'resolved_by': self.resolved_by,
        }
        if self.user_id:
            user = User.query.get(self.user_id)
            if user:
                result['user_full_name'] = user.full_name
                result['user_employee_id'] = user.employee_id
            else:
                result['user_full_name'] = None
                result['user_employee_id'] = None
        else:
            result['user_full_name'] = None
            result['user_employee_id'] = None
        return result
