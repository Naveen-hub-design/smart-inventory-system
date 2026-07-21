from app import db
from datetime import datetime

class Purchase(db.Model):
    __tablename__ = 'purchases'

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey('suppliers.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    total_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    discount = db.Column(db.Numeric(10, 2), default=0)
    tax = db.Column(db.Numeric(10, 2), default=0)
    grand_total = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    status = db.Column(db.Enum('pending', 'completed', 'cancelled'), default='pending', index=True)
    notes = db.Column(db.Text)
    purchase_date = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('PurchaseItem', backref='purchase', lazy='joined', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'supplier_id': self.supplier_id,
            'supplier_name': self.supplier.supplier_name if self.supplier else None,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'total_amount': float(self.total_amount),
            'discount': float(self.discount) if self.discount else 0,
            'tax': float(self.tax) if self.tax else 0,
            'grand_total': float(self.grand_total),
            'status': self.status,
            'notes': self.notes,
            'purchase_date': self.purchase_date.isoformat() if self.purchase_date else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class PurchaseItem(db.Model):
    __tablename__ = 'purchase_items'

    id = db.Column(db.Integer, primary_key=True)
    purchase_id = db.Column(db.Integer, db.ForeignKey('purchases.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('raw_materials.id'), nullable=True)
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=True)
    quantity = db.Column(db.Numeric(10, 2), nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    variant = db.relationship('ProductVariant')

    def to_dict(self):
        v = self.variant if self.variant_id else None
        return {
            'id': self.id,
            'purchase_id': self.purchase_id,
            'material_id': self.material_id,
            'material_name': self.material.material_name if self.material else None,
            'unit': self.material.unit if self.material else None,
            'variant_id': self.variant_id,
            'variant_name': f'{v.product.product_name} - {v.color}/{v.size}' if v and v.product else None,
            'quantity': float(self.quantity),
            'unit_price': float(self.unit_price),
            'total_price': float(self.total_price)
        }
