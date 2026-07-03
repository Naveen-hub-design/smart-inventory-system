from app import db
from datetime import datetime

class Supplier(db.Model):
    __tablename__ = 'suppliers'

    id = db.Column(db.Integer, primary_key=True)
    supplier_name = db.Column(db.String(150), nullable=False)
    contact_person = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    gst_number = db.Column(db.String(50))
    status = db.Column(db.Enum('active', 'inactive'), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    raw_materials = db.relationship('RawMaterial', backref='supplier', lazy=True)
    purchases = db.relationship('Purchase', backref='supplier', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'supplier_name': self.supplier_name,
            'contact_person': self.contact_person,
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'gst_number': self.gst_number,
            'status': self.status,
            'material_count': len(self.raw_materials) if self.raw_materials else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
