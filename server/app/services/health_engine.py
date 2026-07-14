from app import db
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.sale import Sale, SaleItem
from app.models.category import Category
from datetime import datetime, timedelta
from sqlalchemy import func

DEFAULT_WEIGHTS = {
    'stock_availability': 25,
    'low_stock_risk': 20,
    'overstock_level': 15,
    'dead_stock': 15,
    'sales_performance': 10,
    'inventory_turnover': 10,
    'forecast_confidence': 5,
}


def _safe_div(a, b):
    return a / b if b else 0


def _get_health_status(score):
    if score >= 90:
        return 'Excellent'
    if score >= 75:
        return 'Good'
    if score >= 60:
        return 'Fair'
    return 'Poor'


def _compute_health_at(now, lookback_days, variants, variant_ids, weights):
    start = now - timedelta(days=lookback_days)
    n = len(variants)

    if n == 0:
        return {
            'overall_score': 0,
            'health_status': 'Poor',
            'factors': {k: {'score': 0, 'weight': v} for k, v in weights.items()},
        }

    # Sales data in period
    sale_rows = db.session.query(
        SaleItem.variant_id,
        func.coalesce(func.sum(SaleItem.quantity), 0).label('total_qty'),
        func.coalesce(func.sum(SaleItem.total_price), 0).label('total_revenue'),
        func.max(Sale.sale_date).label('last_sale_date'),
    ).join(Sale).filter(
        Sale.status == 'completed',
        SaleItem.variant_id.in_(variant_ids),
        Sale.sale_date >= start,
        Sale.sale_date <= now,
    ).group_by(SaleItem.variant_id).all()

    sale_map = {r.variant_id: r for r in sale_rows}

    # Inventory value calculation
    total_stock_value = db.session.query(
        func.coalesce(func.sum(ProductVariant.stock * func.coalesce(ProductVariant.cost_price, 0)), 0)
    ).filter(
        ProductVariant.id.in_(variant_ids)
    ).scalar()
    total_stock_value = float(total_stock_value)

    # --- Factor scores ---
    # 1. Stock Availability
    adequately_stocked = 0
    for v in variants:
        if v.stock >= v.min_stock:
            adequately_stocked += 1
    stock_avail_score = _safe_div(adequately_stocked, n) * 100

    # 2. Low Stock Risk
    low_stock_count = 0
    for v in variants:
        s = sale_map.get(v.id)
        qty = float(s.total_qty) if s else 0
        if qty > 0 and v.stock > 0 and v.stock <= v.min_stock:
            low_stock_count += 1
    low_stock_score = (1 - _safe_div(low_stock_count, n)) * 100

    # 3. Overstock Level
    overstocked_count = 0
    for v in variants:
        s = sale_map.get(v.id)
        qty = float(s.total_qty) if s else 0
        days = max(lookback_days, 1)
        monthly_sales = qty / days * 30 if qty > 0 else 0
        threshold = max(v.min_stock * 5, 50)
        if v.stock > threshold and monthly_sales < v.stock / 6:
            overstocked_count += 1
    overstock_score = (1 - _safe_div(overstocked_count, n)) * 100

    # 4. Dead Stock
    dead_stock_count = 0
    dead_stock_value = 0
    for v in variants:
        s = sale_map.get(v.id)
        last_sale = s.last_sale_date if s else None
        if v.stock > 0 and (last_sale is None or (now - last_sale).days > 90):
            dead_stock_count += 1
            dead_stock_value += v.stock * float(v.cost_price or 0)
    dead_stock_score = (1 - _safe_div(dead_stock_count, n)) * 100

    # 5. Sales Performance (revenue relative to stock value)
    total_revenue = sum(float(s.total_revenue) for s in sale_rows)
    sales_perf_score = min(_safe_div(total_revenue, max(total_stock_value, 1)) * 100, 100)

    # 6. Inventory Turnover
    cogs = sum(
        float(s.total_qty) * float(
            next((v.cost_price or 0) for v in variants if v.id == s.variant_id)
        ) for s in sale_rows
    )
    avg_inventory = max(total_stock_value, 1)
    turnover_ratio = _safe_div(cogs, avg_inventory) * (365 / max(lookback_days, 1))
    turnover_score = min(turnover_ratio * 20, 100)

    # 7. Forecast Confidence (based on data volume)
    variants_with_data = sum(1 for v in variants if sale_map.get(v.id) and float(sale_map[v.id].total_qty) > 0)
    data_coverage = _safe_div(variants_with_data, n)
    forecast_conf_score = min(data_coverage * 100 + 20, 100)

    factors = {
        'stock_availability': {'score': round(stock_avail_score, 1), 'weight': weights['stock_availability']},
        'low_stock_risk': {'score': round(low_stock_score, 1), 'weight': weights['low_stock_risk']},
        'overstock_level': {'score': round(overstock_score, 1), 'weight': weights['overstock_level']},
        'dead_stock': {'score': round(dead_stock_score, 1), 'weight': weights['dead_stock']},
        'sales_performance': {'score': round(sales_perf_score, 1), 'weight': weights['sales_performance']},
        'inventory_turnover': {'score': round(turnover_score, 1), 'weight': weights['inventory_turnover']},
        'forecast_confidence': {'score': round(forecast_conf_score, 1), 'weight': weights['forecast_confidence']},
    }

    overall = sum(v['score'] * v['weight'] / 100 for v in factors.values())
    overall = round(overall, 1)

    return {
        'overall_score': overall,
        'health_status': _get_health_status(overall),
        'factors': factors,
        'low_stock_count': low_stock_count,
        'overstocked_count': overstocked_count,
        'dead_stock_count': dead_stock_count,
        'dead_stock_value': round(dead_stock_value, 2),
        'adequately_stocked': adequately_stocked,
        'total_revenue': round(total_revenue, 2),
        'total_stock_value': round(total_stock_value, 2),
        'turnover_ratio': round(turnover_ratio, 2),
        'data_coverage': round(data_coverage * 100, 1),
        'variants_with_data': variants_with_data,
    }


def get_health(category_id=None, supplier_id=None, date_from=None, date_to=None):
    now = datetime.utcnow()

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
    n = len(variants)

    filtered = bool(category_id or supplier_id or date_from or date_to)

    if n == 0:
        return _empty_result(now, filtered, DEFAULT_WEIGHTS)

    weights = DEFAULT_WEIGHTS

    if date_from:
        start_date = datetime.fromisoformat(date_from)
    else:
        start_date = now - timedelta(days=365)

    if date_to:
        end_date = datetime.fromisoformat(date_to)
    else:
        end_date = now

    # Compute current health with custom date range
    current_lookback = (end_date - start_date).days or 1
    current = _compute_health_at(end_date, current_lookback, variants, variant_ids, weights)

    # Compute weekly trend data (last 12 weeks)
    trend_labels = []
    trend_values = []
    for week in range(11, -1, -1):
        week_date = now - timedelta(weeks=week, days=now.weekday())
        week_lookback = min((now - week_date).days, 1)
        if week_lookback < 7:
            week_lookback = 7
        res = _compute_health_at(week_date, week_lookback, variants, variant_ids, weights)
        trend_labels.append(week_date.strftime('%b %d'))
        trend_values.append(res['overall_score'])

    # Category health
    cat_variants = {}
    for v in variants:
        cat_name = v.product.category.name if v.product and v.product.category else 'Uncategorized'
        if cat_name not in cat_variants:
            cat_variants[cat_name] = []
        cat_variants[cat_name].append(v)

    category_health = []
    for cat_name, cat_v_list in cat_variants.items():
        cat_ids = [v.id for v in cat_v_list]
        cat_result = _compute_health_at(end_date, current_lookback, cat_v_list, cat_ids, weights)
        adequately = sum(1 for v in cat_v_list if v.stock >= v.min_stock)
        category_health.append({
            'category_name': cat_name,
            'score': cat_result['overall_score'],
            'health_status': cat_result['health_status'],
            'total_products': len(cat_v_list),
            'healthy': adequately,
            'at_risk': len(cat_v_list) - adequately,
        })
    category_health.sort(key=lambda x: x['score'], reverse=True)

    # Strengths
    strengths = []
    if current['factors']['inventory_turnover']['score'] >= 70:
        strengths.append(f"Strong inventory turnover ({current['turnover_ratio']}x annually)")
    if current['factors']['stock_availability']['score'] >= 80:
        strengths.append(f"Good stock availability ({current['adequately_stocked']}/{n} variants adequately stocked)")
    if current['factors']['forecast_confidence']['score'] >= 70:
        strengths.append(f"High forecast confidence ({current['data_coverage']}% data coverage)")
    if current['factors']['dead_stock']['score'] >= 85:
        strengths.append("Minimal dead stock — inventory is moving well")
    if current['factors']['overstock_level']['score'] >= 80:
        strengths.append("Healthy inventory levels with minimal overstock")
    if current['factors']['low_stock_risk']['score'] >= 80:
        strengths.append("Low risk of stock-outs across most products")
    if current['sales_performance'] if False else True:
        if current['total_revenue'] > 0:
            strengths.append(f"Positive sales revenue of Rs.{current['total_revenue']:,.0f} in the period")

    # Issues
    issues = []
    if current['low_stock_count'] > 0:
        issues.append(f"{current['low_stock_count']} products below minimum stock level — immediate reorder may be needed")
    if current['overstocked_count'] > 0:
        issues.append(f"{current['overstocked_count']} products overstocked — excess capital tied up in inventory")
    if current['dead_stock_count'] > 0:
        issues.append(f"{current['dead_stock_count']} products with no recent sales — potential dead stock valued at Rs.{current['dead_stock_value']:,.0f}")
    low_conf_cats = [c for c in category_health if c['score'] < 60]
    for cat in low_conf_cats:
        issues.append(f"{cat['category_name']} category has low health score ({cat['score']}%) — needs attention")
    if current['factors']['sales_performance']['score'] < 50:
        issues.append("Sales performance is low relative to inventory value")
    if current['factors']['inventory_turnover']['score'] < 40:
        issues.append("Inventory turnover is slow — consider demand-based purchasing")

    # Recommendations
    recommendations = []
    if current['low_stock_count'] > 0:
        low_stock_variants = [
            v for v in variants
            if v.stock > 0 and v.stock <= v.min_stock
        ]
        for v in low_stock_variants[:3]:
            recommendations.append(f"Increase stock for {v.product.product_name} ({v.sku}) — only {v.stock} units remaining")
    if current['overstocked_count'] > 0:
        over_variants = [
            v for v in variants if v.stock > max(v.min_stock * 5, 50)
        ]
        for v in over_variants[:3]:
            recommendations.append(f"Reduce purchasing of {v.product.product_name} ({v.sku}) — {v.stock} units in stock exceeds demand")
    if current['dead_stock_count'] > 0:
        recommendations.append("Launch promotions or clearance sales for slow-moving products to recover dead stock value")
    for cat in category_health:
        if cat['at_risk'] > cat['total_products'] * 0.3:
            recommendations.append(f"Review {cat['category_name']} category — {cat['at_risk']} out of {cat['total_products']} products need attention")
    if current['factors']['inventory_turnover']['score'] < 50:
        recommendations.append("Implement demand forecasting and just-in-time purchasing to improve inventory turnover")
    if strengths:
        recommendations.append(f"Maintain current inventory practices for strong areas — {strengths[0].lower() if strengths else ''}")

    recommendation_list = list(dict.fromkeys(recommendations))[:8]

    # AI Summary
    status = current['health_status']
    summary_parts = [f"Inventory health is {status.upper()}."]

    if current['adequately_stocked'] > n * 0.7:
        summary_parts.append("Most products maintain adequate stock levels.")
    else:
        summary_parts.append(f"Only {current['adequately_stocked']} out of {n} variants are adequately stocked.")

    if current['low_stock_count'] > 0:
        summary_parts.append(f"{current['low_stock_count']} product{'s' if current['low_stock_count'] != 1 else ''} require{'s' if current['low_stock_count'] == 1 else ''} immediate reorder.")
    if current['overstocked_count'] > 0:
        summary_parts.append(f"{current['overstocked_count']} product{'s' if current['overstocked_count'] != 1 else ''} {'are' if current['overstocked_count'] != 1 else 'is'} overstocked.")
    if current['dead_stock_count'] > 0:
        summary_parts.append(f"{current['dead_stock_count']} product{'s' if current['dead_stock_count'] != 1 else ''} {'have' if current['dead_stock_count'] != 1 else 'has'} not been sold recently.")

    return {
        'overall_score': current['overall_score'],
        'health_status': current['health_status'],
        'ai_summary': ' '.join(summary_parts),
        'metrics': {
            'total_products': n,
            'healthy_products': current['adequately_stocked'],
            'low_stock_products': current['low_stock_count'],
            'overstock_products': current['overstocked_count'],
            'dead_stock_products': current['dead_stock_count'],
            'forecast_accuracy': round(current['data_coverage'], 1),
            'inventory_turnover': current['turnover_ratio'],
        },
        'factors': current['factors'],
        'strengths': strengths,
        'issues': issues,
        'recommendations': recommendation_list,
        'health_trend': {
            'labels': trend_labels,
            'values': trend_values,
        },
        'category_health': category_health,
        'generated_at': now.isoformat(),
        'filtered': filtered,
    }


def _empty_result(now, filtered, weights):
    return {
        'overall_score': 0,
        'health_status': 'Poor',
        'ai_summary': 'No data available for the selected filters.',
        'metrics': {
            'total_products': 0, 'healthy_products': 0, 'low_stock_products': 0,
            'overstock_products': 0, 'dead_stock_products': 0,
            'forecast_accuracy': 0, 'inventory_turnover': 0,
        },
        'factors': {k: {'score': 0, 'weight': v} for k, v in weights.items()},
        'strengths': [],
        'issues': ['No products match the selected filters.'],
        'recommendations': ['Add inventory data to receive recommendations.'],
        'health_trend': {'labels': [], 'values': []},
        'category_health': [],
        'generated_at': now.isoformat(),
        'filtered': filtered,
    }
