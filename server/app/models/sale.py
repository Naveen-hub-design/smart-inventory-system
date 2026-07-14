from app import db
from datetime import datetime

class Sale(db.Model):
    __tablename__ = 'sales'

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(50), unique=True, nullable=False)
    customer_name = db.Column(db.String(150))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    total_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    discount = db.Column(db.Numeric(10, 2), default=0)
    tax = db.Column(db.Numeric(10, 2), default=0)
    grand_total = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    payment_method = db.Column(db.Enum('cash', 'card', 'bank', 'other'), default='cash')
    status = db.Column(db.Enum('pending', 'completed', 'cancelled'), default='pending')
    notes = db.Column(db.Text)
    sale_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = db.relationship('SaleItem', backref='sale', lazy='joined', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'invoice_number': self.invoice_number,
            'customer_name': self.customer_name,
            'user_id': self.user_id,
            'user_name': self.user.full_name if self.user else None,
            'total_amount': float(self.total_amount),
            'discount': float(self.discount) if self.discount else 0,
            'tax': float(self.tax) if self.tax else 0,
            'grand_total': float(self.grand_total),
            'payment_method': self.payment_method,
            'status': self.status,
            'notes': self.notes,
            'sale_date': self.sale_date.isoformat() if self.sale_date else None,
            'items': [item.to_dict() for item in self.items],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class SaleItem(db.Model):
    __tablename__ = 'sale_items'

    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sales.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'))
    variant_id = db.Column(db.Integer, db.ForeignKey('product_variants.id'), nullable=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    discount = db.Column(db.Numeric(10, 2), default=0)
    total_price = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    variant = db.relationship('ProductVariant')

    def to_dict(self):
        from app.models.product_variant import ProductVariant
        v = None
        if self.variant_id:
            v = ProductVariant.query.get(self.variant_id)
        return {
            'id': self.id,
            'sale_id': self.sale_id,
            'product_id': self.product_id,
            'product_name': self.product.product_name if self.product else None,
            'variant_id': self.variant_id,
            'size': v.size if v else (self.product.size if self.product else None),
            'color': v.color if v else (self.product.color if self.product else None),
            'quantity': self.quantity,
            'unit_price': float(self.unit_price),
            'discount': float(self.discount) if self.discount else 0,
            'total_price': float(self.total_price)
        }
