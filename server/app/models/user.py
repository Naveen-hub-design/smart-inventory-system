from datetime import datetime

from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    employee_id = db.Column(db.String(20), unique=True, nullable=True)
    role = db.Column(db.Enum("admin", "staff"), default="staff")
    phone = db.Column(db.String(20))
    avatar = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    password_reset_required = db.Column(db.Boolean, default=False)
    last_login = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    purchases = db.relationship("Purchase", backref="user", lazy=True)
    sales = db.relationship("Sale", backref="user", lazy=True)
    inventory_logs = db.relationship("InventoryLog", backref="user", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "employee_id": self.employee_id,
            "role": self.role,
            "phone": self.phone,
            "avatar": self.avatar,
            "is_active": self.is_active,
            "password_reset_required": self.password_reset_required,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


def generate_employee_id():
    last_user = User.query.order_by(User.id.desc()).first()
    if not last_user or not last_user.employee_id:
        return 'EMP0001'
    num = int(last_user.employee_id[3:]) + 1
    return f'EMP{num:04d}'
