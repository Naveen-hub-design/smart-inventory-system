from app import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(200), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'))
    size = db.Column(db.String(20))
    color = db.Column(db.String(50))
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    min_stock = db.Column(db.Integer, nullable=False, default=10)
    image = db.Column(db.String(255))
    barcode = db.Column(db.String(100), unique=True)
    status = db.Column(db.Enum('active', 'inactive'), default='active')
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sale_items = db.relationship('SaleItem', backref='product', lazy=True)
    inventory_logs = db.relationship('InventoryLog', backref='product', lazy=True)

    def sync_stock_from_variants(self):
        from app.models.product_variant import ProductVariant
        total = db.session.query(db.func.coalesce(db.func.sum(ProductVariant.stock), 0)).filter(
            ProductVariant.product_id == self.id
        ).scalar()
        self.quantity = total

    def to_dict(self, include_variants=False):
        result = {
            'id': self.id,
            'product_name': self.product_name,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'size': self.size,
            'color': self.color,
            'price': float(self.price),
            'quantity': self.quantity,
            'min_stock': self.min_stock,
            'image': self.image,
            'barcode': self.barcode,
            'status': self.status,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        if include_variants:
            from app.models.product_variant import ProductVariant
            result['variants'] = [v.to_dict() for v in self.variants.all()]
            result['variant_count'] = self.variants.count()
        return result
