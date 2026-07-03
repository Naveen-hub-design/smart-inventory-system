from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.product import Product
from app.models.raw_material import RawMaterial
from app.models.inventory_log import InventoryLog
from app.middleware.auth import get_current_user
from app import db
from datetime import datetime, timedelta

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/stock', methods=['GET'])
@jwt_required()
def get_current_stock():
    products = Product.query.filter_by(status='active').all()
    materials = RawMaterial.query.all()

    return jsonify({
        'products': [{
            'id': p.id,
            'name': p.product_name,
            'category': p.category.name if p.category else None,
            'quantity': p.quantity,
            'min_stock': p.min_stock,
            'status': 'low' if p.quantity <= p.min_stock else 'out' if p.quantity == 0 else 'in_stock'
        } for p in products],
        'materials': [{
            'id': m.id,
            'name': m.material_name,
            'unit': m.unit,
            'quantity': float(m.quantity),
            'min_stock': float(m.min_stock),
            'status': 'low' if float(m.quantity) <= float(m.min_stock) else 'out' if float(m.quantity) == 0 else 'in_stock'
        } for m in materials]
    }), 200

@inventory_bp.route('/movements', methods=['GET'])
@jwt_required()
def get_stock_movements():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    change_type = request.args.get('change_type', '')
    days = request.args.get('days', 30, type=int)

    query = InventoryLog.query
    if change_type:
        query = query.filter(InventoryLog.change_type == change_type)

    cutoff = datetime.utcnow() - timedelta(days=days)
    query = query.filter(InventoryLog.created_at >= cutoff)

    query = query.order_by(InventoryLog.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'movements': [m.to_dict() for m in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@inventory_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock():
    low_products = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.quantity > 0,
        Product.status == 'active'
    ).all()

    out_products = Product.query.filter(
        Product.quantity == 0,
        Product.status == 'active'
    ).all()

    low_materials = RawMaterial.query.filter(
        RawMaterial.quantity <= RawMaterial.min_stock,
        RawMaterial.quantity > 0
    ).all()

    out_materials = RawMaterial.query.filter(
        RawMaterial.quantity == 0
    ).all()

    return jsonify({
        'low_stock_products': [p.to_dict() for p in low_products],
        'out_of_stock_products': [p.to_dict() for p in out_products],
        'low_stock_materials': [m.to_dict() for m in low_materials],
        'out_of_stock_materials': [m.to_dict() for m in out_materials]
    }), 200

@inventory_bp.route('/adjust', methods=['POST'])
@jwt_required()
def adjust_inventory():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Data required'}), 400

    user = get_current_user()
    item_type = data.get('type')  # 'product' or 'material'
    item_id = data.get('item_id')
    quantity = float(data.get('quantity', 0))
    notes = data.get('notes', '')

    if item_type == 'product':
        item = Product.query.get(item_id)
        if not item:
            return jsonify({'error': 'Product not found'}), 404
        item.quantity = quantity
    elif item_type == 'material':
        item = RawMaterial.query.get(item_id)
        if not item:
            return jsonify({'error': 'Material not found'}), 404
        item.quantity = quantity
    else:
        return jsonify({'error': 'Invalid type. Use product or material'}), 400

    log = InventoryLog(
        product_id=item_id if item_type == 'product' else None,
        material_id=item_id if item_type == 'material' else None,
        change_type='adjustment',
        quantity=quantity,
        reference_type='manual',
        notes=notes or 'Manual adjustment',
        user_id=user.id if user else None
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Inventory adjusted'}), 200

@inventory_bp.route('/timeline', methods=['GET'])
@jwt_required()
def get_timeline():
    days = request.args.get('days', 7, type=int)
    cutoff = datetime.utcnow() - timedelta(days=days)

    logs = InventoryLog.query.filter(
        InventoryLog.created_at >= cutoff
    ).order_by(InventoryLog.created_at.desc()).limit(50).all()

    return jsonify({'timeline': [l.to_dict() for l in logs]}), 200
