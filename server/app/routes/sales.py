from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.inventory_log import InventoryLog
from app.middleware.auth import get_current_user
from app import db
from datetime import datetime
import uuid

sales_bp = Blueprint('sales', __name__)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None

def generate_invoice():
    return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

@sales_bp.route('/', methods=['GET'])
@jwt_required()
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
        query = query.filter(
            db.or_(
                Sale.invoice_number.like(f'%{search}%'),
                Sale.customer_name.like(f'%{search}%')
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
@jwt_required()
def get_sale(id):
    sale = Sale.query.get(id)
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404
    return jsonify({'sale': sale.to_dict()}), 200

@sales_bp.route('/', methods=['POST'])
@jwt_required()
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
        quantity = int(item_data.get('quantity', 0))

        product = Product.query.get(product_id)
        if not product:
            errors.append(f'Product ID {product_id} not found')
            continue
        if product.quantity < quantity:
            errors.append(f'Insufficient stock for {product.product_name}: available {product.quantity}, requested {quantity}')
            continue

        unit_price = float(item_data.get('unit_price', product.price))
        item_discount = float(item_data.get('discount', 0))
        total_price = (quantity * unit_price) - item_discount
        total_amount += total_price

        item = SaleItem(
            sale=sale,
            product_id=product_id,
            quantity=quantity,
            unit_price=unit_price,
            discount=item_discount,
            total_price=total_price
        )
        db.session.add(item)

        product.quantity -= quantity
        log = InventoryLog(
            product_id=product_id,
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
    db.session.commit()

    return jsonify({'message': 'Sale created', 'sale': sale.to_dict()}), 201

@sales_bp.route('/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_sale_status(id):
    sale = Sale.query.get(id)
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404

    data = request.get_json()
    if not data or not data.get('status'):
        return jsonify({'error': 'Status required'}), 400

    sale.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Sale status updated', 'sale': sale.to_dict()}), 200

@sales_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_sale(id):
    sale = Sale.query.get(id)
    if not sale:
        return jsonify({'error': 'Sale not found'}), 404
    db.session.delete(sale)
    db.session.commit()
    return jsonify({'message': 'Sale deleted'}), 200
