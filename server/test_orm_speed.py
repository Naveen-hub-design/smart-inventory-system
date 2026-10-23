import time
from app import create_app, db
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.models.category import Category
from sqlalchemy.orm import joinedload

app = create_app()

with app.app_context():
    # WARMUP
    list(ProductVariant.query.options(joinedload(ProductVariant.product).joinedload(Product.category)).filter(ProductVariant.stock >= 0).all())
    
    t0 = time.perf_counter()
    variants = ProductVariant.query.options(
        joinedload(ProductVariant.product).joinedload(Product.category)
    ).filter(
        ProductVariant.stock >= 0
    ).all()
    t1 = time.perf_counter()
    print(f"ORM loading: {(t1-t0)*1000:.2f} ms")
    
    t0 = time.perf_counter()
    raw_variants = db.session.query(
        ProductVariant.id,
        ProductVariant.sku,
        ProductVariant.color,
        ProductVariant.size,
        ProductVariant.stock,
        ProductVariant.min_stock,
        Product.product_name,
        Category.name.label('category_name')
    ).outerjoin(Product, ProductVariant.product_id == Product.id)\
     .outerjoin(Category, Product.category_id == Category.id)\
     .filter(ProductVariant.stock >= 0).all()
    t1 = time.perf_counter()
    print(f"Raw entities loading: {(t1-t0)*1000:.2f} ms")
