from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.category import Category
from app.middleware.auth import admin_required
from app import db

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['GET'])
@jwt_required()
def get_categories():
    categories = Category.query.all()
    return jsonify({'categories': [c.to_dict() for c in categories]}), 200

@categories_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    return jsonify({'category': category.to_dict()}), 200

@categories_bp.route('/', methods=['POST'])
@jwt_required()
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
    db.session.commit()
    return jsonify({'message': 'Category created', 'category': category.to_dict()}), 201

@categories_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def update_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404

    data = request.get_json()
    if data.get('name'):
        category.name = data['name']
    if data.get('description') is not None:
        category.description = data['description']

    db.session.commit()
    return jsonify({'message': 'Category updated', 'category': category.to_dict()}), 200

@categories_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_category(id):
    category = Category.query.get(id)
    if not category:
        return jsonify({'error': 'Category not found'}), 404
    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Category deleted'}), 200
