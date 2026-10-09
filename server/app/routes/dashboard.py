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

def _get_stats():
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    q_total_products = db.session.query(func.count(Product.id)).filter(Product.status == 'active').scalar_subquery()
    q_total_materials = db.session.query(func.count(RawMaterial.id)).scalar_subquery()
    q_total_suppliers = db.session.query(func.count(Supplier.id)).filter(Supplier.status == 'active').scalar_subquery()
    q_total_purchases = db.session.query(func.count(Purchase.id)).scalar_subquery()
    q_today_sales = db.session.query(func.coalesce(func.sum(Sale.grand_total), 0)).filter(Sale.created_at >= today_start).scalar_subquery()
    q_total_sales = db.session.query(func.coalesce(func.sum(Sale.grand_total), 0)).scalar_subquery()
    q_total_purchase_amount = db.session.query(func.coalesce(func.sum(Purchase.grand_total), 0)).scalar_subquery()
    q_total_variants = db.session.query(func.count(ProductVariant.id)).scalar_subquery()
    q_low_stock_variants = db.session.query(func.count(ProductVariant.id)).filter(ProductVariant.stock <= ProductVariant.min_stock, ProductVariant.stock > 0).scalar_subquery()
    q_low_stock_count = db.session.query(func.count(Product.id)).filter(Product.quantity <= Product.min_stock, Product.status == 'active').scalar_subquery()
    q_out_of_stock_count = db.session.query(func.count(Product.id)).filter(Product.quantity == 0, Product.status == 'active').scalar_subquery()
    q_total_categories = db.session.query(func.count(Category.id)).scalar_subquery()
    q_total_customers = db.session.query(func.count(func.distinct(Sale.customer_name))).filter(Sale.customer_name.isnot(None), Sale.customer_name != '').scalar_subquery()
    q_revenue = db.session.query(func.coalesce(func.sum(Sale.grand_total), 0)).filter(Sale.status == 'completed').scalar_subquery()
    q_profit = db.session.query(
        func.coalesce(func.sum(SaleItem.total_price - (SaleItem.quantity * ProductVariant.cost_price)), 0)
    ).join(Sale, SaleItem.sale_id == Sale.id).join(
        ProductVariant, SaleItem.variant_id == ProductVariant.id, isouter=True
    ).filter(Sale.status == 'completed', SaleItem.variant_id.isnot(None)).scalar_subquery()

    (
        total_products, total_materials, total_suppliers, total_purchases,
        today_sales, total_sales, total_purchase_amount, total_variants,
        low_stock_variants, low_stock_count, out_of_stock_count, total_categories,
        total_customers, revenue, profit
    ) = db.session.query(
        q_total_products, q_total_materials, q_total_suppliers, q_total_purchases,
        q_today_sales, q_total_sales, q_total_purchase_amount, q_total_variants,
        q_low_stock_variants, q_low_stock_count, q_out_of_stock_count, q_total_categories,
        q_total_customers, q_revenue, q_profit
    ).one()

    return {
        'total_products': total_products or 0,
        'total_materials': total_materials or 0,
        'total_suppliers': total_suppliers or 0,
        'total_purchases': total_purchases or 0,
        'total_sales': float(total_sales or 0),
        'today_sales': float(today_sales or 0),
        'total_purchase_amount': float(total_purchase_amount or 0),
        'total_variants': total_variants or 0,
        'low_stock_variants': low_stock_variants or 0,
        'low_stock_count': low_stock_count or 0,
        'out_of_stock_count': out_of_stock_count or 0,
        'total_categories': total_categories or 0,
        'total_customers': total_customers or 0,
        'revenue': float(revenue or 0),
        'profit': float(profit or 0),
        'available_products': total_products or 0
    }

def _get_recent_transactions(recent_sales, recent_purchases):
    transactions = []
    for s in recent_sales:
        transactions.append({
            'type': 'sale', 'id': s.id, 'invoice': s.invoice_number,
            'customer': s.customer_name, 'amount': float(s.grand_total),
            'date': s.created_at.isoformat() if s.created_at else None, 'status': s.status
        })
    for p in recent_purchases:
        transactions.append({
            'type': 'purchase', 'id': p.id, 'invoice': p.invoice_number,
            'supplier': p.supplier.supplier_name if p.supplier else None,
            'amount': float(p.grand_total),
            'date': p.created_at.isoformat() if p.created_at else None, 'status': p.status
        })
    transactions.sort(key=lambda x: x['date'], reverse=True)
    return {'transactions': transactions[:10]}

def _get_stock_by_category():
    results = db.session.query(
        Category.name,
        func.sum(Product.quantity).label('total_quantity')
    ).select_from(Product).outerjoin(Category, Product.category_id == Category.id) \
     .filter(Product.status == 'active').group_by(Category.name).all()
    data = []
    for r in results:
        data.append({
            'name': r.name if r.name else 'Uncategorized',
            'quantity': int(r.total_quantity) if r.total_quantity else 0
        })
    return {'data': data}

from sqlalchemy import literal

def _get_monthly_data():
    year = datetime.utcnow().year
    start_date = datetime(year, 1, 1)
    end_date = datetime(year + 1, 1, 1)

    q_sales = db.session.query(
        literal('sale').label('type'),
        func.extract('month', Sale.created_at).label('month'),
        func.coalesce(func.sum(Sale.grand_total), 0).label('total')
    ).filter(
        Sale.created_at >= start_date, Sale.created_at < end_date, Sale.status == 'completed'
    ).group_by(func.extract('month', Sale.created_at))

    q_purchases = db.session.query(
        literal('purchase').label('type'),
        func.extract('month', Purchase.created_at).label('month'),
        func.coalesce(func.sum(Purchase.grand_total), 0).label('total')
    ).filter(
        func.extract('year', Purchase.created_at) == year
    ).group_by(func.extract('month', Purchase.created_at))

    results = q_sales.union_all(q_purchases).all()

    sales_data = [{'month': i, 'total': 0} for i in range(1, 13)]
    purchases_data = [{'month': i, 'total': 0} for i in range(1, 13)]

    for r in results:
        if r.type == 'sale':
            sales_data[int(r.month) - 1]['total'] = float(r.total)
        else:
            purchases_data[int(r.month) - 1]['total'] = float(r.total)

    return {
        'monthly_sales': {'data': sales_data, 'year': year},
        'monthly_purchases': {'data': purchases_data, 'year': year}
    }

def _get_top_products():
    results = db.session.query(
        Product.product_name,
        func.sum(SaleItem.quantity).label('total_qty'),
        func.sum(SaleItem.total_price).label('total_revenue')
    ).select_from(SaleItem).join(Product, SaleItem.product_id == Product.id) \
     .group_by(Product.product_name).order_by(func.sum(SaleItem.quantity).desc()).limit(5).all()
    data = []
    for r in results:
        data.append({
            'name': r.product_name,
            'quantity': int(r.total_qty) if r.total_qty else 0,
            'revenue': float(r.total_revenue) if r.total_revenue else 0
        })
    return {'data': data}

def _get_recent_activities(recent_sales, recent_purchases, recent_audits):
    activities = []
    for a in recent_audits:
        activities.append({
            'type': 'audit', 'id': a.id, 'description': a.description, 'user': a.username,
            'module': a.module, 'action': a.action, 'timestamp': a.created_at.isoformat() if a.created_at else None
        })
    for s in recent_sales:
        activities.append({
            'type': 'sale', 'id': s.id, 'description': f'Sale {s.invoice_number} - {s.customer_name or "Walk-in"}',
            'user': None, 'module': 'sales', 'action': 'sale_created', 'timestamp': s.created_at.isoformat() if s.created_at else None
        })
    for p in recent_purchases:
        activities.append({
            'type': 'purchase', 'id': p.id, 'description': f'Purchase {p.invoice_number}',
            'user': None, 'module': 'purchases', 'action': 'purchase_created', 'timestamp': p.created_at.isoformat() if p.created_at else None
        })
    activities.sort(key=lambda x: x['timestamp'] or '', reverse=True)
    return {'activities': activities[:20]}
@dashboard_bp.route('/summary', methods=['GET'])
@staff_required
def get_summary():
    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
    recent_purchases = Purchase.query.options(db.joinedload(Purchase.supplier)).order_by(Purchase.created_at.desc()).limit(5).all()
    recent_audits = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(10).all()

    monthly_data = _get_monthly_data()

    return jsonify({
        'stats': _get_stats(),
        'recent_transactions': _get_recent_transactions(recent_sales, recent_purchases),
        'stock_by_category': _get_stock_by_category(),
        'monthly_sales': monthly_data['monthly_sales'],
        'monthly_purchases': monthly_data['monthly_purchases'],
        'top_products': _get_top_products(),
        'recent_activities': _get_recent_activities(recent_sales, recent_purchases, recent_audits)
    }), 200

@dashboard_bp.route('/stats', methods=['GET'])
@staff_required
def get_stats():
    return jsonify(_get_stats()), 200

@dashboard_bp.route('/recent-transactions', methods=['GET'])
@staff_required
def get_recent_transactions():
    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
    recent_purchases = Purchase.query.options(db.joinedload(Purchase.supplier)).order_by(Purchase.created_at.desc()).limit(5).all()
    return jsonify(_get_recent_transactions(recent_sales, recent_purchases)), 200

@dashboard_bp.route('/stock-by-category', methods=['GET'])
@staff_required
def get_stock_by_category():
    return jsonify(_get_stock_by_category()), 200

@dashboard_bp.route('/monthly-sales', methods=['GET'])
@staff_required
def get_monthly_sales():
    return jsonify(_get_monthly_data()['monthly_sales']), 200

@dashboard_bp.route('/monthly-purchases', methods=['GET'])
@staff_required
def get_monthly_purchases():
    return jsonify(_get_monthly_data()['monthly_purchases']), 200

@dashboard_bp.route('/top-products', methods=['GET'])
@staff_required
def get_top_products():
    return jsonify(_get_top_products()), 200

@dashboard_bp.route('/recent-activities', methods=['GET'])
@staff_required
def get_recent_activities():
    recent_sales = Sale.query.order_by(Sale.created_at.desc()).limit(5).all()
    recent_purchases = Purchase.query.order_by(Purchase.created_at.desc()).limit(5).all()
    recent_audits = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(10).all()
    return jsonify(_get_recent_activities(recent_sales, recent_purchases, recent_audits)), 200

@dashboard_bp.route('/notifications', methods=['GET'])
@staff_required
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(10).all()
    return jsonify({'notifications': [n.to_dict() for n in notifications]}), 200
