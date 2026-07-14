from flask import Blueprint, request, jsonify
from app.models.supplier import Supplier
from app.middleware.auth import staff_required, admin_required, get_current_user
from app.models.audit_log import create_audit_log
from app import db

suppliers_bp = Blueprint('suppliers', __name__)


@suppliers_bp.route('/', methods=['GET'])
@staff_required
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
@staff_required
def get_all_suppliers():
    suppliers = Supplier.query.filter_by(status='active').all()
    return jsonify({'suppliers': [s.to_dict() for s in suppliers]}), 200


@suppliers_bp.route('/<int:id>', methods=['GET'])
@staff_required
def get_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404
    return jsonify({'supplier': supplier.to_dict()}), 200


@suppliers_bp.route('/', methods=['POST'])
@staff_required
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
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='create',
        module='suppliers',
        description=f'User {user.username if user else "system"} created supplier {data["supplier_name"]}'
    )
    db.session.commit()
    return jsonify({'message': 'Supplier created', 'supplier': supplier.to_dict()}), 201


@suppliers_bp.route('/<int:id>', methods=['PUT'])
@staff_required
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

    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='update',
        module='suppliers',
        description=f'User {user.username if user else "system"} updated supplier {supplier.supplier_name}'
    )
    db.session.commit()
    return jsonify({'message': 'Supplier updated', 'supplier': supplier.to_dict()}), 200


@suppliers_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_supplier(id):
    supplier = Supplier.query.get(id)
    if not supplier:
        return jsonify({'error': 'Supplier not found'}), 404

    name = supplier.supplier_name
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='delete',
        module='suppliers',
        description=f'User {user.username if user else "system"} deleted supplier {name}'
    )
    db.session.delete(supplier)
    db.session.commit()
    return jsonify({'message': 'Supplier deleted'}), 200
