from flask import Blueprint, request, jsonify
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.inventory_log import InventoryLog
from app.middleware.auth import staff_required, get_current_user
from app.models.audit_log import create_audit_log
from app import db
from datetime import datetime
from sqlalchemy import exists
from app.utils.helpers import parse_date, generate_invoice

sales_bp = Blueprint('sales', __name__)


@sales_bp.route('/', methods=['GET'])
@staff_required
def get_sales():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = Sale.query

    if search:
        variant_match = exists().select_from(
            SaleItem.__table__.join(
                ProductVariant.__table__,
                SaleItem.variant_id == ProductVariant.id
            )
        ).where(
            SaleItem.sale_id == Sale.id,
            db.or_(
                ProductVariant.sku.like(f'%{search}%'),
                ProductVariant.barcode.like(f'%{search}%')
            )
        )
        query = query.filter(
            db.or_(
                Sale.invoice_number.like(f'%{search}%'),
                Sale.customer_name.like(f'%{search}%'),
                db.session.query(SaleItem.id).filter(SaleItem.sale_id == Sale.id, SaleItem.product.has(Product.product_name.like(f'%{search}%'))).exists(),
                variant_match
            )
        )
    if status:
        query = query.filter(Sale.status == status)
    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)
    if start_dt:
        query = query.filter(Sale.sale_date >= start_dt)
    if end_dt:
        query = query.filter(Sale.sale_date <= end_dt)

    sort_column = getattr(Sale, sort_by, Sale.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'sales': [s.to_dict() for s in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200


@sales_bp.route('/<int:id>', methods=['GET'])
@staff_required
def get_sale(id):
    sale = Sale.query.get(id)
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404
    return jsonify({'sale': sale.to_dict()}), 200


@sales_bp.route('/', methods=['POST'])
@staff_required
def create_sale():
    data = request.get_json()
    if not data or not data.get('items'):
        return jsonify({'error': 'Sale items required'}), 400

    user = get_current_user()
    invoice = generate_invoice()

    sale = Sale(
        invoice_number=invoice,
        customer_name=data.get('customer_name', 'Walk-in Customer'),
        user_id=user.id if user else None,
        discount=float(data.get('discount', 0)),
        tax=float(data.get('tax', 0)),
        payment_method=data.get('payment_method', 'cash'),
        status='completed',
        notes=data.get('notes'),
        sale_date=datetime.utcnow()
    )

    total_amount = 0
    errors = []

    for item_data in data['items']:
        product_id = item_data.get('product_id')
        variant_id = item_data.get('variant_id')
        if not product_id:
            errors.append('Each item must specify a product_id')
            continue
        try:
            qty_raw = item_data.get('quantity', 0)
            quantity = int(qty_raw)
        except (ValueError, TypeError):
            errors.append(f'Invalid quantity: {item_data.get("quantity", 0)}')
            continue
        if quantity <= 0:
            errors.append(f'Quantity must be a positive integer')
            continue

        product = Product.query.get(product_id)
        if not product:
            errors.append(f'Product ID {product_id} not found')
            continue

        variant = None
        if variant_id:
            variant = ProductVariant.query.get(variant_id)
            if not variant or variant.product_id != product.id:
                errors.append(f'Variant ID {variant_id} not found for this product')
                continue
            if variant.stock < quantity:
                errors.append(f'Insufficient stock for variant {variant.sku}: available {variant.stock}, requested {quantity}')
                continue
        else:
            if product.quantity < quantity:
                errors.append(f'Insufficient stock for {product.product_name}: available {product.quantity}, requested {quantity}')
                continue

        unit_price = float(item_data.get('unit_price', variant.selling_price if variant else product.price))
        item_discount = float(item_data.get('discount', 0))
        total_price = (quantity * unit_price) - item_discount
        total_amount += total_price

        item = SaleItem(
            sale=sale,
            product_id=product_id,
            variant_id=variant_id,
            quantity=quantity,
            unit_price=unit_price,
            discount=item_discount,
            total_price=total_price
        )
        db.session.add(item)

        if variant:
            variant.stock -= quantity
            product.sync_stock_from_variants()
        else:
            product.quantity -= quantity

        log = InventoryLog(
            product_id=product_id,
            variant_id=variant_id,
            change_type='out',
            quantity=quantity,
            reference_type='sale',
            notes=f'Sale {invoice}',
            user_id=user.id if user else None
        )
        db.session.add(log)

    if errors:
        return jsonify({'error': 'Stock issues', 'details': errors}), 400

    sale.total_amount = total_amount
    sale.grand_total = total_amount + float(data.get('tax', 0)) - float(data.get('discount', 0))
    db.session.add(sale)
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='create',
        module='sales',
        description=f'User {user.username if user else "system"} created sale {invoice}'
    )
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='stock_decrease',
        module='inventory',
        description=f'Sale {invoice} decreased inventory by {sum(int(i.get("quantity", 0)) for i in data["items"])} units'
    )
    db.session.commit()

    return jsonify({'message': 'Sale created', 'sale': sale.to_dict()}), 201


@sales_bp.route('/<int:id>/status', methods=['PUT'])
@staff_required
def update_sale_status(id):
    sale = Sale.query.get(id)
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404

    data = request.get_json()
    if not data or not data.get('status'):
        return jsonify({'error': 'Status required'}), 400

    new_status = data['status']
    old_status = sale.status

    # Restore stock if cancelling a completed sale
    if new_status == 'cancelled' and old_status == 'completed':
        for item in sale.items:
            qty = int(item.quantity)
            if item.variant_id:
                variant = ProductVariant.query.get(item.variant_id)
                if variant:
                    variant.stock += qty
                    Product.query.get(variant.product_id).sync_stock_from_variants()
                    log = InventoryLog(
                        product_id=variant.product_id,
                        variant_id=item.variant_id,
                        change_type='in',
                        quantity=item.quantity,
                        reference_type='sale_cancelled',
                        notes=f'Sale {sale.invoice_number} cancelled',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)
            else:
                product = Product.query.get(item.product_id)
                if product:
                    product.quantity += qty
                    log = InventoryLog(
                        product_id=item.product_id,
                        change_type='in',
                        quantity=item.quantity,
                        reference_type='sale_cancelled',
                        notes=f'Sale {sale.invoice_number} cancelled',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)

    sale.status = new_status
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='update',
        module='sales',
        description=f'User {user.username if user else "system"} updated sale {sale.invoice_number} status to {data["status"]}'
    )
    db.session.commit()
    return jsonify({'message': 'Sale status updated', 'sale': sale.to_dict()}), 200


@sales_bp.route('/<int:id>', methods=['DELETE'])
@staff_required
def delete_sale(id):
    sale = Sale.query.get(id)
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404

    # Restore stock if sale was completed
    if sale.status == 'completed':
        for item in sale.items:
            qty = int(item.quantity)
            if item.variant_id:
                variant = ProductVariant.query.get(item.variant_id)
                if variant:
                    variant.stock += qty
                    Product.query.get(variant.product_id).sync_stock_from_variants()
                    log = InventoryLog(
                        product_id=variant.product_id,
                        variant_id=item.variant_id,
                        change_type='in',
                        quantity=item.quantity,
                        reference_type='sale_deleted',
                        notes=f'Sale {sale.invoice_number} deleted',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)
            else:
                product = Product.query.get(item.product_id)
                if product:
                    product.quantity += qty
                    log = InventoryLog(
                        product_id=item.product_id,
                        change_type='in',
                        quantity=item.quantity,
                        reference_type='sale_deleted',
                        notes=f'Sale {sale.invoice_number} deleted',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)

    invoice = sale.invoice_number
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='delete',
        module='sales',
        description=f'User {user.username if user else "system"} deleted sale {invoice}'
    )
    db.session.delete(sale)
    db.session.commit()
    return jsonify({'message': 'Sale deleted'}), 200
