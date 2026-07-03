from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.product import Product
from app.models.inventory_log import InventoryLog
from app.middleware.auth import get_current_user
from app import db
import os
import uuid
from werkzeug.utils import secure_filename

products_bp = Blueprint('products', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@products_bp.route('/', methods=['GET'])
@jwt_required()
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    category_id = request.args.get('category_id', type=int)
    status = request.args.get('status', '')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = Product.query

    if search:
        query = query.filter(Product.product_name.like(f'%{search}%'))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if status:
        query = query.filter(Product.status == status)

    sort_column = getattr(Product, sort_by, Product.created_at)
    if sort_order == 'asc':
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page,
        'per_page': per_page
    }), 200

@products_bp.route('/all', methods=['GET'])
@jwt_required()
def get_all_products():
    products = Product.query.filter_by(status='active').all()
    return jsonify({'products': [p.to_dict() for p in products]}), 200

@products_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    return jsonify({'product': product.to_dict()}), 200

@products_bp.route('/', methods=['POST'])
@jwt_required()
def create_product():
    data = request.form.to_dict() if request.form else request.get_json()

    if not data or not data.get('product_name'):
        return jsonify({'error': 'Product name required'}), 400

    if not data.get('price'):
        return jsonify({'error': 'Price required'}), 400

    cat_id = data.get('category_id')
    product = Product(
        product_name=data['product_name'],
        category_id=int(cat_id) if cat_id else None,
        size=data.get('size'),
        color=data.get('color'),
        price=float(data.get('price', 0)),
        quantity=int(data.get('quantity', 0)),
        min_stock=int(data.get('min_stock', 10)),
        barcode=data.get('barcode', f'SIMS{uuid.uuid4().hex[:8].upper()}'),
        status=data.get('status', 'active'),
        description=data.get('description')
    )

    if request.files and request.files.get('image'):
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '..', 'uploads', 'products')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            product.image = filename

    db.session.add(product)
    db.session.commit()

    return jsonify({'message': 'Product created', 'product': product.to_dict()}), 201

@products_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.form.to_dict() if request.form else request.get_json()

    if data.get('product_name'):
        product.product_name = data['product_name']
    if data.get('category_id') is not None:
        product.category_id = int(data['category_id'])
    if data.get('size'):
        product.size = data['size']
    if data.get('color'):
        product.color = data['color']
    if data.get('price'):
        product.price = float(data['price'])
    if data.get('quantity') is not None:
        product.quantity = int(data['quantity'])
    if data.get('min_stock') is not None:
        product.min_stock = int(data['min_stock'])
    if data.get('barcode'):
        product.barcode = data['barcode']
    if data.get('status'):
        product.status = data['status']
    if data.get('description') is not None:
        product.description = data['description']

    if request.files and request.files.get('image'):
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '..', 'uploads', 'products')
            os.makedirs(upload_dir, exist_ok=True)
            file.save(os.path.join(upload_dir, filename))
            product.image = filename

    db.session.commit()
    return jsonify({'message': 'Product updated', 'product': product.to_dict()}), 200

@products_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Product deleted'}), 200

@products_bp.route('/<int:id>/adjust-stock', methods=['PUT'])
@jwt_required()
def adjust_stock(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'error': 'Product not found'}), 404

    data = request.get_json()
    if not data or data.get('quantity') is None:
        return jsonify({'error': 'Quantity required'}), 400

    old_qty = product.quantity
    product.quantity = int(data['quantity'])
    db.session.commit()

    user = get_current_user()
    log = InventoryLog(
        product_id=product.id,
        change_type='adjustment',
        quantity=product.quantity - old_qty,
        reference_type='manual',
        notes=data.get('notes', 'Stock adjustment'),
        user_id=user.id if user else None
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({'message': 'Stock adjusted', 'product': product.to_dict()}), 200

@products_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def low_stock_products():
    products = Product.query.filter(Product.quantity <= Product.min_stock, Product.status == 'active').all()
    return jsonify({'products': [p.to_dict() for p in products]}), 200
