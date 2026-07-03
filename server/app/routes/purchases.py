from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.purchase import Purchase, PurchaseItem
from app.models.raw_material import RawMaterial
from app.models.inventory_log import InventoryLog
from app.middleware.auth import get_current_user
from app import db
from datetime import datetime
import uuid

purchases_bp = Blueprint('purchases', __name__)

def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None

def generate_invoice():
    return f"PUR-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

@purchases_bp.route('/', methods=['GET'])
@jwt_required()
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
        query = query.filter(
            db.or_(
                Purchase.invoice_number.like(f'%{search}%'),
                Purchase.supplier.has(supplier_name=search)
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
@jwt_required()
def get_purchase(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404
    return jsonify({'purchase': purchase.to_dict()}), 200

@purchases_bp.route('/', methods=['POST'])
@jwt_required()
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

    total_amount = 0
    for item_data in data['items']:
        material_id = item_data.get('material_id')
        quantity = float(item_data.get('quantity', 0))
        unit_price = float(item_data.get('unit_price', 0))
        total_price = quantity * unit_price
        total_amount += total_price

        item = PurchaseItem(
            purchase=purchase,
            material_id=material_id,
            quantity=quantity,
            unit_price=unit_price,
            total_price=total_price
        )
        db.session.add(item)

        if material_id:
            material = RawMaterial.query.get(material_id)
            if material:
                material.quantity += quantity
                log = InventoryLog(
                    material_id=material_id,
                    change_type='in',
                    quantity=quantity,
                    reference_type='purchase',
                    notes=f'Purchase {invoice}',
                    user_id=user.id if user else None
                )
                db.session.add(log)

    purchase.total_amount = total_amount
    purchase.grand_total = total_amount + float(data.get('tax', 0)) - float(data.get('discount', 0))
    db.session.add(purchase)
    db.session.commit()

    return jsonify({'message': 'Purchase created', 'purchase': purchase.to_dict()}), 201

@purchases_bp.route('/<int:id>/status', methods=['PUT'])
@jwt_required()
def update_purchase_status(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404

    data = request.get_json()
    if not data or not data.get('status'):
        return jsonify({'error': 'Status required'}), 400

    purchase.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Purchase status updated', 'purchase': purchase.to_dict()}), 200

@purchases_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_purchase(id):
    purchase = Purchase.query.get(id)
    if not purchase:
        return jsonify({'error': 'Purchase not found'}), 404
    db.session.delete(purchase)
    db.session.commit()
    return jsonify({'message': 'Purchase deleted'}), 200
