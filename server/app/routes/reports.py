from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from app.models.product import Product
from app.models.sale import Sale
from app.models.purchase import Purchase
from app.models.supplier import Supplier
from app.models.raw_material import RawMaterial
from app import db
from datetime import datetime
import openpyxl
import io

reports_bp = Blueprint('reports', __name__)

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
@jwt_required()
def inventory_report():
    format_type = request.args.get('format', 'json')

    products = Product.query.filter_by(status='active').all()
    data = [{
        'Product': p.product_name,
        'Category': p.category.name if p.category else 'N/A',
        'Size': p.size or 'N/A',
        'Color': p.color or 'N/A',
        'Price': float(p.price),
        'Quantity': p.quantity,
        'Min Stock': p.min_stock,
        'Status': 'Low Stock' if p.quantity <= p.min_stock else 'In Stock'
    } for p in products]

    if format_type == 'excel':
        wb = generate_excel('Inventory_Report',
            ['Product', 'Category', 'Size', 'Color', 'Price', 'Quantity', 'Min Stock', 'Status'],
            [[d['Product'], d['Category'], d['Size'], d['Color'], d['Price'], d['Quantity'], d['Min Stock'], d['Status']] for d in data]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='inventory_report.xlsx')

    return jsonify({'data': data, 'count': len(data)}), 200

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
def sales_report():
    format_type = request.args.get('format', 'json')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Sale.query.filter(Sale.status == 'completed')
    start_dt = parse_date(start_date, 'start_date')
    end_dt = parse_date(end_date, 'end_date')
    if start_dt:
        query = query.filter(Sale.sale_date >= start_dt)
    if end_dt:
        query = query.filter(Sale.sale_date <= end_dt)

    sales = query.order_by(Sale.sale_date.desc()).all()
    data = [{
        'Invoice': s.invoice_number,
        'Customer': s.customer_name or 'Walk-in',
        'Date': s.sale_date.strftime('%Y-%m-%d') if s.sale_date else '',
        'Total': float(s.total_amount),
        'Discount': float(s.discount),
        'Tax': float(s.tax),
        'Grand Total': float(s.grand_total),
        'Payment': s.payment_method
    } for s in sales]

    total_sales = sum(d['Grand Total'] for d in data)

    if format_type == 'excel':
        wb = generate_excel('Sales_Report',
            ['Invoice', 'Customer', 'Date', 'Total', 'Discount', 'Tax', 'Grand Total', 'Payment'],
            [[d['Invoice'], d['Customer'], d['Date'], d['Total'], d['Discount'], d['Tax'], d['Grand Total'], d['Payment']] for d in data]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='sales_report.xlsx')

    return jsonify({'data': data, 'total_sales': total_sales, 'count': len(data)}), 200

@reports_bp.route('/purchases', methods=['GET'])
@jwt_required()
def purchase_report():
    format_type = request.args.get('format', 'json')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Purchase.query
    start_dt = parse_date(start_date, 'start_date')
    end_dt = parse_date(end_date, 'end_date')
    if start_dt:
        query = query.filter(Purchase.purchase_date >= start_dt)
    if end_dt:
        query = query.filter(Purchase.purchase_date <= end_dt)

    purchases = query.order_by(Purchase.purchase_date.desc()).all()
    data = [{
        'Invoice': p.invoice_number,
        'Supplier': p.supplier.supplier_name if p.supplier else 'N/A',
        'Date': p.purchase_date.strftime('%Y-%m-%d') if p.purchase_date else '',
        'Total': float(p.total_amount),
        'Discount': float(p.discount or 0),
        'Tax': float(p.tax or 0),
        'Grand Total': float(p.grand_total),
        'Status': p.status
    } for p in purchases]

    total_purchases = sum(d['Grand Total'] for d in data)

    if format_type == 'excel':
        wb = generate_excel('Purchase_Report',
            ['Invoice', 'Supplier', 'Date', 'Total', 'Discount', 'Tax', 'Grand Total', 'Status'],
            [[d['Invoice'], d['Supplier'], d['Date'], d['Total'], d['Discount'], d['Tax'], d['Grand Total'], d['Status']] for d in data]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='purchase_report.xlsx')

    return jsonify({'data': data, 'total_purchases': total_purchases, 'count': len(data)}), 200

@reports_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def supplier_report():
    format_type = request.args.get('format', 'json')

    suppliers = Supplier.query.all()
    data = [{
        'Supplier': s.supplier_name,
        'Contact': s.contact_person or 'N/A',
        'Phone': s.phone or 'N/A',
        'Email': s.email or 'N/A',
        'GST': s.gst_number or 'N/A',
        'Status': s.status,
        'Materials': len(s.raw_materials) if s.raw_materials else 0
    } for s in suppliers]

    if format_type == 'excel':
        wb = generate_excel('Supplier_Report',
            ['Supplier', 'Contact', 'Phone', 'Email', 'GST', 'Status', 'Materials'],
            [[d['Supplier'], d['Contact'], d['Phone'], d['Email'], d['GST'], d['Status'], d['Materials']] for d in data]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='supplier_report.xlsx')

    return jsonify({'data': data, 'count': len(data)}), 200

@reports_bp.route('/low-stock', methods=['GET'])
@jwt_required()
def low_stock_report():
    format_type = request.args.get('format', 'json')

    low_products = Product.query.filter(
        Product.quantity <= Product.min_stock,
        Product.status == 'active'
    ).all()

    low_materials = RawMaterial.query.filter(
        RawMaterial.quantity <= RawMaterial.min_stock
    ).all()

    data = {
        'products': [{
            'Product': p.product_name,
            'Category': p.category.name if p.category else 'N/A',
            'Quantity': p.quantity,
            'Min Stock': p.min_stock,
            'Status': 'Out of Stock' if p.quantity == 0 else 'Low Stock'
        } for p in low_products],
        'materials': [{
            'Material': m.material_name,
            'Unit': m.unit,
            'Quantity': float(m.quantity),
            'Min Stock': float(m.min_stock),
            'Status': 'Out of Stock' if float(m.quantity) == 0 else 'Low Stock'
        } for m in low_materials]
    }

    if format_type == 'excel':
        wb = generate_excel('Low_Stock_Report',
            ['Type', 'Name', 'Quantity', 'Min Stock', 'Status'],
            [['Product', d['Product'], d['Quantity'], d['Min Stock'], d['Status']] for d in data['products']] +
            [['Material', d['Material'], float(d['Quantity']), float(d['Min Stock']), d['Status']] for d in data['materials']]
        )
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return send_file(output, mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        as_attachment=True, download_name='low_stock_report.xlsx')

    return jsonify(data), 200
