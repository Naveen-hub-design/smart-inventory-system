import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.middleware.auth import staff_required, get_current_user
from app.models.audit_log import create_audit_log
from app.services.code_generator import generate_sku, get_product_code, get_category_code, get_color_code, generate_barcode_value, save_qr_code_file, CATEGORY_CODES, COLOR_CODES
from app.routes.settings import get_setting, is_ai_feature_enabled
from app import db
from sqlalchemy import func
import io
import barcode
from barcode.writer import ImageWriter

product_variants_bp = Blueprint('product_variants', __name__)

QR_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'uploads', 'qrcodes')


def get_next_sequence(product, variant):
    col_code = get_color_code(variant.color)
    size_part = (variant.size or "OS").replace("-", "").replace(" ", "").upper()[:4]
    prefix = f"{get_category_code(product.category.name if product.category else None)}-{get_product_code(product.product_name)}-{col_code}-{size_part}"
    max_seq = db.session.query(
        func.max(func.cast(
            func.substring(ProductVariant.sku, len(prefix) + 2), db.Integer
        ))
    ).filter(
        ProductVariant.sku.like(f'{prefix}-%')
    ).scalar()
    return (max_seq or 0) + 1


@product_variants_bp.route('/', methods=['GET'])
@staff_required
def get_variants():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    product_id = request.args.get('product_id', type=int)
    color = request.args.get('color', '')
    size = request.args.get('size', '')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = ProductVariant.query

    if search:
        query = query.join(Product).filter(
            db.or_(
                ProductVariant.sku.like(f'%{search}%'),
                ProductVariant.barcode.like(f'%{search}%'),
                Product.product_name.like(f'%{search}%')
            )
        )
    if product_id:
        query = query.filter(ProductVariant.product_id == product_id)
    if color:
        query = query.filter(ProductVariant.color == color)
    if size:
        query = query.filter(ProductVariant.size == size)

    sort_column = getattr(ProductVariant, sort_by, ProductVariant.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'variants': [v.to_dict() for v in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200


@product_variants_bp.route('/<int:id>', methods=['GET'])
@staff_required
def get_variant(id):
    variant = ProductVariant.query.get(id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404
    return jsonify({'variant': variant.to_dict()}), 200


@product_variants_bp.route('/', methods=['POST'])
@staff_required
def create_variant():
    data = request.get_json()
    if not data or not data.get('product_id'):
        return jsonify({'error': 'product_id required'}), 400

    product = Product.query.get(data['product_id'])
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    default_min = int(get_setting('inventory_low_stock_threshold', '10'))
    variant = ProductVariant(
        product_id=data['product_id'],
        size=data.get('size'),
        color=data.get('color'),
        stock=int(data.get('stock', 0)),
        min_stock=int(data.get('min_stock', default_min)),
        cost_price=float(data.get('cost_price', 0)),
        selling_price=float(data.get('selling_price', product.price))
    )
    db.session.add(variant)
    db.session.flush()

    auto_sku = is_ai_feature_enabled('inventory_auto_sku')
    auto_barcode = is_ai_feature_enabled('inventory_auto_barcode')
    auto_qr = is_ai_feature_enabled('inventory_auto_qr')

    if auto_sku:
        sku = generate_sku(product, variant, get_next_sequence(product, variant))
        while ProductVariant.query.filter(ProductVariant.sku == sku).first():
            sku = generate_sku(product, variant, get_next_sequence(product, variant))
        variant.sku = sku

    if auto_barcode:
        variant.barcode = generate_barcode_value(variant.sku or str(uuid.uuid4().hex[:12].upper()))
        while ProductVariant.query.filter(ProductVariant.barcode == variant.barcode, ProductVariant.id != variant.id).first():
            variant.barcode = generate_barcode_value()

    if auto_qr:
        qr_filename = save_qr_code_file(variant, product, QR_DIR)
        variant.qr_code = qr_filename

    product.sync_stock_from_variants()

    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='create',
        module='products',
        description=f'User {user.username if user else "system"} created variant {variant.sku} for product {product.product_name}'
    )
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='sku_generated',
        module='products',
        description=f'SKU {variant.sku} generated for variant of {product.product_name}'
    )
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='barcode_generated',
        module='products',
        description=f'Barcode {variant.barcode} generated for SKU {variant.sku}'
    )
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='qrcode_generated',
        module='products',
        description=f'QR code generated for SKU {variant.sku}'
    )
    db.session.commit()

    return jsonify({'message': 'Variant created', 'variant': variant.to_dict()}), 201


@product_variants_bp.route('/<int:id>', methods=['PUT'])
@staff_required
def update_variant(id):
    variant = ProductVariant.query.get(id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    changed = []
    sku_regenerated = False
    auto_sku = is_ai_feature_enabled('inventory_auto_sku')
    auto_barcode = is_ai_feature_enabled('inventory_auto_barcode')
    auto_qr = is_ai_feature_enabled('inventory_auto_qr')
    if 'size' in data and data['size'] != variant.size:
        variant.size = data['size']
        changed.append('size')
        sku_regenerated = True
    if 'color' in data and data['color'] != variant.color:
        variant.color = data['color']
        changed.append('color')
        sku_regenerated = True
    if 'stock' in data:
        variant.stock = int(data['stock'])
        changed.append('stock')
    if 'min_stock' in data:
        variant.min_stock = int(data['min_stock'])
        changed.append('min_stock')
    if 'cost_price' in data:
        variant.cost_price = float(data['cost_price'])
        changed.append('cost_price')
    if 'selling_price' in data:
        variant.selling_price = float(data['selling_price'])
        changed.append('selling_price')

    if sku_regenerated:
        if auto_sku:
            new_sku = generate_sku(variant.product, variant, get_next_sequence(variant.product, variant))
            while ProductVariant.query.filter(ProductVariant.sku == new_sku, ProductVariant.id != variant.id).first():
                new_sku = generate_sku(variant.product, variant, get_next_sequence(variant.product, variant))
            variant.sku = new_sku
            changed.append('sku (auto-regenerated)')
        if auto_barcode:
            b = generate_barcode_value(variant.sku or str(uuid.uuid4().hex[:12].upper()))
            while ProductVariant.query.filter(ProductVariant.barcode == b, ProductVariant.id != variant.id).first():
                b = generate_barcode_value()
            variant.barcode = b
            changed.append('barcode (regenerated)')
        if auto_qr:
            qr_filename = save_qr_code_file(variant, variant.product, QR_DIR)
            variant.qr_code = qr_filename
            changed.append('qr_code (regenerated)')

    variant.product.sync_stock_from_variants()

    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='update',
        module='products',
        description=f'User {user.username if user else "system"} updated variant {variant.sku} ({", ".join(changed) if changed else "no changes"})'
    )
    db.session.commit()

    return jsonify({'message': 'Variant updated', 'variant': variant.to_dict()}), 200


@product_variants_bp.route('/<int:id>', methods=['DELETE'])
@staff_required
def delete_variant(id):
    variant = ProductVariant.query.get(id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    sku = variant.sku
    product = variant.product
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='delete',
        module='products',
        description=f'User {user.username if user else "system"} deleted variant {sku}'
    )
    db.session.delete(variant)
    db.session.flush()
    product.sync_stock_from_variants()
    db.session.commit()

    return jsonify({'message': 'Variant deleted'}), 200


@product_variants_bp.route('/<int:id>/barcode', methods=['GET'])
@staff_required
def get_barcode(id):
    variant = ProductVariant.query.get(id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    fmt = request.args.get('format', 'json')
    barcode_value = variant.barcode

    # Generate barcode value on the fly if missing
    if not barcode_value:
        barcode_value = generate_barcode_value(variant.sku if variant.sku else None)
        variant.barcode = barcode_value
        db.session.commit()

    if fmt == 'image':
        try:
            code128 = barcode.get('code128', barcode_value, writer=ImageWriter())
            buf = io.BytesIO()
            code128.write(buf)
            buf.seek(0)
            download = request.args.get('download', 'false').lower() == 'true'
            return send_file(buf, mimetype='image/png',
                             as_attachment=download,
                             download_name=f'barcode_{variant.sku}.png')
        except Exception as e:
            return jsonify({'error': f'Failed to generate barcode image: {str(e)}'}), 500

    return jsonify({
        'variant_id': variant.id,
        'sku': variant.sku,
        'barcode': barcode_value,
        'product': variant.product.product_name if variant.product else None,
        'image_url': f'/api/product-variants/{id}/barcode?format=image'
    }), 200


@product_variants_bp.route('/<int:id>/qrcode', methods=['GET'])
@staff_required
def get_qrcode(id):
    variant = ProductVariant.query.get(id)
    if not variant:
        return jsonify({'error': 'Variant not found'}), 404

    # Generate QR file on the fly if missing
    if not variant.qr_code or not os.path.exists(os.path.join(QR_DIR, variant.qr_code)):
        try:
            product = variant.product
            qr_filename = save_qr_code_file(variant, product, QR_DIR)
            variant.qr_code = qr_filename
            db.session.commit()
        except Exception as e:
            return jsonify({'error': f'Failed to generate QR code image: {str(e)}'}), 500

    filepath = os.path.join(QR_DIR, variant.qr_code)
    if os.path.exists(filepath):
        download = request.args.get('download', 'false').lower() == 'true'
        return send_file(filepath, mimetype='image/png',
                         as_attachment=download,
                         download_name=f'qrcode_{variant.sku}.png')

    return jsonify({'error': 'QR code not found'}), 404
