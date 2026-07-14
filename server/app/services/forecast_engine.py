from app import db
from app.models.product_variant import ProductVariant
from app.models.product import Product
from app.models.sale import SaleItem, Sale
from datetime import datetime, timedelta
from sqlalchemy import func

FORECAST_LOOKBACK_DAYS = 90


def _daily_sales_series(variant_id, start_date, end_date):
    """Return a list of {date, qty} for each day in range for this variant."""
    rows = db.session.query(
        func.date(Sale.sale_date).label('day'),
        func.sum(SaleItem.quantity).label('qty')
    ).join(Sale).filter(
        SaleItem.variant_id == variant_id,
        Sale.status == 'completed',
        Sale.sale_date >= start_date,
        Sale.sale_date < end_date
    ).group_by(func.date(Sale.sale_date)).order_by(func.date(Sale.sale_date)).all()

    lookup = {str(r.day): int(r.qty) for r in rows}
    series = []
    d = start_date
    while d < end_date:
        series.append(int(lookup.get(str(d.date()), 0)))
        d += timedelta(days=1)
    return series


def get_forecasts(category_id=None, product_id=None, date_from=None, date_to=None):
    now = datetime.utcnow()
    lookback = now - timedelta(days=FORECAST_LOOKBACK_DAYS)
    lookback_60 = now - timedelta(days=60)
    lookback_30 = now - timedelta(days=30)

    query = ProductVariant.query.join(Product).filter(ProductVariant.stock >= 0)
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if product_id:
        query = query.filter(ProductVariant.product_id == product_id)

    variants = query.all()

    results = []

    for v in variants:
        total_sold_90 = db.session.query(func.sum(SaleItem.quantity)).join(Sale).filter(
            SaleItem.variant_id == v.id,
            Sale.status == 'completed',
            Sale.sale_date >= lookback
        ).scalar() or 0

        total_sold_60 = db.session.query(func.sum(SaleItem.quantity)).join(Sale).filter(
            SaleItem.variant_id == v.id,
            Sale.status == 'completed',
            Sale.sale_date >= lookback_60
        ).scalar() or 0

        product = v.product

        if total_sold_90 == 0:
            results.append({
                'variant_id': v.id,
                'product_id': v.product_id,
                'product_name': product.product_name if product else 'Unknown',
                'sku': v.sku,
                'color': v.color,
                'size': v.size,
                'category': product.category.name if product and product.category else None,
                'category_id': product.category_id if product else None,
                'current_stock': v.stock,
                'min_stock': v.min_stock,
                'avg_daily_sales': 0,
                'avg_weekly_sales': 0,
                'avg_monthly_sales': 0,
                'demand_7_days': None,
                'demand_30_days': None,
                'suggested_production_qty': 0,
                'suggested_reorder_qty': max(0, v.min_stock * 2 - v.stock),
                'sales_trend': 'Stable',
                'confidence_score': 10,
                'risk_level': 'Low Risk',
                'insufficient_data': True,
                'chart_labels': [],
                'chart_actual': [],
                'chart_predicted': [],
                'explanation': f"Not enough historical data for {product.product_name if product else v.sku}."
            })
            continue

        daily_avg = total_sold_90 / FORECAST_LOOKBACK_DAYS
        weekly_avg = daily_avg * 7
        monthly_avg = daily_avg * 30

        # Trend calculation (compare recent 30d vs older 60d)
        recent_30 = total_sold_60  # actually this is the last 60 days total... let me recalculate

        # Recent 30 days
        recent_30_total = db.session.query(func.sum(SaleItem.quantity)).join(Sale).filter(
            SaleItem.variant_id == v.id,
            Sale.status == 'completed',
            Sale.sale_date >= lookback_30
        ).scalar() or 0
        recent_30_avg = recent_30_total / 30

        # Older 30-90 days
        older_60_total = total_sold_90 - recent_30_total  # days 31-90
        older_60_avg = older_60_total / 60

        if recent_30_avg > older_60_avg * 1.1:
            trend = 'Increasing'
            trend_factor = 1.15
        elif recent_30_avg < older_60_avg * 0.9:
            trend = 'Decreasing'
            trend_factor = 0.85
        else:
            trend = 'Stable'
            trend_factor = 1.0

        # Predicted demand
        demand_7 = round(daily_avg * 7 * trend_factor)
        demand_30 = round(daily_avg * 30 * trend_factor)

        # Suggested quantities
        suggested_production = max(0, demand_30 - v.stock)
        suggested_reorder = max(0, demand_30 + (daily_avg * 7) - v.stock)

        # Confidence
        if total_sold_90 >= 200:
            confidence = 90
        elif total_sold_90 >= 100:
            confidence = 75
        elif total_sold_90 >= 50:
            confidence = 60
        elif total_sold_90 >= 20:
            confidence = 45
        else:
            confidence = 30

        if trend == 'Stable':
            confidence = min(95, confidence + 5)
        elif trend == 'Increasing':
            confidence = min(90, confidence + 2)

        # Risk level based on stock vs predicted demand
        if v.stock < demand_30 * 0.3:
            risk = 'High Risk'
        elif v.stock < demand_30:
            risk = 'Medium Risk'
        else:
            risk = 'Low Risk'

        # Chart data: last 30 days actual + next 30 days predicted
        chart_actual = _daily_sales_series(v.id, lookback_30, now)
        chart_labels = []
        chart_predicted = []

        d = lookback_30
        for _ in range(30):
            chart_labels.append(d.strftime('%b %d'))
            d += timedelta(days=1)

        predicted_daily = round(daily_avg * trend_factor, 2)
        for i in range(30):
            chart_predicted.append(round(predicted_daily))

        # Pad actual to exactly 30 entries
        while len(chart_actual) < 30:
            chart_actual.insert(0, 0)
        chart_actual = chart_actual[-30:]

        explanation = (
            f"Based on the previous {FORECAST_LOOKBACK_DAYS} days of sales data, "
            f"{product.product_name if product else 'this product'} is "
            f"{'trending upward' if trend == 'Increasing' else 'trending downward' if trend == 'Decreasing' else 'stable'} "
            f"with average daily sales of {daily_avg:.1f} units. "
            f"Expected demand over the next 30 days is approximately {demand_30} units. "
            f"{'Current inventory may be insufficient to meet predicted demand.' if v.stock < demand_30 else 'Current inventory appears sufficient for the forecasted period.'}"
        )

        results.append({
            'variant_id': v.id,
            'product_id': v.product_id,
            'product_name': product.product_name if product else 'Unknown',
            'sku': v.sku,
            'color': v.color,
            'size': v.size,
            'category': product.category.name if product and product.category else None,
            'category_id': product.category_id if product else None,
            'current_stock': v.stock,
            'min_stock': v.min_stock,
            'avg_daily_sales': round(daily_avg, 2),
            'avg_weekly_sales': round(weekly_avg, 1),
            'avg_monthly_sales': round(monthly_avg, 1),
            'demand_7_days': demand_7,
            'demand_30_days': demand_30,
            'suggested_production_qty': suggested_production,
            'suggested_reorder_qty': suggested_reorder,
            'sales_trend': trend,
            'confidence_score': confidence,
            'risk_level': risk,
            'insufficient_data': False,
            'chart_labels': chart_labels,
            'chart_actual': chart_actual,
            'chart_predicted': chart_predicted,
            'explanation': explanation,
        })

    return {
        'forecasts': results,
        'total_analyzed': len(variants),
        'generated_at': now.isoformat(),
        'lookback_days': FORECAST_LOOKBACK_DAYS,
    }
