from flask import Blueprint, jsonify
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.middleware.auth import staff_required
from app.models.raw_material import RawMaterial
from app.models.supplier import Supplier
from app.models.purchase import Purchase
from app.models.sale import Sale, SaleItem
from app.models.notification import Notification
from app.models.category import Category
from app.models.audit_log import AuditLog
from app import db
from datetime import datetime
from sqlalchemy import func

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/stats', methods=['GET'])
@staff_required
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

    total_variants = ProductVariant.query.count()
    low_stock_variants = ProductVariant.query.filter(
        ProductVariant.stock <= ProductVariant.min_stock,
        ProductVariant.stock > 0
    ).count()

    low_stock_count = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.status == 'active'
    ).count()

    out_of_stock_count = Product.query.filter(
        Product.quantity == 0,
        Product.status == 'active'
    ).count()

    total_categories = Category.query.count()

    total_customers = db.session.query(
        Sale.customer_name
    ).filter(
        Sale.customer_name.isnot(None),
        Sale.customer_name != ''
    ).distinct().count()

    revenue = db.session.query(func.coalesce(func.sum(Sale.grand_total), 0)).filter(
        Sale.status == 'completed'
    ).scalar()

    profit_data = db.session.query(
        func.coalesce(func.sum(
            SaleItem.total_price - (SaleItem.quantity * ProductVariant.cost_price)
        ), 0)
    ).join(Sale).join(
        ProductVariant, SaleItem.variant_id == ProductVariant.id, isouter=True
    ).filter(
        Sale.status == 'completed',
        SaleItem.variant_id.isnot(None)
    ).scalar()

    profit = float(profit_data)

    return jsonify({
        'total_products': total_products,
        'total_materials': total_materials,
        'total_suppliers': total_suppliers,
        'total_purchases': total_purchases,
        'total_sales': float(total_sales),
        'today_sales': float(today_sales),
        'total_purchase_amount': float(total_purchase_amount),
        'total_variants': total_variants,
        'low_stock_variants': low_stock_variants,
        'low_stock_count': low_stock_count,
        'out_of_stock_count': out_of_stock_count,
        'total_categories': total_categories,
        'total_customers': total_customers,
        'revenue': float(revenue),
        'profit': profit,
        'available_products': total_products
    }), 200

@dashboard_bp.route('/recent-transactions', methods=['GET'])
@staff_required
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
@staff_required
def get_stock_by_category():
    results = db.session.query(
        Product.category_id,
        func.sum(Product.quantity).label('total_quantity')
    ).filter(Product.status == 'active').group_by(Product.category_id).all()

    cat_ids = [r.category_id for r in results if r.category_id]
    categories = {c.id: c for c in Category.query.filter(Category.id.in_(cat_ids)).all()} if cat_ids else {}

    data = []
    for r in results:
        cat = categories.get(r.category_id) if r.category_id else None
        data.append({
            'name': cat.name if cat else 'Uncategorized',
            'quantity': int(r.total_quantity) if r.total_quantity else 0
        })

    return jsonify({'data': data}), 200

@dashboard_bp.route('/monthly-sales', methods=['GET'])
@staff_required
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
@staff_required
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
@staff_required
def get_top_products():
    results = db.session.query(
        SaleItem.product_id,
        func.sum(SaleItem.quantity).label('total_qty'),
        func.sum(SaleItem.total_price).label('total_revenue')
    ).group_by(SaleItem.product_id).order_by(func.sum(SaleItem.quantity).desc()).limit(5).all()

    product_ids = [r.product_id for r in results if r.product_id]
    products = {p.id: p for p in Product.query.filter(Product.id.in_(product_ids)).all()} if product_ids else {}

    data = []
    for r in results:
        product = products.get(r.product_id)
        if product:
            data.append({
                'name': product.product_name,
                'quantity': int(r.total_qty) if r.total_qty else 0,
                'revenue': float(r.total_revenue) if r.total_revenue else 0
            })

    return jsonify({'data': data}), 200

@dashboard_bp.route('/notifications', methods=['GET'])
@staff_required
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(10).all()
    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200


@dashboard_bp.route('/recent-activities', methods=['GET'])
@staff_required
def get_recent_activities():
    recent_audits = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(10).all()

    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
    recent_purchases = Purchase.query.order_by(Purchase.created_at.desc()).limit(5).all()

    activities = []

    for a in recent_audits:
        activities.append({
            'type': 'audit',
            'id': a.id,
            'description': a.description,
            'user': a.username,
            'module': a.module,
            'action': a.action,
            'timestamp': a.created_at.isoformat() if a.created_at else None
        })

    for s in recent_sales:
        activities.append({
            'type': 'sale',
            'id': s.id,
            'description': f'Sale {s.invoice_number} - {s.customer_name or "Walk-in"}',
            'user': None,
            'module': 'sales',
            'action': 'sale_created',
            'timestamp': s.created_at.isoformat() if s.created_at else None
        })

    for p in recent_purchases:
        activities.append({
            'type': 'purchase',
            'id': p.id,
            'description': f'Purchase {p.invoice_number}',
            'user': None,
            'module': 'purchases',
            'action': 'purchase_created',
            'timestamp': p.created_at.isoformat() if p.created_at else None
        })

    activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
    return jsonify({'activities': activities[:20]}), 200
