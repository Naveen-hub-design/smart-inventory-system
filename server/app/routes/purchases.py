from flask import Blueprint, request, jsonify
from app.models.purchase import Purchase, PurchaseItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.raw_material import RawMaterial
from app.models.supplier import Supplier
from app.models.inventory_log import InventoryLog
from app.middleware.auth import staff_required, get_current_user
from app.models.audit_log import create_audit_log
from app import db
from datetime import datetime
from decimal import Decimal
from sqlalchemy import exists
from app.utils.helpers import parse_date, generate_invoice

purchases_bp = Blueprint('purchases', __name__)


@purchases_bp.route('/', methods=['GET'])
@staff_required
def get_purchases():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    supplier_id = request.args.get('supplier_id', type=int)
    status = request.args.get('status', '')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = Purchase.query

    if search:
        variant_match = exists().select_from(
            PurchaseItem.__table__.join(
                ProductVariant.__table__,
                PurchaseItem.variant_id == ProductVariant.id
            )
        ).where(
            PurchaseItem.purchase_id == Purchase.id,
            db.or_(
                ProductVariant.sku.like(f'%{search}%'),
                ProductVariant.barcode.like(f'%{search}%')
            )
        )
        query = query.filter(
            db.or_(
                Purchase.invoice_number.like(f'%{search}%'),
                Purchase.supplier.has(db.or_(
                    Supplier.supplier_name.like(f'%{search}%')
                )),
                variant_match
            )
        )
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    if status:
        query = query.filter(Purchase.status == status)
    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)
    if start_dt:
        query = query.filter(Purchase.purchase_date >= start_dt)
    if end_dt:
        query = query.filter(Purchase.purchase_date <= end_dt)

    sort_column = getattr(Purchase, sort_by, Purchase.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'purchases': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200


@purchases_bp.route('/<int:id>', methods=['GET'])
@staff_required
def get_purchase(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404
    return jsonify({'purchase': purchase.to_dict()}), 200


@purchases_bp.route('/', methods=['POST'])
@staff_required
def create_purchase():
    data = request.get_json()
    if not data or not data.get('items'):
        return jsonify({'error': 'Purchase items required'}), 400

    user = get_current_user()
    invoice = generate_invoice()

    sup_id = data.get('supplier_id')
    purchase = Purchase(
        invoice_number=invoice,
        supplier_id=int(sup_id) if sup_id else None,
        user_id=user.id if user else None,
        discount=float(data.get('discount', 0)),
        tax=float(data.get('tax', 0)),
        status='completed',
        notes=data.get('notes'),
        purchase_date=datetime.utcnow()
    )

    import math
    total_amount = Decimal('0')
    for item_data in data['items']:
        material_id = item_data.get('material_id')
        variant_id = item_data.get('variant_id')
        if not material_id and not variant_id:
            return jsonify({'error': 'Each item must specify material_id or variant_id'}), 400
        qty_raw = item_data.get('quantity', 0)
        try:
            qty_val = float(qty_raw)
        except (ValueError, TypeError):
            return jsonify({'error': f'Invalid quantity value: {qty_raw}'}), 400
        if math.isnan(qty_val) or math.isinf(qty_val) or qty_val <= 0:
            return jsonify({'error': 'quantity must be a positive finite number'}), 400
        unit_price_raw = item_data.get('unit_price', 0)
        try:
            unit_price = Decimal(str(unit_price_raw))
        except Exception:
            return jsonify({'error': f'Invalid unit_price value: {unit_price_raw}'}), 400
        qty_decimal = Decimal(str(qty_val))
        qty_int = int(qty_val)
        total_price = qty_decimal * unit_price
        total_amount += total_price

        item = PurchaseItem(
            purchase=purchase,
            material_id=material_id,
            variant_id=variant_id,
            quantity=qty_decimal,
            unit_price=unit_price,
            total_price=total_price
        )
        db.session.add(item)

        if variant_id:
            variant = ProductVariant.query.get(variant_id)
            if variant:
                variant.stock += qty_int
                Product.query.get(variant.product_id).sync_stock_from_variants()
                log = InventoryLog(
                    product_id=variant.product_id,
                    variant_id=variant_id,
                    change_type='in',
                    quantity=qty_decimal,
                    reference_type='purchase',
                    notes=f'Purchase {invoice}',
                    user_id=user.id if user else None
                )
                db.session.add(log)
        elif material_id:
            material = RawMaterial.query.get(material_id)
            if material:
                material.quantity += qty_decimal
                log = InventoryLog(
                    material_id=material_id,
                    change_type='in',
                    quantity=qty_decimal,
                    reference_type='purchase',
                    notes=f'Purchase {invoice}',
                    user_id=user.id if user else None
                )
                db.session.add(log)

    purchase.total_amount = float(total_amount)
    purchase.grand_total = float(total_amount) + float(data.get('tax', 0)) - float(data.get('discount', 0))
    db.session.add(purchase)
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='create',
        module='purchases',
        description=f'User {user.username if user else "system"} created purchase {invoice}'
    )
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='stock_increase',
        module='inventory',
        description=f'Purchase {invoice} increased inventory by {sum(float(i.get("quantity", 0)) for i in data["items"])} units'
    )
    db.session.commit()

    return jsonify({'message': 'Purchase created', 'purchase': purchase.to_dict()}), 201


@purchases_bp.route('/<int:id>/status', methods=['PUT'])
@staff_required
def update_purchase_status(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404

    data = request.get_json()
    if not data or not data.get('status'):
        return jsonify({'error': 'Status required'}), 400

    new_status = data['status']
    old_status = purchase.status

    # Reverse stock if cancelling a completed purchase
    if new_status == 'cancelled' and old_status == 'completed':
        for item in purchase.items:
            qty_int = int(item.quantity)
            if item.variant_id:
                variant = ProductVariant.query.get(item.variant_id)
                if variant:
                    variant.stock -= qty_int
                    Product.query.get(variant.product_id).sync_stock_from_variants()
                    log = InventoryLog(
                        product_id=variant.product_id,
                        variant_id=item.variant_id,
                        change_type='out',
                        quantity=item.quantity,
                        reference_type='purchase_cancelled',
                        notes=f'Purchase {purchase.invoice_number} cancelled',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)
            elif item.material_id:
                material = RawMaterial.query.get(item.material_id)
                if material:
                    material.quantity -= item.quantity
                    log = InventoryLog(
                        material_id=item.material_id,
                        change_type='out',
                        quantity=item.quantity,
                        reference_type='purchase_cancelled',
                        notes=f'Purchase {purchase.invoice_number} cancelled',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)

    purchase.status = new_status
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='update',
        module='purchases',
        description=f'User {user.username if user else "system"} updated purchase {purchase.invoice_number} status to {data["status"]}'
    )
    db.session.commit()
    return jsonify({'message': 'Purchase status updated', 'purchase': purchase.to_dict()}), 200


@purchases_bp.route('/<int:id>', methods=['PUT'])
@staff_required
def update_purchase(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404

    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    user = get_current_user()

    if 'supplier_id' in data:
        purchase.supplier_id = int(data['supplier_id']) if data['supplier_id'] else None
    if 'discount' in data:
        purchase.discount = float(data['discount'])
    if 'tax' in data:
        purchase.tax = float(data['tax'])
    if 'notes' in data:
        purchase.notes = data.get('notes')
    if 'purchase_date' in data:
        purchase.purchase_date = parse_date(data['purchase_date'])

    if 'items' in data and data['items']:
        for old_item in purchase.items:
            db.session.delete(old_item)

        total_amount = Decimal('0')
        for item_data in data['items']:
            material_id = item_data.get('material_id')
            variant_id = item_data.get('variant_id')
            qty_val = item_data.get('quantity', 0)
            unit_price = Decimal(str(item_data.get('unit_price', 0)))
            qty_decimal = Decimal(str(qty_val))
            total_price = qty_decimal * unit_price
            total_amount += total_price

            item = PurchaseItem(
                purchase=purchase,
                material_id=material_id,
                variant_id=variant_id,
                quantity=qty_decimal,
                unit_price=unit_price,
                total_price=total_price
            )
            db.session.add(item)

        purchase.total_amount = float(total_amount)
        purchase.grand_total = float(total_amount) + float(data.get('tax', purchase.tax)) - float(data.get('discount', purchase.discount))

    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='update',
        module='purchases',
        description=f'User {user.username if user else "system"} updated purchase {purchase.invoice_number}'
    )
    db.session.commit()
    return jsonify({'message': 'Purchase updated', 'purchase': purchase.to_dict()}), 200


@purchases_bp.route('/<int:id>', methods=['DELETE'])
@staff_required
def delete_purchase(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404

    # Reverse stock if purchase was completed
    if purchase.status == 'completed':
        for item in purchase.items:
            qty_int = int(item.quantity)
            if item.variant_id:
                variant = ProductVariant.query.get(item.variant_id)
                if variant:
                    variant.stock -= qty_int
                    Product.query.get(variant.product_id).sync_stock_from_variants()
                    log = InventoryLog(
                        product_id=variant.product_id,
                        variant_id=item.variant_id,
                        change_type='out',
                        quantity=item.quantity,
                        reference_type='purchase_deleted',
                        notes=f'Purchase {purchase.invoice_number} deleted',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)
            elif item.material_id:
                material = RawMaterial.query.get(item.material_id)
                if material:
                    material.quantity -= item.quantity
                    log = InventoryLog(
                        material_id=item.material_id,
                        change_type='out',
                        quantity=item.quantity,
                        reference_type='purchase_deleted',
                        notes=f'Purchase {purchase.invoice_number} deleted',
                        user_id=get_current_user().id if get_current_user() else None
                    )
                    db.session.add(log)

    invoice = purchase.invoice_number
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='delete',
        module='purchases',
        description=f'User {user.username if user else "system"} deleted purchase {invoice}'
    )
    db.session.delete(purchase)
    db.session.commit()
    return jsonify({'message': 'Purchase deleted'}), 200
