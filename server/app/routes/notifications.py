from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.notification import Notification
from app.models.product import Product
from app import db

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter(
        db.or_(Notification.user_id == int(user_id), Notification.user_id.is_(None))
    ).order_by(Notification.created_at.desc()).limit(20).all()
    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = get_jwt_identity()
    count = Notification.query.filter(
        db.or_(Notification.user_id == int(user_id), Notification.user_id.is_(None)),
        Notification.is_read == False
    ).count()
    return jsonify({'count': count}), 200

@notifications_bp.route('/<int:id>/read', methods=['PUT'])
@jwt_required()
def mark_read(id):
    notification = Notification.query.get(id)
    if notification:
        notification.is_read = True
        db.session.commit()
    return jsonify({'message': 'Marked as read'}), 200

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    user_id = get_jwt_identity()
    Notification.query.filter(
        db.or_(Notification.user_id == int(user_id), Notification.user_id.is_(None)),
        Notification.is_read == False
    ).update({'is_read': True})
    db.session.commit()
    return jsonify({'message': 'All marked as read'}), 200

@notifications_bp.route('/generate-alerts', methods=['POST'])
@jwt_required()
def generate_alerts():
    low_stock_products = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.quantity > 0,
        Product.status == 'active'
    ).all()

    out_of_stock_products = Product.query.filter(
        Product.quantity == 0,
        Product.status == 'active'
    ).all()

    for p in low_stock_products:
        existing = Notification.query.filter(
            Notification.title.like(f'%{p.product_name}%'),
            Notification.type == 'warning',
            Notification.is_read == False
        ).first()
        if not existing:
            notif = Notification(
                title=f'Low Stock: {p.product_name}',
                message=f'Only {p.quantity} units left. Minimum stock is {p.min_stock}.',
                type='warning',
                link=f'/products/{p.id}'
            )
            db.session.add(notif)

    for p in out_of_stock_products:
        existing = Notification.query.filter(
            Notification.title.like(f'%{p.product_name}%'),
            Notification.type == 'danger',
            Notification.is_read == False
        ).first()
        if not existing:
            notif = Notification(
                title=f'Out of Stock: {p.product_name}',
                message=f'{p.product_name} is out of stock.',
                type='danger',
                link=f'/products/{p.id}'
            )
            db.session.add(notif)

    db.session.commit()
    return jsonify({'message': 'Alerts generated'}), 200
