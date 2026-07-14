"""
Backfill script: Generate barcode and QR code for existing product variants
that are missing them. Run once after deployment.

Usage:
    python backfill_barcodes.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.services.code_generator import generate_barcode_value, save_qr_code_file

QR_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'qrcodes')

app = create_app()

with app.app_context():
    variants = ProductVariant.query.filter(
        db.or_(
            ProductVariant.barcode.is_(None),
            ProductVariant.barcode == '',
            ProductVariant.qr_code.is_(None),
            ProductVariant.qr_code == '',
        )
    ).all()

    if not variants:
        print('All variants already have barcode and QR code.')
        sys.exit(0)

    updated = 0
    for v in variants:
        changed = False
        if not v.barcode:
            v.barcode = generate_barcode_value(v.sku)
            dup = ProductVariant.query.filter(
                ProductVariant.barcode == v.barcode,
                ProductVariant.id != v.id
            ).first()
            while dup:
                v.barcode = generate_barcode_value()
                dup = ProductVariant.query.filter(
                    ProductVariant.barcode == v.barcode,
                    ProductVariant.id != v.id
                ).first()
            changed = True

        if not v.qr_code:
            product = Product.query.get(v.product_id)
            if product:
                v.qr_code = save_qr_code_file(v, product, QR_DIR)
                changed = True

        if changed:
            updated += 1
            print(f'  [{updated}] Variant {v.id} ({v.sku}): barcode={v.barcode}, qr_code={v.qr_code}')

    db.session.commit()
    print(f'\nDone. {updated} variant(s) updated out of {len(variants)} found missing data.')
