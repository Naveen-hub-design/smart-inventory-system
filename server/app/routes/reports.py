import csv
from flask import Blueprint, request, jsonify, send_file, current_app
from app.models.product import Product
from app.middleware.auth import staff_required
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial
from app.models.category import Category
from app.routes.settings import get_setting
from app.utils.helpers import parse_date
from app import db
from datetime import datetime, timedelta
from sqlalchemy import func
import openpyxl
import io

reports_bp = Blueprint('reports', __name__)

PREVIEW_LIMIT = 20

def generate_excel(filename, headers, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = filename
    ws.append(headers)
    for row in rows:
        ws.append(row)
    for col in ws.columns:
        max_length = 0
        col_letter = col[0].column_letter
        for cell in col:
            if cell.value:
                max_length = max(max_length, len(str(cell.value)))
        ws.column_dimensions[col_letter].width = min(max_length + 2, 50)
    return wb

def send_csv_response(filename, headers, rows):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    mem = io.BytesIO(output.getvalue().encode('utf-8-sig'))
    mem.seek(0)
    return send_file(mem, mimetype='text/csv', as_attachment=True, download_name=f'{filename}.csv')

@reports_bp.route('/inventory', methods=['GET'])
@staff_required
def inventory_report():
    default_fmt = get_setting('report_default_format', 'json')
    format_type = request.args.get('format', default_fmt)
    category_id = request.args.get('category_id', type=int)

    query = Product.query.filter_by(status='active')
    if category_id:
        query = query.filter(Product.category_id == category_id)

    total_products = query.count()
    total_stock = db.session.query(func.sum(Product.quantity)).filter(query.whereclause).scalar() or 0 if query.whereclause is not None else (db.session.query(func.sum(Product.quantity)).filter(Product.status == 'active').scalar() or 0)

    products = query.limit(PREVIEW_LIMIT if format_type != 'excel' and format_type != 'csv' else None).all()

    data = [{
        'Product': p.product_name,
        'SKU': p.barcode or 'N/A',
        'Category': p.category.name if p.category else 'N/A',
        'Current Stock': p.quantity,
        'Minimum Stock': p.min_stock,
        'Status': 'Out of Stock' if p.quantity == 0 else ('Low Stock' if p.quantity <= p.min_stock else 'In Stock')
    } for p in products]

    if format_type == 'excel':
        all_products = query.all()
        wb = generate_excel('Inventory_Report',
            ['Product', 'Category', 'Size', 'Color', 'Price', 'Quantity', 'Min Stock', 'Status'],
            [[p.product_name, p.category.name if p.category else 'N/A', p.size or 'N/A', p.color or 'N/A', float(p.price), p.quantity, p.min_stock, 'Low Stock' if p.quantity <= p.min_stock else 'In Stock'] for p in all_products]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='inventory_report.xlsx')

    if format_type == 'csv':
        all_products = query.all()
        return send_csv_response('inventory_report',
            ['Product', 'Category', 'Size', 'Color', 'Price', 'Quantity', 'Min Stock', 'Status'],
            [[p.product_name, p.category.name if p.category else 'N/A', p.size or 'N/A', p.color or 'N/A', float(p.price), p.quantity, p.min_stock, 'Low Stock' if p.quantity <= p.min_stock else 'In Stock'] for p in all_products]
        )

    return jsonify({
        'data': data,
        'count': len(data),
        'summary': {
            'total_products': total_products,
            'total_stock': float(total_stock)
        }
    }), 200


@reports_bp.route('/sales', methods=['GET'])
@staff_required
def sales_report():
    default_fmt = get_setting('report_default_format', 'json')
    default_days = int(get_setting('report_default_date_range', '30'))
    format_type = request.args.get('format', default_fmt)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', '')

    query = Sale.query.filter(Sale.status == 'completed')
    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)
    if not start_dt and not end_dt:
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=default_days)
    if start_dt:
        query = query.filter(Sale.sale_date >= start_dt)
    if end_dt:
        query = query.filter(Sale.sale_date <= end_dt)
    if search:
        query = query.filter(Sale.invoice_number.like(f'%{search}%'))

    sales = query.order_by(Sale.sale_date.desc()).all()

    total_revenue = 0
    total_qty = 0
    all_rows = []

    if format_type == 'excel' or format_type == 'csv':
        for s in sales:
            for item in s.items:
                if category_id and item.product and item.product.category_id != category_id:
                    continue
                pname = item.product.product_name if item.product else (item.variant.product.product_name if item.variant else 'N/A')
                total_revenue += float(item.total_price)
                total_qty += int(item.quantity)
                all_rows.append([
                    s.invoice_number,
                    s.customer_name or 'Walk-in',
                    pname,
                    item.quantity,
                    float(item.total_price),
                    s.sale_date.strftime('%Y-%m-%d') if s.sale_date else ''
                ])
        if format_type == 'excel':
            wb = generate_excel('Sales_Report',
                ['Invoice', 'Customer', 'Product', 'Quantity', 'Total', 'Date'], all_rows)
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            as_attachment=True, download_name='sales_report.xlsx')
        return send_csv_response('sales_report',
            ['Invoice', 'Customer', 'Product', 'Quantity', 'Total', 'Date'], all_rows)

    data = []
    row_count = 0
    for s in sales:
        for item in s.items:
            if row_count >= PREVIEW_LIMIT:
                break
            if category_id and item.product and item.product.category_id != category_id:
                continue
            product_name = item.product.product_name if item.product else (item.variant.product.product_name if item.variant else 'N/A')
            total_revenue += float(item.total_price)
            total_qty += int(item.quantity)
            data.append({
                'Invoice': s.invoice_number,
                'Customer': s.customer_name or 'Walk-in',
                'Product': product_name,
                'Quantity': item.quantity,
                'Total': float(item.total_price),
                'Date': s.sale_date.strftime('%Y-%m-%d') if s.sale_date else ''
            })
            row_count += 1
        if row_count >= PREVIEW_LIMIT:
            break

    return jsonify({
        'data': data,
        'count': len(data),
        'summary': {
            'total_sales': len(sales),
            'total_revenue': total_revenue,
            'total_quantity': total_qty
        }
    }), 200


@reports_bp.route('/purchases', methods=['GET'])
@staff_required
def purchase_report():
    default_fmt = get_setting('report_default_format', 'json')
    default_days = int(get_setting('report_default_date_range', '30'))
    format_type = request.args.get('format', default_fmt)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    supplier_id = request.args.get('supplier_id', type=int)
    search = request.args.get('search', '')

    query = Purchase.query
    start_dt = parse_date(start_date)
    end_dt = parse_date(end_date)
    if not start_dt and not end_dt:
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=default_days)
    if start_dt:
        query = query.filter(Purchase.purchase_date >= start_dt)
    if end_dt:
        query = query.filter(Purchase.purchase_date <= end_dt)
    if supplier_id:
        query = query.filter(Purchase.supplier_id == supplier_id)
    if search:
        query = query.filter(Purchase.invoice_number.like(f'%{search}%'))

    purchases = query.order_by(Purchase.purchase_date.desc()).all()

    total_cost = 0
    total_qty = 0
    all_rows = []

    if format_type == 'excel' or format_type == 'csv':
        for p in purchases:
            for item in p.items:
                total_cost += float(item.total_price)
                total_qty += float(item.quantity)
                mname = item.material.material_name if item.material else (item.variant.product.product_name if item.variant else 'N/A')
                all_rows.append([
                    p.invoice_number,
                    p.supplier.supplier_name if p.supplier else 'N/A',
                    mname,
                    float(item.quantity),
                    float(item.total_price),
                    p.purchase_date.strftime('%Y-%m-%d') if p.purchase_date else ''
                ])
        if format_type == 'excel':
            wb = generate_excel('Purchase_Report',
                ['Purchase No', 'Supplier', 'Material', 'Quantity', 'Cost', 'Date'], all_rows)
            output = io.BytesIO()
            wb.save(output)
            output.seek(0)
            return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            as_attachment=True, download_name='purchase_report.xlsx')
        return send_csv_response('purchase_report',
            ['Purchase No', 'Supplier', 'Material', 'Quantity', 'Cost', 'Date'], all_rows)

    data = []
    row_count = 0
    for p in purchases:
        for item in p.items:
            if row_count >= PREVIEW_LIMIT:
                break
            material_name = item.material.material_name if item.material else (item.variant.product.product_name if item.variant else 'N/A')
            total_cost += float(item.total_price)
            total_qty += float(item.quantity)
            data.append({
                'Purchase No': p.invoice_number,
                'Supplier': p.supplier.supplier_name if p.supplier else 'N/A',
                'Material': material_name,
                'Quantity': float(item.quantity),
                'Cost': float(item.total_price),
                'Date': p.purchase_date.strftime('%Y-%m-%d') if p.purchase_date else ''
            })
            row_count += 1
        if row_count >= PREVIEW_LIMIT:
            break

    return jsonify({
        'data': data,
        'count': len(data),
        'summary': {
            'total_purchases': len(purchases),
            'total_cost': total_cost,
            'total_quantity': total_qty
        }
    }), 200


@reports_bp.route('/suppliers', methods=['GET'])
@staff_required
def supplier_report():
    default_fmt = get_setting('report_default_format', 'json')
    format_type = request.args.get('format', default_fmt)
    search = request.args.get('search', '')

    query = Supplier.query
    if search:
        query = query.filter(Supplier.supplier_name.like(f'%{search}%'))

    total_suppliers = query.count()
    suppliers = query.limit(PREVIEW_LIMIT if format_type != 'excel' and format_type != 'csv' else None).all()

    data = [{
        'Supplier': s.supplier_name,
        'Contact Person': s.contact_person or 'N/A',
        'Phone': s.phone or 'N/A',
        'Email': s.email or 'N/A',
        'Status': s.status
    } for s in suppliers]

    if format_type == 'excel':
        all_suppliers = query.all()
        wb = generate_excel('Supplier_Report',
            ['Supplier', 'Contact', 'Phone', 'Email', 'GST', 'Status', 'Materials'],
            [[s.supplier_name, s.contact_person or 'N/A', s.phone or 'N/A', s.email or 'N/A', s.gst_number or 'N/A', s.status, len(s.raw_materials) if s.raw_materials else 0] for s in all_suppliers]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='supplier_report.xlsx')

    if format_type == 'csv':
        all_suppliers = query.all()
        return send_csv_response('supplier_report',
            ['Supplier', 'Contact', 'Phone', 'Email', 'GST', 'Status', 'Materials'],
            [[s.supplier_name, s.contact_person or 'N/A', s.phone or 'N/A', s.email or 'N/A', s.gst_number or 'N/A', s.status, len(s.raw_materials) if s.raw_materials else 0] for s in all_suppliers]
        )

    return jsonify({
        'data': data,
        'count': len(data),
        'summary': {'total_suppliers': total_suppliers}
    }), 200


@reports_bp.route('/low-stock', methods=['GET'])
@staff_required
def low_stock_report():
    default_fmt = get_setting('report_default_format', 'json')
    format_type = request.args.get('format', default_fmt)

    low_products = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.status == 'active'
    ).limit(PREVIEW_LIMIT if format_type != 'excel' and format_type != 'csv' else None).all()

    if format_type == 'excel':
        all_low_products = Product.query.filter(
            Product.quantity <= Product.min_stock,
            Product.status == 'active'
        ).all()
        wb = generate_excel('Low_Stock_Report',
            ['Type', 'Name', 'Quantity', 'Min Stock', 'Status'],
            [['Product', p.product_name, p.quantity, p.min_stock, 'Out of Stock' if p.quantity == 0 else 'Low Stock'] for p in all_low_products]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='low_stock_report.xlsx')

    if format_type == 'csv':
        all_low_products = Product.query.filter(
            Product.quantity <= Product.min_stock,
            Product.status == 'active'
        ).all()
        return send_csv_response('low_stock_report',
            ['Type', 'Name', 'Quantity', 'Min Stock', 'Status'],
            [['Product', p.product_name, p.quantity, p.min_stock, 'Out of Stock' if p.quantity == 0 else 'Low Stock'] for p in all_low_products]
        )

    data = [{
        'Product': p.product_name,
        'Current Stock': p.quantity,
        'Minimum Stock': p.min_stock,
        'Required Quantity': max(0, p.min_stock - p.quantity),
        'Status': 'Out of Stock' if p.quantity == 0 else 'Low Stock'
    } for p in low_products]

    return jsonify({
        'data': data,
        'count': len(data),
        'summary': {
            'total_low_stock': len(low_products),
            'out_of_stock': sum(1 for p in low_products if p.quantity == 0)
        }
    }), 200


@reports_bp.route('/chart-data/sales-trend', methods=['GET'])
@staff_required
def sales_trend():
    try:
        months = int(request.args.get('months', 12))
        end = datetime.utcnow()
        start = end - timedelta(days=months * 30)
        month_label = func.strftime('%Y-%m', Sale.sale_date)
        sales = db.session.query(
            month_label.label('month'),
            func.sum(SaleItem.quantity).label('quantity'),
            func.sum(SaleItem.total_price).label('revenue')
        ).join(SaleItem).filter(
            Sale.status == 'completed',
            Sale.sale_date >= start,
            Sale.sale_date <= end
        ).group_by(month_label).order_by(month_label).all()

        return jsonify({
            'labels': [s.month for s in sales],
            'values': [float(s.revenue or 0) for s in sales],
            'quantities': [int(s.quantity or 0) for s in sales]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Sales trend error: {e}", exc_info=True)
        return jsonify({'labels': [], 'values': [], 'quantities': []}), 200


@reports_bp.route('/chart-data/purchase-trend', methods=['GET'])
@staff_required
def purchase_trend():
    try:
        months = int(request.args.get('months', 12))
        end = datetime.utcnow()
        start = end - timedelta(days=months * 30)
        month_label = func.strftime('%Y-%m', Purchase.purchase_date)
        purchases = db.session.query(
            month_label.label('month'),
            func.sum(PurchaseItem.quantity).label('quantity'),
            func.sum(PurchaseItem.total_price).label('cost')
        ).join(PurchaseItem).filter(
            Purchase.purchase_date >= start,
            Purchase.purchase_date <= end
        ).group_by(month_label).order_by(month_label).all()

        return jsonify({
            'labels': [p.month for p in purchases],
            'values': [float(p.cost or 0) for p in purchases],
            'quantities': [float(p.quantity or 0) for p in purchases]
        }), 200
    except Exception as e:
        current_app.logger.error(f"Purchase trend error: {e}", exc_info=True)
        return jsonify({'labels': [], 'values': [], 'quantities': []}), 200


@reports_bp.route('/chart-data/category-distribution', methods=['GET'])
@staff_required
def category_distribution():
    data = db.session.query(
        Category.name,
        func.sum(Product.quantity)
    ).join(Product, Product.category_id == Category.id).filter(
        Product.status == 'active'
    ).group_by(Category.name).all()

    return jsonify({
        'labels': [d[0] for d in data],
        'values': [int(d[1] or 0) for d in data]
    }), 200
