from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.product import Product
from app.models.raw_material import RawMaterial
from app.models.supplier import Supplier
from app.models.purchase import Purchase
from app.models.sale import Sale
from app import db

search_bp = Blueprint('search', __name__)

@search_bp.route('/', methods=['GET'])
@jwt_required()
def global_search():
    query = request.args.get('q', '').strip()
    if not query or len(query) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400

    results = {}

    products = Product.query.filter(
        db.or_(
            Product.product_name.like(f'%{query}%'),
            Product.barcode.like(f'%{query}%'),
            Product.color.like(f'%{query}%')
        ),
        Product.status == 'active'
    ).limit(5).all()
    results['products'] = [{
        'id': p.id,
        'name': p.product_name,
        'type': 'product',
        'detail': f"{p.color or ''} {p.size or ''} - ₹{float(p.price)}",
        'url': f'/products/{p.id}'
    } for p in products]

    materials = RawMaterial.query.filter(
        RawMaterial.material_name.like(f'%{query}%')
    ).limit(5).all()
    results['materials'] = [{
        'id': m.id,
        'name': m.material_name,
        'type': 'material',
        'detail': f"{m.unit} - ₹{float(m.cost)}/unit",
        'url': f'/materials/{m.id}'
    } for m in materials]

    suppliers = Supplier.query.filter(
        db.or_(
            Supplier.supplier_name.like(f'%{query}%'),
            Supplier.contact_person.like(f'%{query}%'),
            Supplier.phone.like(f'%{query}%')
        )
    ).limit(5).all()
    results['suppliers'] = [{
        'id': s.id,
        'name': s.supplier_name,
        'type': 'supplier',
        'detail': s.contact_person or s.phone or '',
        'url': f'/suppliers/{s.id}'
    } for s in suppliers]

    purchases = Purchase.query.filter(
        Purchase.invoice_number.like(f'%{query}%')
    ).limit(5).all()
    results['purchases'] = [{
        'id': p.id,
        'name': p.invoice_number,
        'type': 'purchase',
        'detail': f"₹{float(p.grand_total)}",
        'url': f'/purchases/{p.id}'
    } for p in purchases]

    sales = Sale.query.filter(
        db.or_(
            Sale.invoice_number.like(f'%{query}%'),
            Sale.customer_name.like(f'%{query}%')
        )
    ).limit(5).all()
    results['sales'] = [{
        'id': s.id,
        'name': s.invoice_number,
        'type': 'sale',
        'detail': f"{s.customer_name or 'Walk-in'} - ₹{float(s.grand_total)}",
        'url': f'/sales/{s.id}'
    } for s in sales]

    return jsonify({'results': results, 'query': query}), 200
