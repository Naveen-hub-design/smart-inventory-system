from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.raw_material import RawMaterial
from app import db

materials_bp = Blueprint('materials', __name__)

@materials_bp.route('/', methods=['GET'])
@jwt_required()
def get_materials():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    supplier_id = request.args.get('supplier_id', type=int)
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = RawMaterial.query

    if search:
        query = query.filter(RawMaterial.material_name.like(f'%{search}%'))
    if supplier_id:
        query = query.filter(RawMaterial.supplier_id == supplier_id)

    sort_column = getattr(RawMaterial, sort_by, RawMaterial.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'materials': [m.to_dict() for m in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@materials_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_materials():
    materials = RawMaterial.query.all()
    return jsonify({'materials': [m.to_dict() for m in materials]}), 200

@materials_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    return jsonify({'material': material.to_dict()}), 200

@materials_bp.route('/', methods=['POST'])
@jwt_required()
def create_material():
    data = request.get_json()
    if not data or not data.get('material_name'):
        return jsonify({'error': 'Material name required'}), 400

    sup_id = data.get('supplier_id')
    material = RawMaterial(
        material_name=data['material_name'],
        unit=data.get('unit', 'Pieces'),
        supplier_id=int(sup_id) if sup_id else None,
        quantity=float(data.get('quantity', 0)),
        min_stock=float(data.get('min_stock', 10)),
        cost=float(data.get('cost', 0)),
        description=data.get('description')
    )
    db.session.add(material)
    db.session.commit()
    return jsonify({'message': 'Material created', 'material': material.to_dict()}), 201

@materials_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404

    data = request.get_json()
    if data.get('material_name'):
        material.material_name = data['material_name']
    if data.get('unit'):
        material.unit = data['unit']
    if data.get('supplier_id') is not None:
        material.supplier_id = int(data['supplier_id'])
    if data.get('quantity') is not None:
        material.quantity = float(data['quantity'])
    if data.get('min_stock') is not None:
        material.min_stock = float(data['min_stock'])
    if data.get('cost') is not None:
        material.cost = float(data['cost'])
    if data.get('description') is not None:
        material.description = data['description']

    db.session.commit()
    return jsonify({'message': 'Material updated', 'material': material.to_dict()}), 200

@materials_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_material(id):
    material = RawMaterial.query.get(id)
    if not material:
        return jsonify({'error': 'Material not found'}), 404
    db.session.delete(material)
    db.session.commit()
    return jsonify({'message': 'Material deleted'}), 200

@materials_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def low_stock_materials():
    materials = RawMaterial.query.filter(RawMaterial.quantity <= RawMaterial.min_stock).all()
    return jsonify({'materials': [m.to_dict() for m in materials]}), 200
