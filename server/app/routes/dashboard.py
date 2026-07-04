from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.product import Product
from app.models.raw_material import RawMaterial
from app.models.supplier import Supplier
from app.models.purchase import Purchase
from app.models.sale import Sale, SaleItem
from app.models.notification import Notification
from app.models.category import Category
from app import db
from datetime import datetime
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_stats():
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    total_products = Product.query.filter_by(status='active').count()
    total_materials = RawMaterial.query.count()
    total_suppliers = Supplier.query.filter_by(status='active').count()
    total_purchases = Purchase.query.count()

    today_sales = db.session.query(func.coalesce(func.sum(Sale.grand_total), 0)).filter(
        Sale.created_at >= today_start
    ).scalar()

    total_sales = db.session.query(func.coalesce(func.sum(Sale.grand_total), 0)).scalar()

    total_purchase_amount = db.session.query(func.coalesce(func.sum(Purchase.grand_total), 0)).scalar()

    low_stock_count = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.status == 'active'
    ).count()

    out_of_stock_count = Product.query.filter(
        Product.quantity == 0,
        Product.status == 'active'
    ).count()

    return jsonify({
        'total_products': total_products,
        'total_materials': total_materials,
        'total_suppliers': total_suppliers,
        'total_purchases': total_purchases,
        'total_sales': float(total_sales),
        'today_sales': float(today_sales),
        'total_purchase_amount': float(total_purchase_amount),
        'low_stock_count': low_stock_count,
        'out_of_stock_count': out_of_stock_count
    }), 200

@dashboard_bp.route('/recent-transactions', methods=['GET'])
@jwt_required()
def get_recent_transactions():
    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
    recent_purchases = Purchase.query.order_by(Purchase.created_at.desc()).limit(5).all()

    transactions = []
    for s in recent_sales:
        transactions.append({
            'type': 'sale',
            'id': s.id,
            'invoice': s.invoice_number,
            'customer': s.customer_name,
            'amount': float(s.grand_total),
            'date': s.created_at.isoformat() if s.created_at else None,
            'status': s.status
        })
    for p in recent_purchases:
        transactions.append({
            'type': 'purchase',
            'id': p.id,
            'invoice': p.invoice_number,
            'supplier': p.supplier.supplier_name if p.supplier else None,
            'amount': float(p.grand_total),
            'date': p.created_at.isoformat() if p.created_at else None,
            'status': p.status
        })

    transactions.sort(key=lambda x: x['date'], reverse=True)
    return jsonify({'transactions': transactions[:10]}), 200

@dashboard_bp.route('/stock-by-category', methods=['GET'])
@jwt_required()
def get_stock_by_category():
    results = db.session.query(
        Product.category_id,
        func.sum(Product.quantity).label('total_quantity')
    ).filter(Product.status == 'active').group_by(Product.category_id).all()

    data = []
    for r in results:
        category = Category.query.get(r.category_id) if r.category_id else None
        data.append({
            'name': category.name if category else 'Uncategorized',
            'quantity': int(r.total_quantity) if r.total_quantity else 0
        })

    return jsonify({'data': data}), 200

@dashboard_bp.route('/monthly-sales', methods=['GET'])
@jwt_required()
def get_monthly_sales():
    year = datetime.utcnow().year
    results = db.session.query(
        func.extract('month', Sale.created_at).label('month'),
        func.coalesce(func.sum(Sale.grand_total), 0).label('total')
    ).filter(
        func.extract('year', Sale.created_at) == year,
        Sale.status == 'completed'
    ).group_by(func.extract('month', Sale.created_at)).order_by(func.extract('month', Sale.created_at)).all()

    monthly_data = [{'month': i, 'total': 0} for i in range(1, 13)]
    for r in results:
        monthly_data[int(r.month) - 1]['total'] = float(r.total)

    return jsonify({'data': monthly_data, 'year': year}), 200

@dashboard_bp.route('/monthly-purchases', methods=['GET'])
@jwt_required()
def get_monthly_purchases():
    year = datetime.utcnow().year
    results = db.session.query(
        func.extract('month', Purchase.created_at).label('month'),
        func.coalesce(func.sum(Purchase.grand_total), 0).label('total')
    ).filter(
        func.extract('year', Purchase.created_at) == year
    ).group_by(func.extract('month', Purchase.created_at)).order_by(func.extract('month', Purchase.created_at)).all()

    monthly_data = [{'month': i, 'total': 0} for i in range(1, 13)]
    for r in results:
        monthly_data[int(r.month) - 1]['total'] = float(r.total)

    return jsonify({'data': monthly_data, 'year': year}), 200

@dashboard_bp.route('/top-products', methods=['GET'])
@jwt_required()
def get_top_products():
    results = db.session.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label('total_qty'),
        func.sum(SaleItem.total_price).label('total_revenue')
    ).group_by(SaleItem.product_id).order_by(func.sum(SaleItem.quantity).desc()).limit(5).all()

    data = []
    for r in results:
        product = Product.query.get(r.product_id)
        if product:
            data.append({
                'name': product.product_name,
                'quantity': int(r.total_qty) if r.total_qty else 0,
                'revenue': float(r.total_revenue) if r.total_revenue else 0
            })

    return jsonify({'data': data}), 200

@dashboard_bp.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(10).all()
    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200
