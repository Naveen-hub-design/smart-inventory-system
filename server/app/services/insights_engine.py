from app import db
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.sale import Sale, SaleItem
from app.models.category import Category
from datetime import datetime, timedelta
from sqlalchemy import func


INSIGHTS_LOOKBACK_DAYS = 365


def _safe_div(a, b):
    return round(a / b, 2) if b else 0


def _month_sales_query(variant_ids, start, end):
    rows = db.session.query(
        SaleItem.variant_id,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('qty'),
        func.coalesce(func.sum(SaleItem.total_price), 0).label('revenue')
    ).join(Sale).filter(
        Sale.status == 'completed',
        SaleItem.variant_id.in_(variant_ids),
        Sale.sale_date >= start,
        Sale.sale_date < end
    ).group_by(SaleItem.variant_id).all()
    return {r.variant_id: (float(r.qty), float(r.revenue)) for r in rows}


def get_insights(date_from=None, date_to=None, category_id=None, supplier_id=None):
    now = datetime.utcnow()

    start_date = datetime.fromisoformat(date_from) if date_from else (now - timedelta(days=INSIGHTS_LOOKBACK_DAYS))
    end_date = datetime.fromisoformat(date_to) if date_to else now

    variant_query = ProductVariant.query.join(Product).filter(Product.status == 'active')
    if category_id:
        variant_query = variant_query.filter(Product.category_id == category_id)
    if supplier_id:
        from app.models.purchase import Purchase, PurchaseItem
        supplier_variant_ids = db.session.query(PurchaseItem.variant_id).join(
            Purchase, Purchase.id == PurchaseItem.purchase_id
        ).filter(
            Purchase.supplier_id == supplier_id,
            PurchaseItem.variant_id.isnot(None)
        ).distinct().subquery()
        variant_query = variant_query.filter(ProductVariant.id.in_(supplier_variant_ids))

    variants = variant_query.all()
    variant_ids = [v.id for v in variants]

    filtered = bool(date_from or date_to or category_id or supplier_id)

    if not variant_ids:
        return _empty_result(now, filtered)

    # Per-variant sales aggregation
    sale_agg = db.session.query(
        SaleItem.variant_id,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('total_qty'),
        func.coalesce(func.sum(SaleItem.total_price), 0).label('total_revenue'),
        func.max(Sale.sale_date).label('last_sale_date')
    ).join(Sale).filter(
        Sale.status == 'completed',
        SaleItem.variant_id.in_(variant_ids),
        Sale.sale_date >= start_date,
        Sale.sale_date <= end_date
    ).group_by(SaleItem.variant_id).all()

    sale_map = {r.variant_id: r for r in sale_agg}

    # Monthly sales for growth calculation
    current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    prev_month_start = (current_month_start - timedelta(days=1)).replace(day=1)

    current_sales = _month_sales_query(variant_ids, current_month_start, now)
    prev_sales = _month_sales_query(variant_ids, prev_month_start, current_month_start)

    # Build variant data dict
    vdata = {}
    for v in variants:
        sales = sale_map.get(v.id)
        total_qty = float(sales.total_qty) if sales else 0
        total_revenue = float(sales.total_revenue) if sales else 0
        last_sale = sales.last_sale_date if sales else None
        curr_qty, curr_rev = current_sales.get(v.id, (0, 0))
        prev_qty, prev_rev = prev_sales.get(v.id, (0, 0))
        cost = float(v.cost_price or 0)
        price = float(v.selling_price or 0)

        vdata[v.id] = {
            'variant_id': v.id,
            'product_id': v.product_id,
            'product_name': v.product.product_name,
            'sku': v.sku,
            'color': v.color,
            'size': v.size,
            'category_id': v.product.category_id,
            'category_name': v.product.category.name if v.product.category else 'Uncategorized',
            'stock': v.stock,
            'min_stock': v.min_stock,
            'cost_price': cost,
            'selling_price': price,
            'total_qty': total_qty,
            'total_revenue': total_revenue,
            'profit': total_revenue - (total_qty * cost),
            'last_sale_date': last_sale,
            'current_month_qty': curr_qty,
            'current_month_revenue': curr_rev,
            'prev_month_qty': prev_qty,
            'prev_month_revenue': prev_rev,
        }

    # Growth percentage
    for d in vdata.values():
        if d['prev_month_qty'] > 0:
            d['growth_percent'] = round(((d['current_month_qty'] - d['prev_month_qty']) / d['prev_month_qty']) * 100, 1)
        elif d['current_month_qty'] > 0:
            d['growth_percent'] = 100.0
        else:
            d['growth_percent'] = 0.0

    days_in_period = max((end_date - start_date).days, 1)

    # Days remaining for stock-out
    for d in vdata.values():
        daily_sales = d['total_qty'] / days_in_period
        d['avg_daily_sales'] = round(daily_sales, 2)
        d['avg_monthly_sales'] = round(daily_sales * 30, 1)
        d['days_remaining'] = round(d['stock'] / daily_sales) if daily_sales > 0 else 999
        d['months_remaining'] = round(d['stock'] / d['avg_monthly_sales'], 1) if d['avg_monthly_sales'] > 0 else 999

    # Days unsold (for dead stock)
    for d in vdata.values():
        d['days_unsold'] = (now - d['last_sale_date']).days if d['last_sale_date'] else (now - start_date).days

    # --- Summary Cards ---
    best_seller = max(vdata.values(), key=lambda x: x['total_qty'])

    growing_list = [d for d in vdata.values() if d['current_month_qty'] > 0]
    fastest_growing = max(growing_list, key=lambda x: x['growth_percent']) if growing_list else None

    slow_list = [d for d in vdata.values() if d['stock'] > 0 and d['total_qty'] <= max(d['stock'] * 0.1, 2)]
    slow_moving = max(slow_list, key=lambda x: x['stock']) if slow_list else None

    overstocked_list = [
        d for d in vdata.values()
        if d['stock'] > d['min_stock'] * 3 and d['avg_monthly_sales'] > 0 and d['months_remaining'] >= 6
    ]
    overstocked_item = max(overstocked_list, key=lambda x: x['stock']) if overstocked_list else None

    highest_profit = max(vdata.values(), key=lambda x: x['profit'])

    cat_revenue = {}
    for d in vdata.values():
        cat = d['category_name']
        cat_revenue[cat] = cat_revenue.get(cat, 0) + d['total_revenue']
    highest_rev_cat_name = max(cat_revenue, key=cat_revenue.get) if cat_revenue else None

    stock_out_list = [d for d in vdata.values() if 0 < d.get('days_remaining', 999) <= 30 and d['stock'] > 0]
    stock_out_risk = min(stock_out_list, key=lambda x: x['days_remaining']) if stock_out_list else None

    dead_list = [
        d for d in vdata.values()
        if d['stock'] > 0 and (d['last_sale_date'] is None or d['days_unsold'] > 90)
    ]
    dead_stock_item = max(dead_list, key=lambda x: x['days_unsold']) if dead_list else None

    # --- Best Sellers (Top 10) ---
    sorted_by_qty = sorted(vdata.values(), key=lambda x: x['total_qty'], reverse=True)
    best_sellers = []
    for d in sorted_by_qty[:10]:
        best_sellers.append({
            'product_name': d['product_name'],
            'sku': d['sku'],
            'category': d['category_name'],
            'units_sold': d['total_qty'],
            'revenue': round(d['total_revenue'], 2),
            'profit': round(d['profit'], 2),
        })

    # --- Fastest Growing ---
    sorted_by_growth = sorted(growing_list, key=lambda x: x['growth_percent'], reverse=True) if growing_list else []
    fastest_growing_list = []
    for d in sorted_by_growth[:10]:
        fastest_growing_list.append({
            'product_name': d['product_name'],
            'sku': d['sku'],
            'growth_percent': d['growth_percent'],
            'prev_month': d['prev_month_qty'],
            'current_month': d['current_month_qty'],
        })

    # --- Slow Moving ---
    sorted_slow = sorted(slow_list, key=lambda x: x['stock'], reverse=True) if slow_list else []
    slow_moving_list = []
    for d in sorted_slow[:10]:
        slow_moving_list.append({
            'product_name': d['product_name'],
            'sku': d['sku'],
            'last_sold_date': d['last_sale_date'].isoformat() if d['last_sale_date'] else None,
            'days_without_sale': d['days_unsold'],
            'current_stock': d['stock'],
            'recommendation': f"Low sales velocity — only {d['total_qty']} units sold in the period. Consider promotional pricing or bundle offers.",
        })

    # --- Overstock Analysis ---
    overstock_analysis_list = []
    for d in overstocked_list[:10]:
        overstock_analysis_list.append({
            'product_name': d['product_name'],
            'sku': d['sku'],
            'current_stock': d['stock'],
            'avg_monthly_sales': d['avg_monthly_sales'],
            'months_remaining': d['months_remaining'],
            'recommendation': 'Reduce purchasing, offer discounts, or create bundle promotions to clear excess inventory.',
        })

    # --- Dead Stock ---
    dead_stock_list = []
    for d in sorted(dead_list, key=lambda x: x['days_unsold'], reverse=True)[:10]:
        dead_stock_list.append({
            'product_name': d['product_name'],
            'sku': d['sku'],
            'days_unsold': d['days_unsold'],
            'stock_value': round(d['stock'] * d['cost_price'], 2),
            'recommendation': f"Consider clearance discounts, donation, or write-off. No sales in {d['days_unsold']} days.",
        })

    # --- Category Insights ---
    cat_data = {}
    for d in vdata.values():
        cat = d['category_name']
        if cat not in cat_data:
            cat_data[cat] = {'total_revenue': 0, 'total_profit': 0, 'prev_month_rev': 0, 'current_month_rev': 0, 'stock_value': 0}
        cat_data[cat]['total_revenue'] += d['total_revenue']
        cat_data[cat]['total_profit'] += d['profit']
        cat_data[cat]['prev_month_rev'] += d['prev_month_revenue']
        cat_data[cat]['current_month_rev'] += d['current_month_revenue']
        cat_data[cat]['stock_value'] += d['stock'] * d['cost_price']

    category_insights = []
    for name, cd in cat_data.items():
        growth = _safe_div(cd['current_month_rev'] - cd['prev_month_rev'], cd['prev_month_rev']) * 100
        category_insights.append({
            'category_name': name,
            'total_revenue': round(cd['total_revenue'], 2),
            'total_profit': round(cd['total_profit'], 2),
            'sales_growth': round(growth, 1),
            'stock_value': round(cd['stock_value'], 2),
        })
    category_insights.sort(key=lambda x: x['total_revenue'], reverse=True)

    # --- AI Recommendations ---
    recommendations = []

    if best_seller['total_qty'] > 0:
        recommendations.append({
            'type': 'top_performer',
            'message': f"{best_seller['product_name']} is the best-selling product with {best_seller['total_qty']} units sold, generating ₹{best_seller['total_revenue']:,.2f} in revenue.",
            'severity': 'success',
        })

    if fastest_growing and fastest_growing['growth_percent'] > 0:
        recommendations.append({
            'type': 'fastest_growing',
            'message': f"{fastest_growing['product_name']} has experienced a {fastest_growing['growth_percent']}% increase in sales this month compared to last month.",
            'severity': 'success',
        })

    if slow_moving:
        recommendations.append({
            'type': 'slow_moving',
            'message': f"{slow_moving['product_name']} has low sales activity with only {slow_moving['total_qty']} units sold. Consider a targeted promotion.",
            'severity': 'warning',
        })

    if overstocked_item:
        recommendations.append({
            'type': 'overstocked',
            'message': f"{overstocked_item['product_name']} has {overstocked_item['stock']} units in stock — approximately {overstocked_item['months_remaining']} months of inventory. Reduce purchasing and offer discounts.",
            'severity': 'warning',
        })

    if highest_profit and highest_profit['profit'] > 0:
        recommendations.append({
            'type': 'highest_profit',
            'message': f"{highest_profit['product_name']} generates the highest profit at ₹{highest_profit['profit']:,.2f} with a {_safe_div(highest_profit['profit'], highest_profit['total_revenue']) * 100}% profit margin.",
            'severity': 'success',
        })

    if highest_rev_cat_name:
        recommendations.append({
            'type': 'top_category',
            'message': f"{highest_rev_cat_name} is the highest revenue generating category with ₹{cat_revenue[highest_rev_cat_name]:,.2f} in total revenue.",
            'severity': 'info',
        })

    if stock_out_risk:
        recommendations.append({
            'type': 'stock_out_risk',
            'message': f"{stock_out_risk['product_name']} is at risk of stock-out — only {stock_out_risk['stock']} units remaining, estimated {stock_out_risk['days_remaining']} days of inventory left.",
            'severity': 'danger',
        })

    if dead_stock_item:
        recommendations.append({
            'type': 'dead_stock',
            'message': f"{dead_stock_item['product_name']} has not been sold in {dead_stock_item['days_unsold']} days. Consider clearance pricing or bundled offers to move inventory.",
            'severity': 'warning',
        })

    recommendations.append({
        'type': 'summary',
        'message': f"Analyzed {len(variants)} product variants across {len(category_insights)} categories. {len(best_sellers)} top sellers account for the majority of revenue.",
        'severity': 'info',
    })

    # --- Chart Data ---
    top_selling_labels = [d['product_name'][:20] for d in best_sellers[:10]]
    top_selling_values = [d['units_sold'] for d in best_sellers[:10]]

    rev_cat_labels = [c['category_name'] for c in category_insights]
    rev_cat_values = [c['total_revenue'] for c in category_insights]

    profit_cat_labels = [c['category_name'] for c in category_insights]
    profit_cat_values = [c['total_profit'] for c in category_insights]

    # Monthly sales trend (last 12 months)
    monthly_trend = db.session.query(
        func.extract('year', Sale.sale_date).label('year'),
        func.extract('month', Sale.sale_date).label('month'),
        func.coalesce(func.sum(Sale.grand_total), 0).label('total')
    ).filter(
        Sale.status == 'completed',
        Sale.sale_date >= (now - timedelta(days=365))
    ).group_by(
        func.extract('year', Sale.sale_date),
        func.extract('month', Sale.sale_date)
    ).order_by(
        func.extract('year', Sale.sale_date),
        func.extract('month', Sale.sale_date)
    ).all()

    trend_labels = []
    trend_values = []
    for r in monthly_trend:
        trend_labels.append(f"{int(r.year)}-{int(r.month):02d}")
        trend_values.append(float(r.total))

    # Stock distribution by category
    stock_by_cat = {}
    for d in vdata.values():
        cat = d['category_name']
        stock_by_cat[cat] = stock_by_cat.get(cat, 0) + d['stock']

    stock_labels = list(stock_by_cat.keys())
    stock_values = list(stock_by_cat.values())

    return {
        'summary_cards': {
            'best_selling_product': {
                'product_name': best_seller['product_name'],
                'sku': best_seller['sku'],
                'units_sold': best_seller['total_qty'],
                'revenue': round(best_seller['total_revenue'], 2),
            } if best_seller['total_qty'] > 0 else None,
            'fastest_growing_product': {
                'product_name': fastest_growing['product_name'],
                'sku': fastest_growing['sku'],
                'growth_percent': fastest_growing['growth_percent'],
                'prev_month': fastest_growing['prev_month_qty'],
                'current_month': fastest_growing['current_month_qty'],
            } if fastest_growing else None,
            'slow_moving_product': {
                'product_name': slow_moving['product_name'],
                'sku': slow_moving['sku'],
                'last_sold_date': slow_moving['last_sale_date'].isoformat() if slow_moving['last_sale_date'] else None,
                'days_without_sale': slow_moving['days_unsold'],
                'current_stock': slow_moving['stock'],
                'recommendation': f"Low sales velocity — only {slow_moving['total_qty']} units sold. Consider promotional pricing.",
            } if slow_moving else None,
            'overstocked_product': {
                'product_name': overstocked_item['product_name'],
                'sku': overstocked_item['sku'],
                'current_stock': overstocked_item['stock'],
                'avg_monthly_sales': overstocked_item['avg_monthly_sales'],
                'months_remaining': overstocked_item['months_remaining'],
                'recommendation': 'Reduce purchasing, offer discounts, or create bundle promotions.',
            } if overstocked_item else None,
            'highest_profit_product': {
                'product_name': highest_profit['product_name'],
                'sku': highest_profit['sku'],
                'profit': round(highest_profit['profit'], 2),
                'margin_percent': round(_safe_div(highest_profit['profit'], highest_profit['total_revenue']) * 100, 1),
            } if highest_profit['profit'] > 0 else None,
            'highest_revenue_category': {
                'category_name': highest_rev_cat_name,
                'revenue': round(cat_revenue[highest_rev_cat_name], 2),
            } if highest_rev_cat_name else None,
            'stock_out_risk_product': {
                'product_name': stock_out_risk['product_name'],
                'sku': stock_out_risk['sku'],
                'current_stock': stock_out_risk['stock'],
                'avg_daily_sales': stock_out_risk['avg_daily_sales'],
                'days_remaining': stock_out_risk['days_remaining'],
            } if stock_out_risk else None,
            'dead_stock_product': {
                'product_name': dead_stock_item['product_name'],
                'sku': dead_stock_item['sku'],
                'days_unsold': dead_stock_item['days_unsold'],
                'stock_value': round(dead_stock_item['stock'] * dead_stock_item['cost_price'], 2),
                'recommendation': f"Consider clearance discounts or write-off. No sales in {dead_stock_item['days_unsold']} days.",
            } if dead_stock_item else None,
        },
        'best_sellers': best_sellers,
        'fastest_growing': fastest_growing_list,
        'slow_moving': slow_moving_list,
        'overstock_analysis': overstock_analysis_list,
        'dead_stock': dead_stock_list,
        'category_insights': category_insights,
        'ai_recommendations': recommendations,
        'chart_data': {
            'top_selling_products': {'labels': top_selling_labels, 'values': top_selling_values},
            'revenue_by_category': {'labels': rev_cat_labels, 'values': rev_cat_values},
            'profit_by_category': {'labels': profit_cat_labels, 'values': profit_cat_values},
            'sales_growth_trend': {'labels': trend_labels, 'values': trend_values},
            'stock_distribution': {'labels': stock_labels, 'values': stock_values},
        },
        'generated_at': now.isoformat(),
        'filtered': filtered,
    }


def _empty_result(now, filtered):
    return {
        'summary_cards': {
            'best_selling_product': None,
            'fastest_growing_product': None,
            'slow_moving_product': None,
            'overstocked_product': None,
            'highest_profit_product': None,
            'highest_revenue_category': None,
            'stock_out_risk_product': None,
            'dead_stock_product': None,
        },
        'best_sellers': [],
        'fastest_growing': [],
        'slow_moving': [],
        'overstock_analysis': [],
        'dead_stock': [],
        'category_insights': [],
        'ai_recommendations': [{'type': 'info', 'message': 'No data available for the selected filters.', 'severity': 'info'}],
        'chart_data': {
            'top_selling_products': {'labels': [], 'values': []},
            'revenue_by_category': {'labels': [], 'values': []},
            'profit_by_category': {'labels': [], 'values': []},
            'sales_growth_trend': {'labels': [], 'values': []},
            'stock_distribution': {'labels': [], 'values': []},
        },
        'generated_at': now.isoformat(),
        'filtered': filtered,
    }
