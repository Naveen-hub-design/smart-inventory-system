from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy import func

from app import db
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.sale import Sale, SaleItem
from app.models.purchase import Purchase, PurchaseItem
from app.models.supplier import Supplier
from app.models.category import Category
from app.services.reorder_engine import get_recommendations
from app.services.forecast_engine import get_forecasts
from app.services.health_engine import get_health
from app.services.insights_engine import get_insights
from app.services.supplier_intel_engine import get_supplier_intelligence


class ErpServiceLayer:

    def get_reorder_recommendations(self, limit: int = 10) -> Dict:
        data = get_recommendations()
        return {
            'high_count': len(data.get('high_priority', [])),
            'medium_count': len(data.get('medium_priority', [])),
            'total': len(data.get('recommendations', [])),
            'items': data.get('recommendations', [])[:limit],
            'generated_at': data.get('generated_at'),
        }

    def get_inventory_summary(self) -> Dict:
        total_variants = ProductVariant.query.count()
        total_products = Product.query.count()
        total_stock = db.session.query(func.sum(ProductVariant.stock)).scalar() or 0
        low_stock = ProductVariant.query.filter(ProductVariant.stock <= ProductVariant.min_stock).count()
        out_of_stock = ProductVariant.query.filter(ProductVariant.stock <= 0).count()
        total_value = db.session.query(
            func.sum(ProductVariant.stock * ProductVariant.cost_price)
        ).scalar() or 0
        categories = Category.query.count()
        return {
            'total_variants': total_variants,
            'total_products': total_products,
            'total_stock': total_stock,
            'low_stock': low_stock,
            'out_of_stock': out_of_stock,
            'total_value': float(total_value),
            'categories': categories,
        }

    def get_inventory_summary_with_recommendation(self) -> Dict:
        base = self.get_inventory_summary()
        recs = []
        if base['low_stock'] > 0:
            recs.append(f"Restock {base['low_stock']} low-stock variants to avoid stockouts")
        if base['out_of_stock'] > 0:
            recs.append(f"Urgently reorder {base['out_of_stock']} out-of-stock variants")
        if base['total_value'] > 0:
            recs.append("Review ABC classification to optimize inventory carrying costs")
        base['recommendations'] = recs
        return base

    def get_low_stock_products(self) -> List[Dict]:
        variants = ProductVariant.query.filter(
            ProductVariant.stock <= ProductVariant.min_stock,
            ProductVariant.stock > 0,
        ).order_by(ProductVariant.stock.asc()).all()
        return [
            {
                'product_name': v.product.product_name if v.product else 'Unknown',
                'sku': v.sku,
                'stock': v.stock,
                'min_stock': v.min_stock,
            }
            for v in variants
        ]

    def get_out_of_stock_products(self) -> List[Dict]:
        variants = ProductVariant.query.filter(
            ProductVariant.stock <= 0,
            ProductVariant.product.has(Product.status == 'active'),
        ).all()
        return [
            {
                'product_name': v.product.product_name if v.product else 'Unknown',
                'sku': v.sku,
            }
            for v in variants
        ]

    def get_best_sellers(self, days: int = 30, limit: int = 10) -> Dict:
        lookback = datetime.utcnow() - timedelta(days=days)
        rows = db.session.query(
            ProductVariant.id,
            Product.product_name,
            ProductVariant.sku,
            ProductVariant.selling_price,
            ProductVariant.cost_price,
            func.sum(SaleItem.quantity).label('qty'),
            func.sum(SaleItem.total_price).label('revenue'),
        ).join(SaleItem, SaleItem.variant_id == ProductVariant.id
        ).join(Sale, Sale.id == SaleItem.sale_id
        ).join(Product, Product.id == ProductVariant.product_id
        ).filter(
            Sale.status == 'completed',
            Sale.sale_date >= lookback,
        ).group_by(
            ProductVariant.id, Product.product_name, ProductVariant.sku,
            ProductVariant.selling_price, ProductVariant.cost_price
        ).order_by(func.sum(SaleItem.quantity).desc()).limit(limit).all()
        items = []
        for r in rows:
            profit = float(r.revenue or 0) - (float(r.qty or 0) * float(r.cost_price or 0))
            items.append({
                'product_name': r.product_name,
                'sku': r.sku,
                'units_sold': int(r.qty or 0),
                'revenue': float(r.revenue or 0),
                'profit': round(profit, 2),
            })
        return {'items': items, 'period': f'last {days} days'}

    def get_forecast_data(self) -> Dict:
        data = get_forecasts()
        forecasts = data.get('forecasts', [])
        high_risk = [f for f in forecasts if f.get('risk_level') == 'High Risk']
        return {
            'forecasts': forecasts[:10],
            'high_risk_count': len(high_risk),
            'total_variants': len(forecasts),
            'generated_at': data.get('generated_at'),
        }

    def get_health_data(self) -> Dict:
        data = get_health()
        return {
            'score': data.get('overall_score', 0),
            'status': data.get('health_status', 'Unknown'),
            'summary': data.get('ai_summary', ''),
            'strengths': data.get('strengths', []),
            'issues': data.get('issues', []),
            'recommendations': data.get('recommendations', []),
            'metrics': data.get('metrics', {}),
        }

    def get_supplier_data(self) -> Dict:
        data = get_supplier_intelligence()
        scores = data.get('supplier_scores', [])
        risks = data.get('risk_analysis', {})
        best = data.get('summary_cards', {}).get('best_performing_supplier')
        return {
            'scores': scores,
            'risks': risks,
            'best_supplier': best,
            'total': len(scores),
        }

    def get_supplier_summary_with_recommendation(self) -> Dict:
        base = self.get_supplier_data()
        scores = base.get('scores', [])
        risks = base.get('risks', {})
        high_risk = risks.get('high_risk', [])
        recs = []
        if base.get('best_supplier'):
            recs.append(f"Strengthen partnership with best performer: {base['best_supplier']}")
        if high_risk:
            recs.append(f"Review {len(high_risk)} high-risk suppliers and consider alternatives")
        if scores:
            avg_score = sum(s.get('overall_score', 0) for s in scores) / len(scores)
            if avg_score < 70:
                recs.append("Overall supplier scores need improvement — consider supplier evaluation program")
            delivery_scores = [s.get('delivery_score', 0) for s in scores if s.get('delivery_score')]
            if delivery_scores:
                avg_delivery = sum(delivery_scores) / len(delivery_scores)
                if avg_delivery < 70:
                    recs.append("Delivery performance is below target — follow up with logistics team")
        base['recommendations'] = recs
        return base

    def get_suppliers_list(self) -> List[Dict]:
        suppliers = Supplier.query.filter_by(status='active').all()
        return [
            {
                'id': s.id,
                'name': s.supplier_name,
                'email': s.email,
                'phone': s.phone,
                'city': s.city,
            }
            for s in suppliers
        ]

    def search_suppliers(self, query: str) -> List[Dict]:
        q = f'%{query}%'
        suppliers = Supplier.query.filter(
            Supplier.status == 'active',
            db.or_(
                Supplier.supplier_name.ilike(q),
                Supplier.email.ilike(q),
                Supplier.city.ilike(q),
                Supplier.phone.ilike(q),
            )
        ).all()
        return [
            {
                'id': s.id,
                'name': s.supplier_name,
                'email': s.email,
                'phone': s.phone,
                'city': s.city,
            }
            for s in suppliers
        ]

    def get_insights_data(self) -> Dict:
        data = get_insights()
        cards = data.get('summary_cards', {})
        return {
            'best_seller': cards.get('best_selling_product'),
            'dead_stock': cards.get('dead_stock_product'),
            'slow_moving': cards.get('slow_moving_product'),
            'overstock': cards.get('overstocked_product'),
            'stock_out_risk': cards.get('stock_out_risk_product'),
            'highest_profit': cards.get('highest_profit_product'),
            'recommendations': data.get('ai_recommendations', []),
        }

    def get_sales_data(self) -> Dict:
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        month_start = today_start.replace(day=1)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        lookback = now - timedelta(days=30)

        today_total = db.session.query(func.sum(Sale.grand_total)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= today_start,
        ).scalar() or 0

        month_total = db.session.query(func.sum(Sale.grand_total)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= month_start,
        ).scalar() or 0

        last_month_total = db.session.query(func.sum(Sale.grand_total)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= last_month_start,
            Sale.sale_date < month_start,
        ).scalar() or 0

        count = db.session.query(func.count(Sale.id)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= lookback,
        ).scalar() or 0

        return {
            'today_total': float(today_total),
            'month_total': float(month_total),
            'last_month_total': float(last_month_total),
            'transaction_count': count,
            'period': 'last 30 days',
        }

    def get_detailed_sales_data(self) -> Dict:
        base = self.get_sales_data()
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        lookback = now - timedelta(days=30)

        today_orders = db.session.query(func.count(Sale.id)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= today_start,
        ).scalar() or 0

        avg_order_value = float(base['today_total'] / today_orders) if today_orders > 0 else 0

        top_product = db.session.query(
            Product.product_name,
            func.sum(SaleItem.quantity).label('qty'),
        ).join(SaleItem, SaleItem.variant_id == ProductVariant.id
        ).join(ProductVariant, ProductVariant.id == SaleItem.variant_id
        ).join(Product, Product.id == ProductVariant.product_id
        ).join(Sale, Sale.id == SaleItem.sale_id
        ).filter(
            Sale.status == 'completed',
            Sale.sale_date >= today_start,
        ).group_by(Product.product_name
        ).order_by(func.sum(SaleItem.quantity).desc()).first()

        return {
            **base,
            'today_orders': today_orders,
            'avg_order_value': round(avg_order_value, 2),
            'top_product': top_product[0] if top_product else None,
            'top_product_qty': int(top_product[1]) if top_product else 0,
        }

    def get_todays_sales(self) -> float:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        total = db.session.query(func.sum(Sale.grand_total)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= today_start,
        ).scalar() or 0
        return float(total)

    def get_monthly_sales(self) -> float:
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        total = db.session.query(func.sum(Sale.grand_total)).filter(
            Sale.status == 'completed',
            Sale.sale_date >= month_start,
        ).scalar() or 0
        return float(total)

    def get_purchase_data(self) -> Dict:
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        lookback = now - timedelta(days=30)

        month_total = db.session.query(func.sum(Purchase.grand_total)).filter(
            Purchase.status == 'completed',
            Purchase.purchase_date >= month_start,
        ).scalar() or 0

        count = db.session.query(func.count(Purchase.id)).filter(
            Purchase.status == 'completed',
            Purchase.purchase_date >= lookback,
        ).scalar() or 0

        pending = db.session.query(func.count(Purchase.id)).filter(
            Purchase.status == 'pending',
        ).scalar() or 0

        recent = Purchase.query.filter_by(status='completed').order_by(
            Purchase.purchase_date.desc()
        ).limit(5).all()

        return {
            'month_total': float(month_total),
            'transaction_count': count,
            'pending_count': pending,
            'recent': [
                {
                    'invoice': p.invoice_number,
                    'supplier': p.supplier.supplier_name if p.supplier else 'Unknown',
                    'total': float(p.grand_total),
                    'date': p.purchase_date.isoformat() if p.purchase_date else None,
                }
                for p in recent
            ],
        }

    def get_latest_purchases(self, limit: int = 5) -> List[Dict]:
        recent = Purchase.query.filter_by(status='completed').order_by(
            Purchase.purchase_date.desc()
        ).limit(limit).all()
        return [
            {
                'invoice': p.invoice_number,
                'supplier': p.supplier.supplier_name if p.supplier else 'Unknown',
                'total': float(p.grand_total),
                'date': p.purchase_date.isoformat() if p.purchase_date else None,
            }
            for p in recent
        ]

    def get_pending_purchases(self) -> List[Dict]:
        pending = Purchase.query.filter_by(status='pending').order_by(
            Purchase.purchase_date.desc()
        ).all()
        return [
            {
                'invoice': p.invoice_number,
                'supplier': p.supplier.supplier_name if p.supplier else 'Unknown',
                'total': float(p.grand_total),
                'date': p.purchase_date.isoformat() if p.purchase_date else None,
            }
            for p in pending
        ]

    def get_product_data(self) -> Dict:
        total = Product.query.count()
        active = Product.query.filter_by(status='active').count()
        categories = Category.query.all()
        by_category = []
        for c in categories:
            cnt = Product.query.filter_by(category_id=c.id, status='active').count()
            if cnt > 0:
                by_category.append({'name': c.name, 'count': cnt})
        return {
            'total_products': total,
            'active_products': active,
            'by_category': by_category,
        }

    def search_products(self, query: str) -> List[Dict]:
        q = f'%{query}%'
        variants = ProductVariant.query.join(Product).filter(
            Product.status == 'active',
            db.or_(
                Product.product_name.ilike(q),
                ProductVariant.sku.ilike(q),
            )
        ).all()
        seen = set()
        results = []
        for v in variants:
            name = v.product.product_name if v.product else 'Unknown'
            if name not in seen:
                seen.add(name)
                results.append({
                    'product_name': name,
                    'sku': v.sku,
                    'stock': v.stock,
                    'price': float(v.selling_price or 0),
                })
        return results

    def get_products_by_category(self, category_id: int) -> List[Dict]:
        products = Product.query.filter_by(category_id=category_id, status='active').all()
        return [
            {
                'id': p.id,
                'name': p.product_name,
                'variant_count': ProductVariant.query.filter_by(product_id=p.id).count(),
            }
            for p in products
        ]

    def get_dead_stock_products(self) -> List[Dict]:
        data = get_insights()
        dead = data.get('summary_cards', {}).get('dead_stock_product')
        return [dead] if dead else []

    def get_overstocked_products(self) -> List[Dict]:
        data = get_insights()
        over = data.get('summary_cards', {}).get('overstocked_product')
        return [over] if over else []


erp_service = ErpServiceLayer()
