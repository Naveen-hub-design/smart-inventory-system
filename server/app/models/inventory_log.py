from app import db
from datetime import datetime

class InventoryLog(db.Model):
    __tablename__ = 'inventory_logs'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    material_id = db.Column(db.Integer, db.ForeignKey('raw_materials.id'))
    change_type = db.Column(db.Enum('in', 'out', 'adjustment'), nullable=False)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    reference_type = db.Column(db.String(50))
    reference_id = db.Column(db.Integer)
    notes = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.product_name if self.product else None,
            'material_id': self.material_id,
            'material_name': self.material.material_name if self.material else None,
            'change_type': self.change_type,
            'quantity': float(self.quantity),
            'reference_type': self.reference_type,
            'reference_id': self.reference_id,
            'notes': self.notes,
            'user_name': self.user.full_name if self.user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
