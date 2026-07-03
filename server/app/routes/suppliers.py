from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.supplier import Supplier
from app.middleware.auth import admin_required
from app import db

suppliers_bp = Blueprint('suppliers', __name__)

@suppliers_bp.route('/', methods=['GET'])
@jwt_required()
def get_suppliers():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = Supplier.query

    if search:
        query = query.filter(Supplier.supplier_name.like(f'%{search}%'))
    if status:
        query = query.filter(Supplier.status == status)

    sort_column = getattr(Supplier, sort_by, Supplier.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'suppliers': [s.to_dict() for s in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@suppliers_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_suppliers():
    suppliers = Supplier.query.filter_by(status='active').all()
    return jsonify({'suppliers': [s.to_dict() for s in suppliers]}), 200

@suppliers_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404
    return jsonify({'supplier': supplier.to_dict()}), 200

@suppliers_bp.route('/', methods=['POST'])
@jwt_required()
def create_supplier():
    data = request.get_json()
    if not data or not data.get('supplier_name'):
        return jsonify({'error': 'Supplier name required'}), 400

    supplier = Supplier(
        supplier_name=data['supplier_name'],
        contact_person=data.get('contact_person'),
        phone=data.get('phone'),
        email=data.get('email'),
        address=data.get('address'),
        gst_number=data.get('gst_number'),
        status=data.get('status', 'active')
    )
    db.session.add(supplier)
    db.session.commit()
    return jsonify({'message': 'Supplier created', 'supplier': supplier.to_dict()}), 201

@suppliers_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404

    data = request.get_json()
    if data.get('supplier_name'):
        supplier.supplier_name = data['supplier_name']
    if data.get('contact_person') is not None:
        supplier.contact_person = data['contact_person']
    if data.get('phone') is not None:
        supplier.phone = data['phone']
    if data.get('email') is not None:
        supplier.email = data['email']
    if data.get('address') is not None:
        supplier.address = data['address']
    if data.get('gst_number') is not None:
        supplier.gst_number = data['gst_number']
    if data.get('status'):
        supplier.status = data['status']

    db.session.commit()
    return jsonify({'message': 'Supplier updated', 'supplier': supplier.to_dict()}), 200

@suppliers_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({'message': 'Supplier deleted'}), 200
