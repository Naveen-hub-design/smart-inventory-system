from flask import Blueprint, request, jsonify, send_file
from app.models.product import Product
from app.middleware.auth import staff_required
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial
from app.routes.settings import get_setting
from app import db
from datetime import datetime, timedelta
import openpyxl
import io

reports_bp = Blueprint('reports', __name__)

PREVIEW_LIMIT = 20

def parse_date(date_str, param_name):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None

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

@reports_bp.route('/inventory', methods=['GET'])
@staff_required
def inventory_report():
    default_fmt = get_setting('report_default_format', 'json')
    format_type = request.args.get('format', default_fmt)

    products = Product.query.filter_by(status='active').limit(PREVIEW_LIMIT if format_type != 'excel' else None).all()

    data = [{
        'Product': p.product_name,
        'SKU': p.barcode or 'N/A',
        'Category': p.category.name if p.category else 'N/A',
        'Current Stock': p.quantity,
        'Minimum Stock': p.min_stock,
        'Status': 'Out of Stock' if p.quantity == 0 else ('Low Stock' if p.quantity <= p.min_stock else 'In Stock')
    } for p in products]

    if format_type == 'excel':
        all_products = Product.query.filter_by(status='active').all()
        wb = generate_excel('Inventory_Report',
            ['Product', 'Category', 'Size', 'Color', 'Price', 'Quantity', 'Min Stock', 'Status'],
            [[p.product_name, p.category.name if p.category else 'N/A', p.size or 'N/A', p.color or 'N/A', float(p.price), p.quantity, p.min_stock, 'Low Stock' if p.quantity <= p.min_stock else 'In Stock'] for p in all_products]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='inventory_report.xlsx')

    return jsonify({'data': data, 'count': len(data)}), 200


@reports_bp.route('/sales', methods=['GET'])
@staff_required
def sales_report():
    default_fmt = get_setting('report_default_format', 'json')
    default_days = int(get_setting('report_default_date_range', '30'))
    format_type = request.args.get('format', default_fmt)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Sale.query.filter(Sale.status == 'completed')
    start_dt = parse_date(start_date, 'start_date')
    end_dt = parse_date(end_date, 'end_date')
    if not start_dt and not end_date:
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=default_days)
    if start_dt:
        query = query.filter(Sale.sale_date >= start_dt)
    if end_dt:
        query = query.filter(Sale.sale_date <= end_dt)

    sales = query.order_by(Sale.sale_date.desc()).all()

    if format_type == 'excel':
        excel_rows = []
        for s in sales:
            for item in s.items:
                excel_rows.append([
                    s.invoice_number,
                    s.customer_name or 'Walk-in',
                    item.product.product_name if item.product else (item.variant.product.product_name if item.variant else 'N/A'),
                    item.quantity,
                    float(item.total_price),
                    s.sale_date.strftime('%Y-%m-%d') if s.sale_date else ''
                ])
        wb = generate_excel('Sales_Report',
            ['Invoice', 'Customer', 'Product', 'Quantity', 'Total', 'Date'],
            excel_rows
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='sales_report.xlsx')

    data = []
    count = 0
    for s in sales:
        for item in s.items:
            if count >= PREVIEW_LIMIT:
                break
            product_name = item.product.product_name if item.product else (item.variant.product.product_name if item.variant else 'N/A')
            data.append({
                'Invoice': s.invoice_number,
                'Customer': s.customer_name or 'Walk-in',
                'Product': product_name,
                'Quantity': item.quantity,
                'Total': float(item.total_price),
                'Date': s.sale_date.strftime('%Y-%m-%d') if s.sale_date else ''
            })
            count += 1
        if count >= PREVIEW_LIMIT:
            break

    return jsonify({'data': data, 'count': len(data)}), 200


@reports_bp.route('/purchases', methods=['GET'])
@staff_required
def purchase_report():
    default_fmt = get_setting('report_default_format', 'json')
    default_days = int(get_setting('report_default_date_range', '30'))
    format_type = request.args.get('format', default_fmt)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Purchase.query
    start_dt = parse_date(start_date, 'start_date')
    end_dt = parse_date(end_date, 'end_date')
    if not start_dt and not end_date:
        end_dt = datetime.utcnow()
        start_dt = end_dt - timedelta(days=default_days)
    if start_dt:
        query = query.filter(Purchase.purchase_date >= start_dt)
    if end_dt:
        query = query.filter(Purchase.purchase_date <= end_dt)

    purchases = query.order_by(Purchase.purchase_date.desc()).all()

    if format_type == 'excel':
        excel_rows = []
        for p in purchases:
            for item in p.items:
                excel_rows.append([
                    p.invoice_number,
                    p.supplier.supplier_name if p.supplier else 'N/A',
                    item.material.material_name if item.material else (item.variant.product.product_name if item.variant else 'N/A'),
                    float(item.quantity),
                    float(item.total_price),
                    p.purchase_date.strftime('%Y-%m-%d') if p.purchase_date else ''
                ])
        wb = generate_excel('Purchase_Report',
            ['Purchase No', 'Supplier', 'Material', 'Quantity', 'Cost', 'Date'],
            excel_rows
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='purchase_report.xlsx')

    data = []
    count = 0
    for p in purchases:
        for item in p.items:
            if count >= PREVIEW_LIMIT:
                break
            material_name = item.material.material_name if item.material else (item.variant.product.product_name if item.variant else 'N/A')
            data.append({
                'Purchase No': p.invoice_number,
                'Supplier': p.supplier.supplier_name if p.supplier else 'N/A',
                'Material': material_name,
                'Quantity': float(item.quantity),
                'Cost': float(item.total_price),
                'Date': p.purchase_date.strftime('%Y-%m-%d') if p.purchase_date else ''
            })
            count += 1
        if count >= PREVIEW_LIMIT:
            break

    return jsonify({'data': data, 'count': len(data)}), 200


@reports_bp.route('/suppliers', methods=['GET'])
@staff_required
def supplier_report():
    default_fmt = get_setting('report_default_format', 'json')
    format_type = request.args.get('format', default_fmt)

    suppliers = Supplier.query.limit(PREVIEW_LIMIT if format_type != 'excel' else None).all()

    data = [{
        'Supplier': s.supplier_name,
        'Contact Person': s.contact_person or 'N/A',
        'Phone': s.phone or 'N/A',
        'Email': s.email or 'N/A',
        'Status': s.status
    } for s in suppliers]

    if format_type == 'excel':
        all_suppliers = Supplier.query.all()
        wb = generate_excel('Supplier_Report',
            ['Supplier', 'Contact', 'Phone', 'Email', 'GST', 'Status', 'Materials'],
            [[s.supplier_name, s.contact_person or 'N/A', s.phone or 'N/A', s.email or 'N/A', s.gst_number or 'N/A', s.status, len(s.raw_materials) if s.raw_materials else 0] for s in all_suppliers]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='supplier_report.xlsx')

    return jsonify({'data': data, 'count': len(data)}), 200


@reports_bp.route('/low-stock', methods=['GET'])
@staff_required
def low_stock_report():
    default_fmt = get_setting('report_default_format', 'json')
    format_type = request.args.get('format', default_fmt)

    low_products = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.status == 'active'
    ).limit(PREVIEW_LIMIT if format_type != 'excel' else None).all()

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

    data = [{
        'Product': p.product_name,
        'Current Stock': p.quantity,
        'Minimum Stock': p.min_stock,
        'Required Quantity': max(0, p.min_stock - p.quantity),
        'Status': 'Out of Stock' if p.quantity == 0 else 'Low Stock'
    } for p in low_products]

    return jsonify({'data': data, 'count': len(data)}), 200
