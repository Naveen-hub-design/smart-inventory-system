from flask import Blueprint, request, jsonify
from app.models.category import Category
from app.models.product import Product
from app.middleware.auth import staff_required, admin_required, get_current_user
from app.models.audit_log import create_audit_log
from app import db

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['GET'])
@staff_required
def get_categories():
    categories = Category.query.all()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200

@categories_bp.route('/<int:id>', methods=['GET'])
@staff_required
def get_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify({'category': category.to_dict()}), 200

@categories_bp.route('/', methods=['POST'])
@admin_required
def create_category():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Category name required'}), 400

    if Category.query.filter_by(name=data['name']).first():
        return jsonify({'error': 'Category already exists'}), 409

    category = Category(
        name=data['name'],
        description=data.get('description', '')
    )
    db.session.add(category)
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='create',
        module='categories',
        description=f'User {user.username if user else "system"} created category {data["name"]}'
    )
    db.session.commit()
    return jsonify({'message': 'Category created', 'category': category.to_dict()}), 201

@categories_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def update_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json()
    if data.get('name') is not None:
        category.name = data['name']
    if data.get('description') is not None:
        category.description = data['description']

    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='update',
        module='categories',
        description=f'User {user.username if user else "system"} updated category {category.name}'
    )
    db.session.commit()
    return jsonify({'message': 'Category updated', 'category': category.to_dict()}), 200

@categories_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def delete_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    if Product.query.filter_by(category_id=id).first():
        return jsonify({'error': 'Cannot delete category with associated products. Reassign products first.'}), 400
    name = category.name
    user = get_current_user()
    create_audit_log(
        username=user.username if user else 'system',
        role=user.role if user else 'system',
        action='delete',
        module='categories',
        description=f'User {user.username if user else "system"} deleted category {name}'
    )
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted'}), 200
