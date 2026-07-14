from app import db
from app.models.product_variant import ProductVariant
from app.models.sale import SaleItem, Sale
from app.models.supplier import Supplier
from datetime import datetime, timedelta
from sqlalchemy import func
import math

LEAD_TIME_DAYS = 14
SAFETY_STOCK_DAYS = 7
LOOKBACK_DAYS = 90


def _calculate_trend(variant_id, lookback_date, now):
    """Determine sales trend (Increasing/Stable/Decreasing) and confidence score."""
    midpoint = lookback_date + (now - lookback_date) / 2

    older = db.session.query(func.sum(SaleItem.quantity).label('qty')).join(Sale).filter(
        SaleItem.variant_id == variant_id,
        Sale.status == 'completed',
        Sale.sale_date >= lookback_date,
        Sale.sale_date < midpoint
    ).scalar() or 0

    recent = db.session.query(func.sum(SaleItem.quantity).label('qty')).join(Sale).filter(
        SaleItem.variant_id == variant_id,
        Sale.status == 'completed',
        Sale.sale_date >= midpoint,
        Sale.sale_date <= now
    ).scalar() or 0

    days_total = (now - lookback_date).days
    half = days_total / 2
    older_avg = older / half if half > 0 else 0
    recent_avg = recent / half if half > 0 else 0

    total_sold = older + recent

    # Confidence: based on data volume and consistency
    if total_sold == 0:
        trend = 'Stable'
        confidence = 30
    elif recent_avg > older_avg * 1.1:
        trend = 'Increasing'
        confidence = min(95, 50 + int(total_sold / 2))
    elif recent_avg < older_avg * 0.9:
        trend = 'Decreasing'
        confidence = min(95, 50 + int(total_sold / 2))
    else:
        trend = 'Stable'
        confidence = min(90, 40 + int(total_sold / 2))

    return trend, confidence


def _generate_explanation(variant, daily_avg, days_remaining, priority, suggested_order, trend):
    """Generate a readable AI explanation for the recommendation."""
    product_name = variant.product.product_name if variant.product else 'Unknown'
    stock = variant.stock
    min_stock = variant.min_stock

    if daily_avg <= 0:
        return (
            f"{product_name} has {stock} units in stock (minimum: {min_stock}). "
            f"No recent sales data is available for this item. "
            f"Consider ordering {suggested_order} units to maintain adequate inventory levels."
        )

    if days_remaining is not None and days_remaining < 0:
        days_remaining = 0

    if priority == 'high':
        if days_remaining is not None and days_remaining <= 3:
            return (
                f"CRITICAL — {product_name} has only {stock} units left, which is below the configured "
                f"minimum stock level of {min_stock}. Based on recent sales averaging {daily_avg:.1f} units "
                f"per day, inventory is expected to run out within approximately {days_remaining} days. "
                f"Immediate reordering of {suggested_order} units is strongly recommended to prevent stockouts."
            )
        return (
            f"{product_name} current stock ({stock} units) is below the configured minimum stock level "
            f"({min_stock} units). With average daily sales of {daily_avg:.1f} units, "
            f"inventory is expected to last approximately {days_remaining} days. "
            f"Reordering {suggested_order} units now is recommended to maintain sufficient stock."
        )

    if priority == 'medium':
        return (
            f"{product_name} has {stock} units in stock, approaching the minimum threshold of {min_stock} units. "
            f"At the current sales rate of {daily_avg:.1f} units per day, "
            f"inventory is expected to last approximately {days_remaining} days. "
            f"Reordering {suggested_order} units is recommended to avoid potential stockouts."
        )

    return (
        f"{product_name} currently has {stock} units in stock, which is above the minimum level "
        f"of {min_stock} units. With average daily sales of {daily_avg:.1f} units, "
        f"inventory is expected to last approximately {days_remaining} days. "
        f"Consider ordering {suggested_order} units as part of routine replenishment."
    )


def get_recommendations():
    now = datetime.utcnow()
    lookback_date = now - timedelta(days=LOOKBACK_DAYS)

    # Aggregate sales per variant in lookback period
    sales_data = {}
    rows = db.session.query(
        SaleItem.variant_id,
        func.sum(SaleItem.quantity).label('total_qty')
    ).join(Sale).filter(
        SaleItem.variant_id.isnot(None),
        Sale.status == 'completed',
        Sale.sale_date >= lookback_date
    ).group_by(SaleItem.variant_id).all()

    for r in rows:
        sales_data[r.variant_id] = int(r.total_qty)

    variants = ProductVariant.query.join(
        ProductVariant.product
    ).filter(
        ProductVariant.stock >= 0
    ).all()

    recommendations = []

    for v in variants:
        total_sold = sales_data.get(v.id, 0)
        daily_avg = total_sold / LOOKBACK_DAYS if total_sold > 0 else 0
        monthly_avg = daily_avg * 30

        days_remaining = int(v.stock / daily_avg) if daily_avg > 0 else 999

        # Priority level
        if v.stock <= v.min_stock or (daily_avg > 0 and days_remaining < 7):
            priority = 'high'
            reason = f'Stock ({v.stock}) is at or below minimum ({v.min_stock}).'
            if daily_avg > 0 and days_remaining < 7:
                reason += f' Only ~{days_remaining} days of stock left at current sales rate.'
        elif v.stock <= v.min_stock * 2 or (daily_avg > 0 and days_remaining < 30):
            priority = 'medium'
            reason = f'Stock ({v.stock}) is approaching minimum ({v.min_stock}).'
            if daily_avg > 0 and days_remaining < 30:
                reason += f' Estimated ~{days_remaining} days remaining.'
        else:
            priority = 'low'
            reason = f'Sufficient stock ({v.stock}) above minimum ({v.min_stock}).'

        # Suggested reorder quantity
        if daily_avg > 0:
            suggested_order = max(
                0,
                int((monthly_avg * (LEAD_TIME_DAYS / 30)) + (daily_avg * SAFETY_STOCK_DAYS) - v.stock)
            )
            if suggested_order < v.min_stock and v.stock < v.min_stock:
                suggested_order = v.min_stock * 2
        else:
            # No sales data — recommend based on min_stock
            suggested_order = max(0, v.min_stock * 2 - v.stock)

        # Trend and confidence
        trend, confidence = _calculate_trend(v.id, lookback_date, now)
        explanation = _generate_explanation(v, daily_avg, days_remaining, priority, suggested_order, trend)

        product = v.product
        recommendations.append({
            'variant_id': v.id,
            'product_name': product.product_name if product else 'Unknown',
            'sku': v.sku,
            'color': v.color,
            'size': v.size,
            'category': product.category.name if product and product.category else None,
            'current_stock': v.stock,
            'min_stock': v.min_stock,
            'avg_daily_sales': round(daily_avg, 2),
            'avg_monthly_sales': round(monthly_avg, 1),
            'days_remaining': days_remaining if daily_avg > 0 else None,
            'priority': priority,
            'suggested_reorder_qty': suggested_order,
            'reason': reason,
            'explanation': explanation,
            'confidence_score': confidence,
            'sales_trend': trend,
        })

    # Sort: high first, then medium, then low
    priority_order = {'high': 0, 'medium': 1, 'low': 2}
    recommendations.sort(key=lambda r: (priority_order.get(r['priority'], 9), r['days_remaining'] or 999))

    # Categorize
    high = [r for r in recommendations if r['priority'] == 'high']
    medium = [r for r in recommendations if r['priority'] == 'medium']
    low = [r for r in recommendations if r['priority'] == 'low']

    # Summary metrics
    healthy_count = sum(1 for r in recommendations if r['current_stock'] >= r['min_stock'])
    total_variants = len(variants)
    inventory_health_pct = round(healthy_count / total_variants * 100) if total_variants > 0 else 100

    trend_counts = {}
    for r in recommendations:
        if r['confidence_score'] > 30:
            trend_counts[r['sales_trend']] = trend_counts.get(r['sales_trend'], 0) + 1
    dominant_trend = max(trend_counts, key=trend_counts.get) if trend_counts else 'Stable'

    active = Supplier.query.filter_by(status='active').count()
    inactive = Supplier.query.filter_by(status='inactive').count()
    total_sup = active + inactive
    if total_sup == 0:
        supplier_risk = 'Low'
    elif inactive / total_sup >= 0.3:
        supplier_risk = 'High'
    elif inactive / total_sup >= 0.1:
        supplier_risk = 'Medium'
    else:
        supplier_risk = 'Low'

    return {
        'recommendations': recommendations[:50],
        'high_priority': high,
        'medium_priority': medium,
        'safe_items': low,
        'generated_at': now.isoformat(),
        'lookback_days': LOOKBACK_DAYS,
        'lead_time_days': LEAD_TIME_DAYS,
        'total_analyzed': len(variants),
        'inventory_health_percent': inventory_health_pct,
        'supplier_risk': supplier_risk,
        'dominant_trend': dominant_trend,
    }


def get_recommendation_detail(variant_id):
    """Return a single detailed recommendation for a specific variant."""
    now = datetime.utcnow()
    lookback_date = now - timedelta(days=LOOKBACK_DAYS)

    v = ProductVariant.query.get(variant_id)
    if not v:
        return None

    total_sold = db.session.query(func.sum(SaleItem.quantity).label('qty')).join(Sale).filter(
        SaleItem.variant_id == v.id,
        Sale.status == 'completed',
        Sale.sale_date >= lookback_date
    ).scalar() or 0

    daily_avg = total_sold / LOOKBACK_DAYS if total_sold > 0 else 0
    monthly_avg = daily_avg * 30
    days_remaining = int(v.stock / daily_avg) if daily_avg > 0 else 999

    # Priority
    if v.stock <= v.min_stock or (daily_avg > 0 and days_remaining < 7):
        priority = 'high'
    elif v.stock <= v.min_stock * 2 or (daily_avg > 0 and days_remaining < 30):
        priority = 'medium'
    else:
        priority = 'low'

    # Suggested reorder
    if daily_avg > 0:
        suggested_order = max(
            0,
            int((monthly_avg * (LEAD_TIME_DAYS / 30)) + (daily_avg * SAFETY_STOCK_DAYS) - v.stock)
        )
        if suggested_order < v.min_stock and v.stock < v.min_stock:
            suggested_order = v.min_stock * 2
    else:
        suggested_order = max(0, v.min_stock * 2 - v.stock)

    trend, confidence = _calculate_trend(v.id, lookback_date, now)
    explanation = _generate_explanation(v, daily_avg, days_remaining, priority, suggested_order, trend)

    product = v.product
    return {
        'variant_id': v.id,
        'product_name': product.product_name if product else 'Unknown',
        'sku': v.sku,
        'color': v.color,
        'size': v.size,
        'category': product.category.name if product and product.category else None,
        'current_stock': v.stock,
        'min_stock': v.min_stock,
        'avg_daily_sales': round(daily_avg, 2),
        'avg_monthly_sales': round(monthly_avg, 1),
        'days_remaining': days_remaining if daily_avg > 0 else None,
        'priority': priority,
        'suggested_reorder_qty': suggested_order,
        'explanation': explanation,
        'confidence_score': confidence,
        'sales_trend': trend,
    }
