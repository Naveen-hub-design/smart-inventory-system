from app.services.conversation_memory import memory
from app.services.entity_extractor import entity_extractor
from app.services.intent_engine import intent_engine
from app.services.action_engine import action_engine
from app.services.navigation_service import navigation_service
from app.services.erp_service_layer import erp_service
from app.services.response_generator import response_generator
from app import db
from app.models.audit_log import AuditLog
from app.models.user import User
from typing import Dict, Optional, Any
import re


EXPORTABLE_INTENTS = (
    'reorder', 'inventory_summary', 'best_sellers',
    'forecast', 'health', 'suppliers', 'insights',
    'sales', 'purchases', 'products', 'reports',
    'dashboard', 'analytics',
)


class CopilotEngine:

    def process_message(self, session_id: str, message: str, user) -> dict:
        context = memory.get_context(session_id, last_n=6)
        session_entities = memory.get_latest_entities(session_id)

        entities = entity_extractor.extract(message, session_entities)
        if entities.get('index_ref') is not None:
            context_entities = entity_extractor.extract_from_context(context)
            entity_extractor._resolve_session_refs(entities, context_entities)

        memory.add_message(session_id, 'user', message, entities=entities)

        has_pending = action_engine.has_pending(session_id)
        intent = intent_engine.detect(message, context, has_pending)

        last_intent = memory.get_last_intent(session_id)

        if intent == 'context_follow_up' and last_intent:
            intent = self._resolve_context_follow_up(message, last_intent, session_id)
            if intent != last_intent and last_intent in EXPORTABLE_INTENTS:
                intent = last_intent

        if has_pending and intent in ('confirm_action', 'cancel_action'):
            result = self._handle_confirmation(session_id, intent, user)
            memory.add_message(session_id, 'assistant', result['message'], {
                'intent': intent,
                'data': {},
            })
            return {
                'message': result['message'],
                'suggestions': response_generator.get_suggestions(intent, {}, user),
                'intent': intent,
                'can_export': False,
                'navigate_to': result.get('navigate_to'),
            }

        response_data = self._execute_intent(intent, user, message, context, entities, session_id)
        formatted = self._format_response(intent, response_data, user, context, entities, session_id)

        memory.add_message(session_id, 'assistant', formatted['message'], {
            'intent': intent,
            'data': response_data,
        })

        suggestions = response_generator.get_suggestions(intent, response_data, user)

        result = {
            'message': formatted['message'],
            'suggestions': suggestions,
            'intent': intent,
            'can_export': intent in EXPORTABLE_INTENTS,
            'navigate_to': formatted.get('navigate_to'),
        }
        if intent == 'reports':
            result['report_type'] = response_data.get('report_type')
            result['report_id'] = response_data.get('report_id')
        return result

    def _resolve_context_follow_up(self, message: str, last_intent: str, session_id: str) -> str:
        msg = message.lower().strip()
        time_qualifiers = {
            'today': ('today', "today's", 'todays'),
            'yesterday': ('yesterday', "yesterday's"),
            'this_week': ('this week',),
            'this_month': ('this month',),
            'last_week': ('last week',),
            'last_month': ('last month',),
        }

        if any(q in msg for q in ['inventory', 'stock']):
            if last_intent in ('products', 'best_sellers', 'forecast'):
                return 'inventory_summary'
            return last_intent

        if any(q in msg for q in ['low stock', 'low', 'out of stock']):
            return 'low_stock'

        if any(q in msg for q in ['only', 'just', 'for today', 'for this week', 'for this month']):
            return last_intent

        if any(q in msg for q in ['material', 'materials']):
            return 'products'

        if any(q in msg for q in ['category', 'categories']):
            last_data = memory.get_last_assistant_data(session_id)
            if last_data and last_data.get('by_category'):
                return 'follow_up'
            return 'products'

        return last_intent if last_intent else 'unknown'

    def _handle_confirmation(self, session_id: str, intent: str, user) -> dict:
        if intent == 'confirm_action':
            pending = action_engine.get_pending(session_id)
            if not pending:
                return {'message': 'No pending action to confirm.', 'navigate_to': None}
            if user:
                pending['data']['username'] = user.username
                pending['data']['role'] = user.role
            result = action_engine.execute_pending(session_id)
            return {
                'message': result.get('message', 'Action completed.'),
                'navigate_to': None,
            }
        else:
            action_engine.clear_pending(session_id)
            return {
                'message': 'Action cancelled. No changes were made. Is there anything else I can help you with?',
                'navigate_to': None,
            }

    def _execute_intent(self, intent: str, user, message: str, context: list,
                        entities: dict, session_id: str) -> dict:
        handlers = {
            'greeting': lambda: self._handle_greeting(user),
            'help': lambda: self._handle_help(user),
            'reorder': lambda: self._handle_reorder(user, session_id),
            'inventory_summary': lambda: erp_service.get_inventory_summary_with_recommendation(),
            'low_stock': lambda: self._handle_low_stock(user, session_id),
            'best_sellers': lambda: erp_service.get_best_sellers(),
            'forecast': lambda: erp_service.get_forecast_data(),
            'health': lambda: erp_service.get_health_data(),
            'suppliers': lambda: self._handle_suppliers(user, session_id),
            'insights': lambda: erp_service.get_insights_data(),
            'sales': lambda: self._handle_sales(message),
            'purchases': lambda: self._handle_purchases(),
            'products': lambda: erp_service.get_product_data(),
            'search_product': lambda: self._handle_search_product(message),
            'reports': lambda: self._handle_reports(message),
            'navigation': lambda: self._handle_navigation(message),
            'follow_up': lambda: self._handle_follow_up(user, context, entities),
            'context_follow_up': lambda: self._handle_follow_up(user, context, entities),
            'general_knowledge': lambda: self._handle_general_knowledge(message),
            'explain': lambda: {'answer': response_generator.get_knowledge_answer(message), 'topic': message},
            'dashboard': lambda: self._handle_dashboard(),
            'analytics': lambda: self._handle_analytics(),
        }
        if intent.startswith('explain_'):
            term = intent.replace('explain_', '')
            return {'answer': self._get_erp_knowledge(term), 'topic': term}
        handler = handlers.get(intent)
        if handler:
            return handler()
        return self._handle_unknown()

    def _handle_greeting(self, user) -> dict:
        return {'user': user}

    def _handle_help(self, user) -> dict:
        return {'user': user}

    def _handle_dashboard(self) -> dict:
        summary = erp_service.get_inventory_summary_with_recommendation()
        sales = erp_service.get_detailed_sales_data()
        return {
            'summary': summary,
            'sales': sales,
        }

    def _handle_analytics(self) -> dict:
        summary = erp_service.get_inventory_summary_with_recommendation()
        sales = erp_service.get_detailed_sales_data()
        insights = erp_service.get_insights_data()
        return {
            'summary': summary,
            'sales': sales,
            'insights': insights,
        }

    def _handle_sales(self, message: str) -> dict:
        msg = message.lower()
        if any(w in msg for w in ['today', 'todays', "today's", 'daily']):
            return erp_service.get_detailed_sales_data()
        return erp_service.get_sales_data()

    def _handle_reorder(self, user, session_id: str) -> dict:
        data = erp_service.get_reorder_recommendations()
        items = data.get('items', [])
        if items and data.get('high_count', 0) > 0:
            pending_items = [i for i in items if i.get('priority') == 'high'][:5]
            action_engine.set_pending(
                session_id, 'create_draft_pos',
                {'count': len(pending_items), 'items': pending_items},
                f'Create draft purchase orders for {len(pending_items)} high-priority items.',
                user,
            )
        return data

    def _handle_low_stock(self, user, session_id: str) -> dict:
        items = erp_service.get_low_stock_products()
        data = {'items': items, 'count': len(items)}
        if items:
            action_engine.set_pending(
                session_id, 'restock_all',
                {'count': len(items), 'items': items},
                f'Restock all {len(items)} low stock products.',
                user,
            )
        return data

    def _handle_suppliers(self, user, session_id: str) -> dict:
        data = erp_service.get_supplier_summary_with_recommendation()
        scores = data.get('scores', [])
        if scores:
            high_risk = [s for s in scores if s.get('risk_level') == 'High Risk']
            if high_risk:
                names = [s.get('supplier_name', 'Unknown') for s in high_risk[:3]]
                action_engine.set_pending(
                    session_id, 'notify_suppliers',
                    {'suppliers': names},
                    f'Notify {len(names)} high-risk suppliers.',
                    user,
                )
        return data

    def _handle_purchases(self) -> dict:
        return erp_service.get_purchase_data()

    def _handle_search_product(self, message: str) -> dict:
        msg = message.lower()
        query_match = re.search(r'(?:search|find|look\s+up|lookup)\s+(?:for\s+)?(?:product|item|sku)?\s*["\']?([a-zA-Z0-9\s\-]+)["\']?', msg)
        query = query_match.group(1).strip() if query_match else ''
        for kw in ['search', 'find', 'look up', 'lookup', 'product', 'item', 'sku', 'for']:
            query = query.replace(kw, '').strip()
        if not query:
            return {'results': [], 'query': ''}
        results = erp_service.search_products(query)
        if not results:
            results = erp_service.search_suppliers(query)
            if results:
                return {'results': results, 'type': 'suppliers', 'query': query}
        return {'results': results, 'type': 'products', 'query': query}

    def _handle_reports(self, message: str) -> dict:
        msg = message.lower()
        if any(w in msg for w in ['sale', 'sales', 'revenue']):
            return {'report_type': 'Sales', 'report_id': 'sales', 'data': erp_service.get_sales_data()}
        if any(w in msg for w in ['low stock', 'low-stock', 'low_stock']):
            items = erp_service.get_low_stock_products()
            return {'report_type': 'Low Stock', 'report_id': 'low-stock', 'data': {'items': items, 'count': len(items)}}
        if any(w in msg for w in ['purchase', 'procurement', 'bought']):
            return {'report_type': 'Purchase', 'report_id': 'purchases', 'data': erp_service.get_purchase_data()}
        if any(w in msg for w in ['inventory', 'stock']):
            return {'report_type': 'Inventory', 'report_id': 'inventory', 'data': erp_service.get_inventory_summary()}
        if any(w in msg for w in ['supplier', 'vendor']):
            return {'report_type': 'Supplier', 'report_id': 'suppliers', 'data': erp_service.get_supplier_data()}
        return {'report_type': 'General Report', 'report_id': '', 'data': {}}

    def _handle_navigation(self, message: str) -> dict:
        nav = navigation_service.resolve(message)
        return {
            'destination': nav['destination'],
            'label': nav['label'],
        }

    def _handle_follow_up(self, user, context: list, entities: dict) -> dict:
        last_data = memory.get_last_assistant_data('default')

        if entities and entities.get('product_name'):
            return {
                'message': (
                    f"I found information about **{entities['product_name']}**"
                    f"{' (SKU: ' + entities['sku'] + ')' if entities.get('sku') else ''}. "
                    f"Would you like me to check stock, sales, or forecast for this product?"
                ),
                'confidence': 90,
            }

        if not last_data:
            return {'message': 'I\'m not sure what you\'re referring to. Could you please be more specific?', 'confidence': 70}
        intent = last_data.get('intent', '')
        if intent == 'best_sellers' and last_data.get('data', {}).get('items'):
            items = last_data['data']['items']
            if entities and entities.get('index_ref') is not None:
                idx = entities['index_ref']
                if idx < len(items):
                    item = items[idx]
                    return {
                        'message': (
                            f"**{item['product_name']}** (SKU: {item['sku']}) — "
                            f"Units Sold: {item.get('units_sold', 0)} | "
                            f"Revenue: ₹{item.get('revenue', 0):,.2f} | "
                            f"Profit: ₹{item.get('profit', 0):,.2f}"
                        ),
                        'confidence': 95,
                    }
            if items:
                best = max(items, key=lambda x: x.get('profit', 0))
                return {
                    'message': (
                        f"The product with the **highest profit** is **{best['product_name']}** "
                        f"(SKU: {best['sku']}) with a profit of **₹{best['profit']:,.2f}** "
                        f"and revenue of **₹{best['revenue']:,.2f}**."
                    ),
                    'confidence': 95,
                }
        if intent == 'reorder' and last_data.get('data', {}).get('items'):
            items = last_data['data']['items']
            if entities and entities.get('index_ref') is not None:
                idx = entities['index_ref']
                if idx < len(items):
                    item = items[idx]
                    return {
                        'message': (
                            f"**{item['product_name']}** needs reorder because current stock "
                            f"({item['current_stock']} units) is below the minimum level "
                            f"({item['min_stock']} units). "
                            f"Suggested reorder quantity: **+{item.get('suggested_reorder_qty', 0)} units**."
                        ),
                        'confidence': 95,
                    }
            if items:
                high_items = [i for i in items if i.get('priority') == 'high']
                if high_items:
                    item = high_items[0]
                    return {
                        'message': (
                            f"**{item['product_name']}** needs reorder because current stock "
                            f"({item['current_stock']} units) is below the minimum level "
                            f"({item['min_stock']} units). "
                            f"With average daily sales of {item.get('avg_daily_sales', 0):.1f} units, "
                            f"stock will last approximately {item.get('days_remaining', 'N/A')} days. "
                            f"Suggested reorder quantity: **+{item.get('suggested_reorder_qty', 0)} units**."
                        ),
                        'confidence': 95,
                    }
        if intent == 'products' and last_data.get('data', {}).get('by_category'):
            cats = last_data['data']['by_category']
            counts = [f"**{c['name']}**: {c['count']} products" for c in cats]
            return {
                'message': (
                    f"Here's the product distribution by category:\n" + "\n".join(
                        f"- {c}" for c in counts
                    )
                ),
                'confidence': 95,
            }
        if intent == 'forecast' and last_data.get('data', {}).get('forecasts'):
            forecasts = last_data['data']['forecasts']
            if entities and entities.get('index_ref') is not None:
                idx = entities['index_ref']
                if idx < len(forecasts):
                    f = forecasts[idx]
                    return {
                        'message': (
                            f"**{f['product_name']}** — Stock: {f.get('current_stock', 0)} | "
                            f"Predicted 30d demand: **{f.get('demand_30_days', 'N/A')}** units | "
                            f"Confidence: {f.get('confidence_score', 0)}%"
                        ),
                        'confidence': 95,
                    }
            high_risk = [f for f in forecasts if f.get('risk_level') == 'High Risk']
            if high_risk:
                names = ', '.join(f.get('product_name', 'Unknown') for f in high_risk[:5])
                return {
                    'message': (
                        f"Products at **high risk** of stockout: {names}. "
                        f"These items have insufficient stock to meet predicted demand over the next 30 days. "
                        f"Consider placing urgent reorders for these items."
                    ),
                    'confidence': 95,
                }
        if intent == 'insights' and last_data.get('data', {}).get('dead_stock'):
            d = last_data['data']['dead_stock']
            return {
                'message': (
                    f"**{d['product_name']}** is classified as dead stock. "
                    f"It has not been sold for **{d.get('days_unsold', 'N/A')} days** "
                    f"with a stock value of **₹{d.get('stock_value', 0):,.2f}**. "
                    f"Recommendation: {d.get('recommendation', 'Consider discounting or bundling to move inventory.')}"
                ),
                'confidence': 95,
            }
        return {
            'message': 'Based on the previous results, I can provide more specific analysis. Could you clarify what you\'d like to know?',
            'confidence': 70,
        }

    def _handle_general_knowledge(self, message: str) -> dict:
        msg = message.lower()
        knowledge = {
            'turnover': 'inventory_turnover',
            'safety stock': 'safety_stock',
            'fifo': 'fifo',
            'lifo': 'lifo',
            'sku': 'sku',
            'barcode': 'barcode',
            'lead time': 'lead_time',
        }
        for key, term in knowledge.items():
            if key in msg:
                return {'answer': self._get_erp_knowledge(term)}
        return {
            'answer': (
                "Here are some inventory management best practices:\n\n"
                "1. **ABC Analysis**: Categorize items by value (A=high, B=medium, C=low) and manage accordingly.\n"
                "2. **Cycle Counting**: Count a portion of inventory regularly instead of annual full counts.\n"
                "3. **Safety Stock**: Maintain buffer stock for high-demand or long-lead-time items.\n"
                "4. **Demand Forecasting**: Use historical data to predict future demand and plan procurement.\n"
                "5. **Supplier Management**: Maintain relationships with multiple suppliers for critical items.\n"
                "6. **Regular Audits**: Use the audit log to track all inventory movements and changes.\n\n"
                "Would you like me to explain any specific concept in detail?"
            )
        }

    def _handle_unknown(self) -> dict:
        return {'message': self._format_unknown(), 'fallback': True}

    def _format_unknown(self) -> str:
        return (
            "I couldn't identify that request.\n\n"
            "I can help you with:\n\n"
            "**Sales & Revenue**\n"
            "- \"Today's sales\" — View daily revenue and orders\n"
            "- \"Show best sellers\" — Top selling products\n"
            "- \"Sales report\" — Detailed sales data\n\n"
            "**Inventory & Stock**\n"
            "- \"Inventory summary\" — Stock overview with alerts\n"
            "- \"Low stock products\" — Items needing restock\n"
            "- \"Reorder recommendations\" — What to order\n\n"
            "**Products & Categories**\n"
            "- \"Product overview\" — Product count by category\n"
            "- \"Search product\" — Find product by name or SKU\n\n"
            "**Suppliers**\n"
            "- \"Supplier summary\" — Performance and ratings\n"
            "- \"Best supplier\" — Top performing vendor\n\n"
            "**Purchases**\n"
            "- \"Purchase summary\" — Procurement overview\n"
            "- \"Pending orders\" — Orders awaiting processing\n\n"
            "**Reports & Navigation**\n"
            "- \"Generate report\" — Export ERP data\n"
            "- \"Go to dashboard\" — Navigate the system\n"
            "- \"Open inventory\" — Jump to any module\n\n"
            "**Business Analytics**\n"
            "- \"Demand forecast\" — Predict future demand\n"
            "- \"Inventory health\" — Overall stock health score\n"
            "- \"Business insights\" — Dead stock, overstock, trends\n\n"
            "Try asking naturally — I understand many variations!"
        )

    def _format_response(self, intent: str, data: dict, user, context: list,
                         entities: dict, session_id: str) -> dict:
        formatters = {
            'greeting': lambda d, u: {'message': response_generator.format_greeting(u), 'confidence': 100},
            'help': lambda d, u: {'message': response_generator.format_help(u), 'confidence': 100},
            'reorder': lambda d, u: self._format_reorder_with_confirmation(d, u, session_id),
            'inventory_summary': lambda d, u: response_generator.format_inventory_summary(d, u),
            'low_stock': lambda d, u: self._format_low_stock_with_confirmation(d, u, session_id),
            'best_sellers': lambda d, u: response_generator.format_best_sellers(d, u),
            'forecast': lambda d, u: response_generator.format_forecast(d, u),
            'health': lambda d, u: response_generator.format_health(d, u),
            'suppliers': lambda d, u: self._format_suppliers_with_confirmation(d, u, session_id),
            'insights': lambda d, u: response_generator.format_insights(d, u),
            'sales': lambda d, u: response_generator.format_sales(d, u),
            'purchases': lambda d, u: response_generator.format_purchases(d, u),
            'products': lambda d, u: response_generator.format_products(d, u),
            'search_product': lambda d, u: response_generator.format_search_results(d, u),
            'reports': lambda d, u: response_generator.format_report_data(d.get('report_type', 'Report'), d.get('data', {}), u),
            'navigation': lambda d, u: response_generator.format_navigation(d.get('label', ''), d.get('destination', '')),
            'follow_up': lambda d, u: {'message': d.get('message', ''), 'confidence': d.get('confidence', 85)},
            'context_follow_up': lambda d, u: {'message': d.get('message', ''), 'confidence': d.get('confidence', 85)},
            'general_knowledge': lambda d, u: {'message': d.get('answer', ''), 'confidence': 90},
            'explain': lambda d, u: {'message': d.get('answer', ''), 'confidence': 95},
            'unknown': lambda d, u: {'message': d.get('message', self._format_unknown()), 'confidence': 50},
            'empty': lambda d, u: {'message': 'Please type a message to get started.', 'confidence': 100},
            'dashboard': lambda d, u: self._format_dashboard(d, u),
            'analytics': lambda d, u: self._format_analytics(d, u),
        }
        if intent.startswith('explain_'):
            term = intent.replace('explain_', '')
            data['topic'] = term
            return {'message': data.get('answer', ''), 'confidence': 95}
        formatter = formatters.get(intent, formatters['unknown'])
        result = formatter(data, user)
        if not isinstance(result, dict):
            result = {'message': str(result), 'confidence': 50}
        if 'navigate_to' not in result:
            result['navigate_to'] = None
        return result

    def _format_dashboard(self, data: dict, user) -> dict:
        summary = data.get('summary', {})
        sales = data.get('sales', {})
        message = (
            "## Dashboard Overview\n\n"
            "Here's a quick snapshot of your business:\n\n"
        )
        message += "**Inventory:**\n"
        message += f"- Total Stock: {summary.get('total_stock', 0):,} units\n"
        message += f"- Inventory Value: ₹{summary.get('total_value', 0):,.2f}\n"
        message += f"- Low Stock Alerts: ⚠️ {summary.get('low_stock', 0)}\n"
        message += f"- Out of Stock: 🚫 {summary.get('out_of_stock', 0)}\n\n"
        message += "**Sales Today:**\n"
        message += f"- Revenue: ₹{sales.get('today_total', 0):,.2f}\n"
        message += f"- Orders: {sales.get('today_orders', 0)}\n"
        message += f"- Avg Order Value: ₹{sales.get('avg_order_value', 0):,.2f}\n"
        if sales.get('top_product'):
            message += f"- Top Product: {sales['top_product']}\n"
        return {'message': message, 'confidence': 93}

    def _format_analytics(self, data: dict, user) -> dict:
        summary = data.get('summary', {})
        sales = data.get('sales', {})
        insights = data.get('insights', {})
        message = (
            "## Business Analytics Overview\n\n"
            "**Inventory Health:**\n"
            f"- Total Stock: {summary.get('total_stock', 0):,} units | "
            f"Value: ₹{summary.get('total_value', 0):,.2f}\n"
            f"- Low Stock: ⚠️ {summary.get('low_stock', 0)} | "
            f"Out of Stock: 🚫 {summary.get('out_of_stock', 0)}\n\n"
            "**Sales Performance:**\n"
            f"- Today: ₹{sales.get('today_total', 0):,.2f} "
            f"({sales.get('today_orders', 0)} orders)\n"
            f"- This Month: ₹{sales.get('month_total', 0):,.2f}\n"
        )
        best = insights.get('best_seller')
        dead = insights.get('dead_stock')
        slow = insights.get('slow_moving')
        over = insights.get('overstock')
        if best:
            message += f"\n**Top Performer:** {best.get('product_name')} — {best.get('units_sold', 0)} units sold\n"
        if dead:
            message += f"**Dead Stock Alert:** {dead.get('product_name')} — {dead.get('days_unsold', 0)} days unsold\n"
        if slow:
            message += f"**Slow Moving:** {slow.get('product_name')}\n"
        if over:
            message += f"**Overstock:** {over.get('product_name')}\n"
        recs = insights.get('recommendations', [])
        if recs:
            message += "\n**Recommendations:**\n"
            for r in recs[:3]:
                message += f"- 💡 {r.get('message', '')}\n"
        message += "\nWould you like to dive deeper into any area?"
        return {'message': message, 'confidence': 92}

    def _format_reorder_with_confirmation(self, data: dict, user, session_id: str) -> dict:
        base = response_generator.format_reorder(data, user)
        high = data.get('high_count', 0)
        if high > 0 and action_engine.has_pending(session_id):
            base['message'] += (
                f"\n\n---\n"
                f"Would you like me to create **draft purchase orders** for the **{high} high-priority items**?"
            )
            base['requires_confirmation'] = True
        return base

    def _format_low_stock_with_confirmation(self, data: dict, user, session_id: str) -> dict:
        base = response_generator.format_low_stock(data, user)
        items = data.get('items', [])
        if items and action_engine.has_pending(session_id):
            base['message'] += (
                f"\n\n---\n"
                f"Would you like me to **initiate restock** for all **{len(items)} low stock products**?"
            )
            base['requires_confirmation'] = True
        return base

    def _format_suppliers_with_confirmation(self, data: dict, user, session_id: str) -> dict:
        base = response_generator.format_suppliers(data, user)
        scores = data.get('scores', [])
        high_risk = [s for s in scores if s.get('risk_level') == 'High Risk']
        if high_risk and action_engine.has_pending(session_id):
            base['message'] += (
                f"\n\n---\n"
                f"Would you like me to **notify the {len(high_risk)} high-risk suppliers**?"
            )
            base['requires_confirmation'] = True
        return base

    def _get_erp_knowledge(self, term: str) -> str:
        from app.services.response_generator import ERP_KNOWLEDGE
        return ERP_KNOWLEDGE.get(term, f'I can explain inventory concepts. Please ask about: {", ".join(ERP_KNOWLEDGE.keys())}')


copilot_engine = CopilotEngine()
