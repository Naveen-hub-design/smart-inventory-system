from app import db
from datetime import datetime

class ProductVariant(db.Model):
    __tablename__ = 'product_variants'

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    size = db.Column(db.String(20))
    color = db.Column(db.String(50))
    sku = db.Column(db.String(100), unique=True)
    barcode = db.Column(db.String(100), unique=True)
    qr_code = db.Column(db.String(255))
    stock = db.Column(db.Integer, nullable=False, default=0, index=True)
    min_stock = db.Column(db.Integer, nullable=False, default=10)
    cost_price = db.Column(db.Numeric(10, 2), default=0)
    selling_price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = db.relationship('Product', backref=db.backref('variants', lazy='dynamic', cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.product_name if self.product else None,
            'size': self.size,
            'color': self.color,
            'sku': self.sku,
            'barcode': self.barcode,
            'qr_code': self.qr_code,
            'stock': self.stock,
            'min_stock': self.min_stock,
            'cost_price': float(self.cost_price) if self.cost_price else 0,
            'selling_price': float(self.selling_price) if self.selling_price else 0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
