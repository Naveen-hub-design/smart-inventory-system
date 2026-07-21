from app import db
from app.models.supplier import Supplier
from app.models.purchase import Purchase, PurchaseItem
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.sale import SaleItem, Sale
from datetime import datetime, timedelta
from sqlalchemy import func, case


def _safe_div(a, b):
    return a / b if b else 0


def _score_status(score):
    if score >= 90:
        return 'Excellent'
    if score >= 75:
        return 'Good'
    if score >= 60:
        return 'Average'
    return 'Poor'


def _risk_level(score):
    if score >= 80:
        return 'Low Risk'
    if score >= 60:
        return 'Medium Risk'
    return 'High Risk'


def _ranking_tier(score):
    if score >= 90:
        return 'Platinum'
    if score >= 78:
        return 'Gold'
    if score >= 62:
        return 'Silver'
    if score >= 45:
        return 'Bronze'
    return 'Needs Improvement'


def _generate_supplier_code(supplier_name, sid):
    prefix = ''.join(w[0] for w in supplier_name.split()[:3]).upper()[:4]
    return f"{prefix}{sid:04d}"


def get_supplier_intelligence(supplier_id=None, category_id=None, product_id=None,
                              date_from=None, date_to=None, performance_level=None):
    now = datetime.utcnow()
    start_date = datetime.fromisoformat(date_from) if date_from else (now - timedelta(days=365*2))
    end_date = datetime.fromisoformat(date_to) if date_to else now

    sup_query = Supplier.query
    if supplier_id:
        sup_query = sup_query.filter(Supplier.id == supplier_id)
    if product_id:
        sup_query = sup_query.join(Purchase, Purchase.supplier_id == Supplier.id).join(
            PurchaseItem, PurchaseItem.purchase_id == Purchase.id
        ).join(ProductVariant, ProductVariant.id == PurchaseItem.variant_id).filter(
            ProductVariant.product_id == product_id
        ).distinct()
    if category_id:
        sup_query = sup_query.join(Purchase, Purchase.supplier_id == Supplier.id).join(
            PurchaseItem, PurchaseItem.purchase_id == Purchase.id
        ).join(ProductVariant, ProductVariant.id == PurchaseItem.variant_id).filter(
            ProductVariant.product.has(Product.category_id == category_id)
        ).distinct()

    suppliers = sup_query.all()
    if not suppliers:
        return _empty_result(now)

    supplier_ids = [s.id for s in suppliers]

    purchase_agg = db.session.query(
        Purchase.supplier_id,
        func.count(Purchase.id).label('total_orders'),
        func.sum(Purchase.grand_total).label('total_value'),
        func.sum(case((Purchase.status == 'completed', 1), else_=0)).label('completed_orders'),
        func.sum(case((Purchase.status == 'cancelled', 1), else_=0)).label('cancelled_orders'),
        func.max(Purchase.purchase_date).label('last_order_date'),
        func.min(Purchase.purchase_date).label('first_order_date'),
    ).filter(
        Purchase.supplier_id.in_(supplier_ids),
        Purchase.purchase_date >= start_date,
        Purchase.purchase_date <= end_date,
    ).group_by(Purchase.supplier_id).all()
    pur_map = {r.supplier_id: r for r in purchase_agg}

    item_agg = db.session.query(
        Purchase.supplier_id,
        func.avg(PurchaseItem.unit_price).label('avg_unit_price'),
        func.sum(PurchaseItem.quantity).label('total_items'),
        func.count(func.distinct(PurchaseItem.variant_id)).label('unique_variants'),
    ).join(PurchaseItem, Purchase.id == PurchaseItem.purchase_id).filter(
        Purchase.supplier_id.in_(supplier_ids),
        Purchase.purchase_date >= start_date,
        Purchase.purchase_date <= end_date,
    ).group_by(Purchase.supplier_id).all()
    item_map = {r.supplier_id: r for r in item_agg}

    product_agg = db.session.query(
        Purchase.supplier_id,
        func.count(func.distinct(ProductVariant.product_id)).label('products_supplied'),
    ).join(PurchaseItem, PurchaseItem.purchase_id == Purchase.id).join(
        ProductVariant, ProductVariant.id == PurchaseItem.variant_id
    ).filter(
        Purchase.supplier_id.in_(supplier_ids),
        Purchase.purchase_date >= start_date,
        Purchase.purchase_date <= end_date,
    ).group_by(Purchase.supplier_id).all()
    prod_map = {r.supplier_id: r.products_supplied for r in product_agg}

    sup_data = {}
    for s in suppliers:
        p = pur_map.get(s.id)
        i = item_map.get(s.id)
        total_orders = int(p.total_orders) if p else 0
        completed_orders = int(p.completed_orders) if p else 0
        cancelled_orders = int(p.cancelled_orders) if p else 0
        total_value = float(p.total_value) if p and p.total_value else 0
        last_order = p.last_order_date if p else None
        first_order = p.first_order_date if p else None
        avg_price = float(i.avg_unit_price) if i and i.avg_unit_price else 0
        total_items = float(i.total_items) if i and i.total_items else 0
        unique_variants = int(i.unique_variants) if i and i.unique_variants else 0
        products_supplied = int(prod_map.get(s.id, 0))
        completion_rate = _safe_div(completed_orders, total_orders) * 100 if total_orders > 0 else 0
        days_since = (now - last_order).days if last_order else 999
        supplier_code = _generate_supplier_code(s.supplier_name, s.id)

        sup_data[s.id] = {
            'id': s.id, 'supplier_name': s.supplier_name, 'supplier_code': supplier_code,
            'status': s.status, 'contact_person': s.contact_person, 'phone': s.phone,
            'email': s.email, 'gst_number': s.gst_number,
            'total_orders': total_orders, 'total_value': round(total_value, 2),
            'completed_orders': completed_orders, 'cancelled_orders': cancelled_orders,
            'completion_rate': round(completion_rate, 1),
            'avg_unit_price': round(avg_price, 2), 'total_items': total_items,
            'unique_variants': unique_variants, 'products_supplied': products_supplied,
            'last_order_date': last_order.isoformat() if last_order else None,
            'first_order_date': first_order.isoformat() if first_order else None,
            'days_since_last_order': days_since, 'is_active': s.status == 'active',
        }

    all_prices = [d['avg_unit_price'] for d in sup_data.values() if d['avg_unit_price'] > 0]
    min_price = min(all_prices) if all_prices else 0
    max_price = max(all_prices) if all_prices else 1
    price_range = max(max_price - min_price, 0.01)
    max_orders = max((d['total_orders'] for d in sup_data.values()), default=1)
    max_value = max((d['total_value'] for d in sup_data.values()), default=1)
    max_variants = max((d['unique_variants'] for d in sup_data.values()), default=1)

    for d in sup_data.values():
        delivery_score = d['completion_rate'] * (1 - 0.2 * (2.718 ** (-d['total_orders'] / 5)))
        if d['avg_unit_price'] > 0:
            pricing_score = (1 - (d['avg_unit_price'] - min_price) / price_range) * 100
        else:
            pricing_score = 50
        completion_score = d['completion_rate']
        quality_score = min(100, _safe_div(d['unique_variants'], max_variants) * 50 + _safe_div(d['total_orders'], max_orders) * 50)
        recency_score = max(0, 100 - d['days_since_last_order'] / 3)
        volume_score = _safe_div(d['total_value'], max_value) * 100
        history_score = min(100, recency_score * 0.5 + volume_score * 0.5)
        # Return rate — inverse of cancellation ratio
        return_rate = 100 - (_safe_div(d['cancelled_orders'], max(d['total_orders'], 1)) * 100)
        # Delivery consistency — bonus for regular ordering
        delivery_consistency = min(100, _safe_div(d['total_orders'], max_orders) * 50 + max(0, 100 - d['days_since_last_order'] / 2) * 0.5)
        overall = delivery_score * 0.20 + pricing_score * 0.15 + completion_score * 0.15 + quality_score * 0.15 + history_score * 0.10 + delivery_consistency * 0.10 + return_rate * 0.15
        d['delivery_score'] = round(delivery_score, 1)
        d['pricing_score'] = round(pricing_score, 1)
        d['completion_score'] = round(completion_score, 1)
        d['quality_score'] = round(quality_score, 1)
        d['history_score'] = round(history_score, 1)
        d['return_rate'] = round(return_rate, 1)
        d['delivery_consistency'] = round(delivery_consistency, 1)
        d['overall_score'] = round(overall, 1)
        d['overall_status'] = _score_status(overall)
        d['risk_level'] = _risk_level(overall)
        d['ranking_tier'] = _ranking_tier(overall)

    if performance_level:
        filtered_ids = [sid for sid, d in sup_data.items() if d['ranking_tier'].lower() == performance_level.lower()]
        sup_data = {sid: d for sid, d in sup_data.items() if sid in filtered_ids}
        if not sup_data:
            return _empty_result(now)

    best_performer = max(sup_data.values(), key=lambda x: x['overall_score'])
    best_reliability = max(sup_data.values(), key=lambda x: x['delivery_score'])
    best_delivery = max(sup_data.values(), key=lambda x: x['completion_rate'])
    lowest_cost = min(sup_data.values(), key=lambda x: x['avg_unit_price']) if any(d['avg_unit_price'] > 0 for d in sup_data.values()) else None
    avg_rating = round(sum(d['overall_score'] for d in sup_data.values()) / len(sup_data), 1) if sup_data else 0

    total_suppliers = len(sup_data)
    active_suppliers = sum(1 for d in sup_data.values() if d['is_active'])
    preferred_suppliers = sum(1 for d in sup_data.values() if d['overall_score'] >= 78)
    high_risk_suppliers = sum(1 for d in sup_data.values() if d['risk_level'] == 'High Risk')
    avg_delivery_days = round(sum(d['days_since_last_order'] for d in sup_data.values()) / len(sup_data), 1) if sup_data else 0
    avg_order_success = round(sum(d['completion_rate'] for d in sup_data.values()) / len(sup_data), 1) if sup_data else 0
    total_purchase_value = round(sum(d['total_value'] for d in sup_data.values()), 2)
    total_items_all = sum(d['total_items'] for d in sup_data.values())
    avg_purchase_cost = round(total_purchase_value / total_items_all, 2) if total_items_all > 0 else 0

    performance_table = []
    for d in sorted(sup_data.values(), key=lambda x: x['overall_score'], reverse=True):
        # Average product cost = total value / total items
        avg_product_cost = round(_safe_div(d['total_value'], d['total_items']), 2) if d['total_items'] > 0 else 0
        performance_table.append({
            'supplier_name': d['supplier_name'],
            'supplier_code': d['supplier_code'],
            'products_supplied': d['products_supplied'],
            'total_orders': d['total_orders'],
            'completed_orders': d['completed_orders'],
            'cancelled_orders': d['cancelled_orders'],
            'total_value': d['total_value'],
            'total_items': d['total_items'],
            'avg_unit_price': d['avg_unit_price'],
            'avg_product_cost': avg_product_cost,
            'avg_delivery_time': f"{d['days_since_last_order']} days",
            'on_time_delivery': d['completion_rate'],
            'reliability_score': d['delivery_score'],
            'quality_score': d['quality_score'],
            'overall_rating': d['overall_score'],
            'risk_level': d['risk_level'],
            'ranking_tier': d['ranking_tier'],
        })

    # Best supplier recommendations per product
    variant_suppliers = db.session.query(
        PurchaseItem.variant_id, Purchase.supplier_id,
        func.avg(PurchaseItem.unit_price).label('avg_cost'),
        func.count(PurchaseItem.id).label('order_count'),
    ).join(Purchase, Purchase.id == PurchaseItem.purchase_id).filter(
        Purchase.supplier_id.in_(supplier_ids), Purchase.status == 'completed',
    ).group_by(PurchaseItem.variant_id, Purchase.supplier_id).all()

    var_sup_map = {}
    for row in variant_suppliers:
        vid = row.variant_id
        if vid not in var_sup_map:
            var_sup_map[vid] = []
        var_sup_map[vid].append({'supplier_id': row.supplier_id, 'avg_cost': float(row.avg_cost) if row.avg_cost else 0, 'order_count': int(row.order_count)})

    recommendations = []
    for vid, sup_list in var_sup_map.items():
        variant = ProductVariant.query.get(vid)
        if not variant or not variant.product:
            continue
        scored = []
        for s in sup_list:
            sd = sup_data.get(s['supplier_id'])
            if not sd:
                continue
            delivery = sd['delivery_score']
            pricing = _safe_div(min_price, max(s['avg_cost'], 0.01)) * 100 if s['avg_cost'] > 0 else 50
            score = delivery * 0.4 + pricing * 0.3 + sd['completion_score'] * 0.2 + sd['quality_score'] * 0.1
            scored.append({'supplier_id': s['supplier_id'], 'supplier_name': sd['supplier_name'],
                           'avg_cost': s['avg_cost'], 'delivery_score': delivery,
                           'pricing_score': pricing, 'overall_score': round(score, 1)})
        if not scored:
            continue
        best = max(scored, key=lambda x: x['overall_score'])
        best_sd = sup_data.get(best['supplier_id'])
        reasons = []
        if best['delivery_score'] >= 80:
            reasons.append('fastest delivery')
        if best['pricing_score'] >= 70:
            reasons.append('competitive pricing')
        if best_sd and best_sd['completion_rate'] >= 90:
            reasons.append('highly reliable')
        if not reasons:
            reasons.append('adequate performance')
        reason_str = f"Recommended for {' and '.join(reasons)}. "
        if best_sd:
            reason_str += f"{best_sd['supplier_name']} has {best_sd['completion_rate']}% order completion rate."
        recommendations.append({
            'product_name': variant.product.product_name, 'sku': variant.sku,
            'supplier_name': best['supplier_name'], 'avg_cost': best['avg_cost'],
            'delivery_days': f"{best_sd['days_since_last_order'] if best_sd else 'N/A'} days",
            'reliability': best_sd['completion_rate'] if best_sd else 0,
            'confidence': best['overall_score'], 'reason': reason_str,
        })
    recommendations.sort(key=lambda x: x['confidence'], reverse=True)

    # Purchase Recommendations — tie reorder needs with best suppliers
    low_stock_variants = ProductVariant.query.filter(
        ProductVariant.stock < ProductVariant.min_stock * 1.5
    ).order_by(ProductVariant.stock.asc()).limit(20).all()

    purchase_recommendations = []
    for v in low_stock_variants:
        if not v.product:
            continue
        candidates = var_sup_map.get(v.id, [])
        if not candidates:
            continue
        scored = []
        for s in candidates:
            sd = sup_data.get(s['supplier_id'])
            if not sd:
                continue
            p_score = _safe_div(min_price, max(s['avg_cost'], 0.01)) * 100 if s['avg_cost'] > 0 else 50
            score = sd['delivery_score'] * 0.3 + p_score * 0.25 + sd['completion_score'] * 0.2 + sd['quality_score'] * 0.15 + sd['delivery_consistency'] * 0.1
            scored.append({'supplier_id': s['supplier_id'], 'supplier_name': sd['supplier_name'],
                           'avg_cost': s['avg_cost'], 'score': round(score, 1)})
        if not scored:
            continue
        best = max(scored, key=lambda x: x['score'])
        bsd = sup_data.get(best['supplier_id'])
        shortage = v.min_stock * 2 - v.stock
        reorder_qty = max(shortage, v.min_stock)
        reasons = []
        if bsd and bsd['completion_rate'] >= 90:
            reasons.append('high reliability')
        if best['avg_cost'] <= (min_price * 1.1) and best['avg_cost'] > 0:
            reasons.append('competitive pricing')
        if bsd and bsd['days_since_last_order'] < 30:
            reasons.append('recent partnership')
        reason_str = ' and '.join(reasons) if reasons else 'adequate performance'
        purchase_recommendations.append({
            'product_name': v.product.product_name, 'sku': v.sku,
            'current_stock': v.stock, 'min_stock': v.min_stock,
            'suggested_quantity': reorder_qty,
            'suggested_supplier': best['supplier_name'],
            'estimated_cost': round(reorder_qty * best['avg_cost'], 2),
            'estimated_delivery': f"{bsd['days_since_last_order']} days" if bsd else 'N/A',
            'priority': 'High' if v.stock < v.min_stock else 'Medium',
            'confidence': best['score'],
            'reason': f"Recommended — {reason_str}. {bsd['supplier_name']} has {bsd['completion_rate']}% completion rate."
        })
    purchase_recommendations.sort(key=lambda x: x['confidence'], reverse=True)

    # AI Insights
    insights = []
    for d in sorted(sup_data.values(), key=lambda x: x['overall_score'], reverse=True)[:5]:
        if d['total_orders'] > 0:
            if d['completion_rate'] >= 95:
                insights.append({'type': 'positive', 'message': f"{d['supplier_name']} consistently delivers with a {d['completion_rate']}% order completion rate across {d['total_orders']} orders."})
            elif d['completion_rate'] < 70:
                insights.append({'type': 'negative', 'message': f"{d['supplier_name']} has a low order completion rate of {d['completion_rate']}% — consider reviewing this supplier relationship."})
    increasing = [d for d in sup_data.values() if d['days_since_last_order'] < 30 and d['total_value'] > 0]
    for d in increasing[:1]:
        insights.append({'type': 'positive', 'message': f"{d['supplier_name']} is actively used with recent orders placed in the last 30 days indicating strong ongoing partnership."})
    if lowest_cost and lowest_cost['avg_unit_price'] > 0:
        insights.append({'type': 'positive', 'message': f"{lowest_cost['supplier_name']} provides the most competitive pricing with an average cost of ₹{lowest_cost['avg_unit_price']:.2f} per unit."})
    declining = [d for d in sup_data.values() if d['days_since_last_order'] > 90 and d['total_orders'] > 0]
    for d in declining[:2]:
        insights.append({'type': 'warning', 'message': f"{d['supplier_name']} has not received any orders in {d['days_since_last_order']} days — verify if this supplier relationship is still active."})
    if best_delivery and best_delivery['days_since_last_order'] < 60:
        insights.append({'type': 'positive', 'message': f"{best_delivery['supplier_name']} is recommended for urgent purchases with consistently reliable delivery history."})
    gold_count = sum(1 for d in sup_data.values() if d['ranking_tier'] == 'Gold')
    if gold_count > 0:
        insights.append({'type': 'positive', 'message': f"{gold_count} supplier(s) achieved Gold ranking — these are your most reliable and cost-effective partners."})
    if len(sup_data) > 2 and len(increasing) > 0:
        supplier_names = ', '.join(d['supplier_name'] for d in increasing[:2])
        if supplier_names:
            insights.append({'type': 'positive', 'message': f"{supplier_names} are recommended for prioritizing in future procurement based on strong recent performance."})

    # Risk Analysis
    risk_analysis = {'high_risk': [], 'medium_risk': [], 'low_risk': []}
    for d in sup_data.values():
        item = {'supplier_name': d['supplier_name'], 'supplier_code': d['supplier_code'],
                'overall_score': d['overall_score'],
                'risk_level': d['risk_level'], 'reasons': []}
        # Late delivery
        if d['completion_rate'] < 70:
            item['reasons'].append('Late deliveries / low completion rate ({:.0f}%)'.format(d['completion_rate']))
        # Expensive
        if d['avg_unit_price'] > 0 and d['avg_unit_price'] > max_price * 0.9:
            item['reasons'].append('Higher than average costs (₹{:.2f} vs avg ₹{:.2f})'.format(d['avg_unit_price'], _safe_div(max_price + min_price, 2)))
        # Inactive
        if d['days_since_last_order'] > 180:
            item['reasons'].append('No recent orders in {} days — potentially inactive'.format(d['days_since_last_order']))
        # Low quality
        if d['quality_score'] < 50:
            item['reasons'].append('Low quality score ({:.0f}/100)'.format(d['quality_score']))
        # Low reliability
        if d['delivery_score'] < 50:
            item['reasons'].append('Low reliability score ({:.0f}/100)'.format(d['delivery_score']))
        # Limited history
        if d['total_orders'] < 2:
            item['reasons'].append('Limited purchase history — only {} order(s)'.format(d['total_orders']))
        # Cancellation risk
        if d['cancelled_orders'] > 0 and d['total_orders'] > 0:
            cancel_rate = round(d['cancelled_orders'] / d['total_orders'] * 100, 1)
            item['reasons'].append(f'{cancel_rate}% order cancellation rate ({d["cancelled_orders"]}/{d["total_orders"]} orders)')
        if not item['reasons']:
            item['reasons'].append('Performing within acceptable parameters')
        if d['risk_level'] == 'High Risk':
            risk_analysis['high_risk'].append(item)
        elif d['risk_level'] == 'Medium Risk':
            risk_analysis['medium_risk'].append(item)
        else:
            risk_analysis['low_risk'].append(item)

    # Chart Data
    perf_ranking = sorted(sup_data.values(), key=lambda x: x['overall_score'], reverse=True)
    perf_labels = [d['supplier_name'][:18] for d in perf_ranking]
    perf_values = [d['overall_score'] for d in perf_ranking]
    delivery_labels = [d['supplier_name'][:18] for d in perf_ranking]
    delivery_values = [d['completion_rate'] for d in perf_ranking]
    purchase_labels = [d['supplier_name'][:15] for d in perf_ranking]
    purchase_values = [d['total_value'] for d in perf_ranking]
    reliability_labels = [d['supplier_name'][:18] for d in perf_ranking]
    reliability_values = [d['delivery_score'] for d in perf_ranking]
    rating_dist = {'Excellent': sum(1 for d in sup_data.values() if d['overall_status'] == 'Excellent'),
                   'Good': sum(1 for d in sup_data.values() if d['overall_status'] == 'Good'),
                   'Average': sum(1 for d in sup_data.values() if d['overall_status'] == 'Average'),
                   'Poor': sum(1 for d in sup_data.values() if d['overall_status'] == 'Poor')}

    # Monthly Purchase Trend
    six_months_ago = now - timedelta(days=180)
    monthly_trend = db.session.query(
        func.strftime('%Y-%m', Purchase.purchase_date).label('month'),
        func.sum(Purchase.grand_total).label('total'),
    ).filter(
        Purchase.supplier_id.in_(supplier_ids),
        Purchase.status == 'completed',
        Purchase.purchase_date >= six_months_ago,
    ).group_by(func.strftime('%Y-%m', Purchase.purchase_date)).order_by('month').all()
    monthly_labels = []
    monthly_values = []
    d = six_months_ago.replace(day=1)
    trend_map = {r.month: float(r.total) for r in monthly_trend}
    while d <= now:
        key = d.strftime('%Y-%m')
        monthly_labels.append(d.strftime('%b %Y'))
        monthly_values.append(round(trend_map.get(key, 0), 2))
        d = (d.replace(day=28) + timedelta(days=4)).replace(day=1)

    return {
        'summary_cards': {
            'total_suppliers': total_suppliers,
            'active_suppliers': active_suppliers,
            'preferred_suppliers': preferred_suppliers,
            'high_risk_suppliers': high_risk_suppliers,
            'avg_delivery_time_days': avg_delivery_days,
            'avg_order_success_rate': avg_order_success,
            'total_purchase_value': total_purchase_value,
            'avg_purchase_cost': avg_purchase_cost,
            'best_performing_supplier': best_performer['supplier_name'] if best_performer else None,
            'best_performing_score': best_performer['overall_score'] if best_performer else 0,
            'highest_reliability_supplier': best_reliability['supplier_name'] if best_reliability else None,
            'highest_reliability_score': best_reliability['delivery_score'] if best_reliability else 0,
            'fastest_delivery_supplier': best_delivery['supplier_name'] if best_delivery else None,
            'fastest_delivery_rate': best_delivery['completion_rate'] if best_delivery else 0,
            'lowest_cost_supplier': lowest_cost['supplier_name'] if lowest_cost else None,
            'lowest_cost_value': lowest_cost['avg_unit_price'] if lowest_cost else 0,
            'average_rating': avg_rating,
        },
        'performance_table': performance_table,
        'supplier_scores': [{
            'supplier_name': d['supplier_name'], 'supplier_code': d['supplier_code'],
            'overall_score': d['overall_score'], 'overall_status': d['overall_status'],
            'ranking_tier': d['ranking_tier'],
            'delivery_score': d['delivery_score'], 'pricing_score': d['pricing_score'],
            'completion_score': d['completion_score'], 'quality_score': d['quality_score'],
            'history_score': d['history_score'], 'return_rate': d['return_rate'],
            'delivery_consistency': d['delivery_consistency'], 'risk_level': d['risk_level'],
        } for d in sorted(sup_data.values(), key=lambda x: x['overall_score'], reverse=True)],
        'recommendations': recommendations,
        'purchase_recommendations': purchase_recommendations,
        'insights': insights,
        'risk_analysis': risk_analysis,
        'chart_data': {
            'performance_ranking': {'labels': perf_labels, 'values': perf_values},
            'avg_delivery_time': {'labels': delivery_labels, 'values': delivery_values},
            'purchase_value': {'labels': purchase_labels, 'values': purchase_values},
            'reliability_comparison': {'labels': reliability_labels, 'values': reliability_values},
            'rating_distribution': rating_dist,
            'monthly_purchase_trend': {'labels': monthly_labels, 'values': monthly_values},
        },
        'generated_at': now.isoformat(),
        'filtered': bool(supplier_id or category_id or product_id or date_from or date_to or performance_level),
    }


def _empty_result(now):
    return {
        'summary_cards': {'total_suppliers': 0, 'active_suppliers': 0, 'preferred_suppliers': 0,
                          'high_risk_suppliers': 0, 'avg_delivery_time_days': 0,
                          'avg_order_success_rate': 0, 'total_purchase_value': 0, 'avg_purchase_cost': 0,
                          'best_performing_supplier': None, 'best_performing_score': 0,
                          'highest_reliability_supplier': None, 'highest_reliability_score': 0,
                          'fastest_delivery_supplier': None, 'fastest_delivery_rate': 0,
                          'lowest_cost_supplier': None, 'lowest_cost_value': 0, 'average_rating': 0},
        'performance_table': [], 'supplier_scores': [], 'recommendations': [],
        'purchase_recommendations': [], 'insights': [],
        'risk_analysis': {'high_risk': [], 'medium_risk': [], 'low_risk': []},
        'chart_data': {'performance_ranking': {'labels': [], 'values': []},
                       'avg_delivery_time': {'labels': [], 'values': []},
                       'purchase_value': {'labels': [], 'values': []},
                       'reliability_comparison': {'labels': [], 'values': []},
                       'rating_distribution': {'Excellent': 0, 'Good': 0, 'Average': 0, 'Poor': 0},
                       'monthly_purchase_trend': {'labels': [], 'values': []}},
        'generated_at': now.isoformat(), 'filtered': False,
    }
