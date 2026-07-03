from app import db
from datetime import datetime

class RawMaterial(db.Model):
    __tablename__ = 'raw_materials'

    id = db.Column(db.Integer, primary_key=True)
    material_name = db.Column(db.String(200), nullable=False)
    unit = db.Column(db.String(50), nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    quantity = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    min_stock = db.Column(db.Numeric(10, 2), nullable=False, default=10)
    cost = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    purchase_items = db.relationship('PurchaseItem', backref='material', lazy=True)
    inventory_logs = db.relationship('InventoryLog', backref='material', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'material_name': self.material_name,
            'unit': self.unit,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.supplier_name if self.supplier else None,
            'quantity': float(self.quantity),
            'min_stock': float(self.min_stock),
            'cost': float(self.cost),
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
