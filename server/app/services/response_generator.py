from typing import Dict, Optional, Any, List
from datetime import datetime


ERP_KNOWLEDGE = {
    'fifo': 'FIFO (First-In, First-Out) is an inventory valuation method where the oldest inventory items are sold first. This means the cost of the earliest purchased goods is recognized first in COGS. It is the most common method and generally provides a better matching of current costs with current revenues.',
    'lifo': 'LIFO (Last-In, First-Out) is an inventory valuation method where the newest inventory items are sold first. This means the cost of the most recently purchased goods is recognized first in COGS. Note: LIFO is not permitted under IFRS.',
    'sku': 'A SKU (Stock Keeping Unit) is a unique alphanumeric code assigned to each product variant for tracking inventory internally. SKUs are typically formatted as CATEGORY-PRODUCT-COLOR-SIZE-SEQUENCE (e.g., APP-TSH-BLK-M-001). Unlike barcodes, SKUs are created by the business for internal management.',
    'barcode': 'A barcode is a machine-readable code consisting of parallel lines of varying widths that represents product data. Barcodes (like UPC or EAN) are universal standards used at point-of-sale for scanning. Each barcode is globally unique.',
    'qr_code': 'A QR Code (Quick Response Code) is a two-dimensional matrix barcode that can store more data than traditional barcodes, including URLs, text, or product information. In inventory systems, QR codes are used for quick scanning, asset tracking, and providing product information via mobile devices.',
    'inventory_turnover': 'Inventory Turnover is a ratio that measures how many times inventory is sold and replaced over a period. It is calculated as: Cost of Goods Sold / Average Inventory. A higher turnover indicates efficient inventory management and strong sales, while low turnover may indicate overstocking or obsolescence.',
    'safety_stock': 'Safety Stock is the extra inventory kept beyond expected demand to protect against uncertainties in supply and demand. It acts as a buffer against stockouts caused by supplier delays, sudden demand spikes, or inaccurate forecasts. Formula: (Max Daily Usage x Max Lead Time) - (Avg Daily Usage x Avg Lead Time).',
    'lead_time': 'Lead Time is the total time between placing a purchase order and receiving the inventory. It includes order processing, manufacturing, shipping, and receiving time. Accurate lead time estimation is critical for determining reorder points and safety stock levels.',
    'eoq': 'EOQ (Economic Order Quantity) is the optimal order quantity that minimizes total inventory costs, including ordering costs and holding costs. Formula: EOQ = sqrt((2 x D x S) / H), where D = annual demand, S = ordering cost per order, H = holding cost per unit per year.',
    'reorder_point': 'The Reorder Point (ROP) is the inventory level at which a new order should be placed to avoid stockouts before the next shipment arrives. Formula: ROP = (Average Daily Usage x Lead Time in Days) + Safety Stock. When stock falls to this level, it triggers a replenishment order.',
}


class ResponseGenerator:

    def get_user_prefix(self, user) -> tuple:
        role = user.role if user else 'staff'
        name = user.full_name.split()[0] if user and user.full_name else 'there'
        return name, role

    def format_greeting(self, user) -> str:
        name, role = self.get_user_prefix(user)
        hour = datetime.utcnow().hour + 5.5
        period = 'morning' if hour < 12 else 'afternoon' if hour < 18 else 'evening'
        return (
            f"Good {period}, **{name}**! I'm your **AI ERP Copilot**. "
            f"I can help you understand your inventory, sales, purchases, suppliers, "
            f"and AI-powered insights.\n\n"
            f"Here's what I can do:\n"
            f"- **Inventory**: Check stock levels, low stock alerts, inventory health\n"
            f"- **Sales**: View sales performance, best sellers, revenue\n"
            f"- **Purchases**: Track procurement, supplier performance\n"
            f"- **AI Insights**: Reorder recommendations, demand forecasting, inventory health\n"
            f"- **Knowledge**: Explain inventory concepts (FIFO, SKU, etc.)\n"
            f"- **Reports**: Generate and export sales, purchase, inventory reports\n"
            f"- **Navigation**: Go to any section of the system\n\n"
            f"Feel free to ask me anything about your ERP system!"
        )

    def format_help(self, user) -> str:
        return (
            "I can assist you with the following:\n\n"
            "**Inventory Management**\n"
            "- \"Which products need reorder?\" — View reorder recommendations\n"
            "- \"Summarize inventory\" — Get an overview of all stock\n"
            "- \"Show low stock products\" — Items below minimum threshold\n"
            "- \"How is inventory health?\" — Overall health score and factors\n\n"
            "**Sales & Revenue**\n"
            "- \"Show best selling products\" — Top performing items\n"
            "- \"What sold the most this month?\" — Sales summary\n"
            "- \"Total sales today\" — Quick sales snapshot\n\n"
            "**Suppliers**\n"
            "- \"Show suppliers\" — View supplier list\n"
            "- \"Search supplier\" — Find supplier by name or location\n"
            "- \"Compare suppliers\" — Supplier performance comparison\n\n"
            "**Reports & Export**\n"
            "- \"Generate sales report\" — Export sales data\n"
            "- \"Generate inventory report\" — Export stock data\n"
            "- \"Generate purchase report\" — Export procurement data\n\n"
            "**Navigation**\n"
            "- \"Go to dashboard\" — Switch to main dashboard\n"
            "- \"Open Inventory\" — Navigate to inventory section\n"
            "- \"Open Sales\" — View sales module\n\n"
            "**AI Features**\n"
            "- \"Predict next month's demand\" — Demand forecasting\n"
            "- \"Show slow moving items\" — Dead stock analysis\n"
            "- \"Explain FIFO\" — Inventory concept explanations\n\n"
            "Just type your question naturally and I'll fetch the data for you!"
        )

    def format_reorder(self, data: dict, user) -> dict:
        high = data.get('high_count', 0)
        medium = data.get('medium_count', 0)
        items = data.get('items', [])
        if not items:
            return {'message': 'No reorder recommendations at this time. All products appear to be sufficiently stocked.', 'confidence': 95}
        response = f"## Reorder Recommendations\n\n"
        response += f"I analyzed your inventory and found:\n"
        response += f"- **{high} high priority** items needing immediate attention\n"
        response += f"- **{medium} medium priority** items to monitor\n\n"
        if high > 0:
            response += f"**Top priority items:**\n"
            for item in items[:5]:
                if item.get('priority') == 'high':
                    response += (
                        f"- **{item['product_name']}** (SKU: {item.get('sku', 'N/A')}) — "
                        f"Stock: {item.get('current_stock', 0)} | Min: {item.get('min_stock', 0)} | "
                        f"Suggested order: **+{item.get('suggested_reorder_qty', 0)} units**\n"
                    )
        if high == 0 and medium > 0:
            for item in items[:5]:
                if item.get('priority') == 'medium':
                    response += (
                        f"- **{item['product_name']}** (SKU: {item.get('sku', 'N/A')}) — "
                        f"Stock: {item.get('current_stock', 0)} | Min: {item.get('min_stock', 0)} | "
                        f"Suggested order: **+{item.get('suggested_reorder_qty', 0)} units**\n"
                    )
        response += f"\n*Generated at: {data.get('generated_at', 'N/A')[:19]}*"
        return {'message': response, 'confidence': 92}

    def format_inventory_summary(self, data: dict, user) -> dict:
        recs = data.get('recommendations', [])
        response = (
            f"## Inventory Summary\n\n"
            f"Here's your current inventory overview:\n\n"
            f"- **Total Products**: {data.get('total_products', 0)}\n"
            f"- **Total Variants**: {data.get('total_variants', 0)}\n"
            f"- **Total Stock Units**: {data.get('total_stock', 0):,}\n"
            f"- **Inventory Value**: ₹{data.get('total_value', 0):,.2f}\n"
            f"- **Product Categories**: {data.get('categories', 0)}\n\n"
            f"**Stock Alerts:**\n"
            f"- ⚠️ **{data.get('low_stock', 0)} variants** below minimum stock\n"
            f"- 🚫 **{data.get('out_of_stock', 0)} variants** out of stock\n"
        )
        if recs:
            response += "\n**Recommendations:**\n"
            for r in recs:
                response += f"- 💡 {r}\n"
        response += "\nWould you like me to show specific details?"
        return {'message': response, 'confidence': 95}

    def format_best_sellers(self, data: dict, user) -> dict:
        items = data.get('items', [])
        if not items:
            return {'message': 'No sales data available for the last 30 days.', 'confidence': 90}
        response = f"## Best Selling Products ({data.get('period', 'last 30 days')})\n\n"
        for i, item in enumerate(items[:8], 1):
            response += (
                f"{i}. **{item['product_name']}** (SKU: {item.get('sku', 'N/A')})\n"
                f"   Units Sold: {item.get('units_sold', 0)} | "
                f"Revenue: ₹{item.get('revenue', 0):,.2f} | "
                f"Profit: ₹{item.get('profit', 0):,.2f}\n"
            )
        return {'message': response, 'confidence': 93}

    def format_forecast(self, data: dict, user) -> dict:
        forecasts = data.get('forecasts', [])
        if not forecasts:
            return {'message': 'No forecast data available yet.', 'confidence': 85}
        response = f"## Demand Forecasting\n\n"
        response += f"Analyzed **{data.get('total_variants', 0)} variants** | "
        response += f"**{data.get('high_risk_count', 0)}** at high risk of stockout\n\n"
        for f in forecasts[:5]:
            risk_icon = '🔴' if f.get('risk_level') == 'High Risk' else '🟡' if f.get('risk_level') == 'Medium Risk' else '🟢'
            response += (
                f"{risk_icon} **{f['product_name']}** (SKU: {f.get('sku', 'N/A')})\n"
                f"   Stock: {f.get('current_stock', 0)} | "
                f"Predicted 30d demand: **{f.get('demand_30_days', 'N/A')}** units | "
                f"Confidence: {f.get('confidence_score', 0)}% | "
                f"Trend: {f.get('sales_trend', 'Stable')}\n"
            )
        return {'message': response, 'confidence': 88}

    def format_health(self, data: dict, user) -> dict:
        score = data.get('score', 0)
        status = data.get('status', 'Unknown')
        icon = '🟢' if score >= 70 else '🟡' if score >= 40 else '🔴'
        response = f"## Inventory Health\n\n"
        response += f"{icon} **Overall Score: {score}/100** — {status}\n\n"
        response += f"**Summary:** {data.get('summary', '')}\n\n"
        strengths = data.get('strengths', [])
        issues = data.get('issues', [])
        if strengths:
            response += "**Strengths:**\n" + "\n".join(f"✅ {s}" for s in strengths[:3]) + "\n\n"
        if issues:
            response += "**Issues:**\n" + "\n".join(f"⚠️ {i}" for i in issues[:3]) + "\n\n"
        recommendations = data.get('recommendations', [])
        if recommendations:
            response += "**Recommendations:**\n" + "\n".join(f"💡 {r}" for r in recommendations[:3]) + "\n"
        return {'message': response, 'confidence': 94}

    def format_suppliers(self, data: dict, user) -> dict:
        scores = data.get('scores', [])
        recs = data.get('recommendations', [])
        if not scores:
            return {'message': 'No supplier data available.', 'confidence': 85}
        response = f"## Supplier Intelligence\n\n"
        if data.get('best_supplier'):
            response += f"**Best Performing Supplier:** {data['best_supplier']}\n\n"
        response += "**Supplier Scores:**\n"
        for s in scores[:5]:
            risk_icon = '🔴' if s.get('risk_level') == 'High Risk' else '🟡' if s.get('risk_level') == 'Medium Risk' else '🟢'
            response += (
                f"{risk_icon} **{s['supplier_name']}** — Overall Score: **{s.get('overall_score', 0)}/100** "
                f"| Delivery: {s.get('delivery_score', 0)} | Quality: {s.get('quality_score', 0)} | "
                f"Pricing: {s.get('pricing_score', 0)}\n"
            )
        risks = data.get('risks', {})
        high_risk = risks.get('high_risk', [])
        if high_risk:
            response += f"\n**⚠️ High Risk Suppliers:**\n"
            for r in high_risk[:3]:
                response += f"- {r.get('supplier_name')}: {', '.join(r.get('reasons', [])[:2])}\n"
        if recs:
            response += "\n**Recommendations:**\n"
            for r in recs:
                response += f"- 💡 {r}\n"
        return {'message': response, 'confidence': 92}

    def format_insights(self, data: dict, user) -> dict:
        response = "## Inventory Insights\n\n"
        best = data.get('best_seller')
        dead = data.get('dead_stock')
        slow = data.get('slow_moving')
        over = data.get('overstock')
        risk = data.get('stock_out_risk')
        profit = data.get('highest_profit')
        if best:
            response += f"**Best Seller:** {best.get('product_name')} — {best.get('units_sold', 0)} units sold, ₹{best.get('revenue', 0):,.2f}\n"
        if profit:
            response += f"**Highest Profit:** {profit.get('product_name')} — ₹{profit.get('profit', 0):,.2f} profit\n"
        if dead:
            response += f"**Dead Stock:** {dead.get('product_name')} — {dead.get('days_unsold', 0)} days unsold\n"
        if slow:
            response += f"**Slow Moving:** {slow.get('product_name')} — {slow.get('days_without_sale', 0)} days without sale\n"
        if over:
            response += f"**Overstock:** {over.get('product_name')} — {over.get('months_remaining', 0)} months of stock\n"
        if risk:
            response += f"**Stock-out Risk:** {risk.get('product_name')} — ~{risk.get('days_remaining', 0)} days remaining\n"
        recommendations = data.get('recommendations', [])
        if recommendations:
            response += "\n**AI Recommendations:**\n"
            for r in recommendations[:3]:
                response += f"- {r.get('message', '')}\n"
        if not any([best, dead, slow, over, risk, profit]):
            response += "No insights data available for the current period.\n"
        return {'message': response, 'confidence': 93}

    def format_sales(self, data: dict, user) -> dict:
        today = data.get('today_total', 0)
        month = data.get('month_total', 0)
        last = data.get('last_month_total', 0)
        count = data.get('transaction_count', 0)
        today_orders = data.get('today_orders', 0)
        avg_order = data.get('avg_order_value', 0)
        top_product = data.get('top_product')
        change = ((month - last) / last * 100) if last > 0 else 0
        direction = '📈' if change >= 0 else '📉'
        response = f"## Sales Summary\n\n"
        response += f"**Today's Revenue:** ₹{today:,.2f}\n"
        response += f"**Today's Orders:** {today_orders}\n"
        response += f"**Average Order Value:** ₹{avg_order:,.2f}\n"
        if top_product:
            response += f"**Top Selling Product Today:** {top_product}\n"
        response += f"**This Month:** ₹{month:,.2f}\n"
        response += f"{direction} **Change vs Last Month:** {change:+.1f}%\n"
        response += f"**Transactions ({data.get('period', 'last 30 days')}):** {count}\n"
        if change < 0:
            response += "\n**Recommendation:** Sales are trending down. Consider marketing promotions or reviewing pricing strategy."
        elif today == 0:
            response += "\n**Recommendation:** No sales recorded today yet. Check if operations are running normally."
        else:
            response += "\n**Recommendation:** Positive sales momentum. Keep monitoring inventory levels to meet demand."
        return {'message': response, 'confidence': 94}

    def format_purchases(self, data: dict, user) -> dict:
        response = f"## Purchase Summary\n\n"
        response += f"**This Month Total:** ₹{data.get('month_total', 0):,.2f}\n"
        response += f"**Transactions ({data.get('period', 'last 30 days')}):** {data.get('transaction_count', 0)}\n"
        response += f"**Pending Orders:** {data.get('pending_count', 0)}\n\n"
        recent = data.get('recent', [])
        if recent:
            response += "**Recent Purchases:**\n"
            for p in recent[:3]:
                response += f"- {p.get('invoice', 'N/A')} — {p.get('supplier', 'Unknown')} — ₹{p.get('total', 0):,.2f}\n"
        pending_count = data.get('pending_count', 0)
        if pending_count > 0:
            response += f"\n**Recommendation:** You have **{pending_count} pending orders** awaiting processing."
        else:
            response += "\n**Recommendation:** Procurement is up to date. Review lead times for optimal reorder planning."
        return {'message': response, 'confidence': 93}

    def format_products(self, data: dict, user) -> dict:
        response = f"## Product Overview\n\n"
        response += f"**Total Products:** {data.get('total_products', 0)}\n"
        response += f"**Active Products:** {data.get('active_products', 0)}\n\n"
        by_cat = data.get('by_category', [])
        if by_cat:
            response += "**Products by Category:**\n"
            for c in by_cat:
                response += f"- **{c['name']}**: {c['count']} products\n"
        return {'message': response, 'confidence': 95}

    def format_low_stock(self, data: dict, user) -> dict:
        items = data.get('items', [])
        if not items:
            return {'message': 'No products are currently below minimum stock levels.', 'confidence': 95}
        response = f"## Low Stock Products\n\n"
        response += f"Found **{len(items)} products** below minimum stock level:\n\n"
        for item in items[:10]:
            response += f"- **{item['product_name']}** (SKU: {item.get('sku', 'N/A')}) — Stock: **{item.get('stock', 0)}** | Min: {item.get('min_stock', 0)}\n"
        return {'message': response, 'confidence': 95}

    def format_search_results(self, data: dict, user) -> dict:
        results = data.get('results', [])
        query = data.get('query', '')
        if not results:
            return {'message': f'No results found for **"{query}"**. Try a different search term.', 'confidence': 90}
        response = f"## Search Results for \"{query}\"\n\n"
        for r in results[:10]:
            response += (
                f"- **{r.get('product_name', 'Unknown')}** — "
                f"SKU: {r.get('sku', 'N/A')} | "
                f"Stock: {r.get('stock', 0)} | "
                f"Price: ₹{r.get('price', 0):,.2f}\n"
            )
        return {'message': response, 'confidence': 93}

    def format_latest_purchases(self, data: dict, user) -> dict:
        purchases = data.get('purchases', [])
        if not purchases:
            return {'message': 'No purchase orders found.', 'confidence': 90}
        response = f"## Latest Purchase Orders\n\n"
        for p in purchases[:5]:
            response += f"- **{p.get('invoice', 'N/A')}** — {p.get('supplier', 'Unknown')} — ₹{p.get('total', 0):,.2f}\n"
        return {'message': response, 'confidence': 93}

    def format_supplier_list(self, data: dict, user) -> dict:
        suppliers = data.get('suppliers', [])
        if not suppliers:
            return {'message': 'No active suppliers found.', 'confidence': 90}
        response = f"## Supplier List\n\n"
        for s in suppliers[:10]:
            response += f"- **{s.get('name', 'Unknown')}** — {s.get('city', '')} | {s.get('email', '')}\n"
        return {'message': response, 'confidence': 93}

    def format_report_data(self, report_type: str, data: dict, user) -> dict:
        sub_formatters = {
            'Sales': lambda d: self.format_sales(d, user),
            'Purchase': lambda d: self.format_purchases(d, user),
            'Inventory': lambda d: self.format_inventory_summary(d, user),
            'Supplier': lambda d: self.format_suppliers(d, user),
            'Low Stock': lambda d: self.format_low_stock(data, user),
        }
        formatter = sub_formatters.get(report_type)
        if formatter:
            base = formatter(data)
        else:
            base = {'message': f"## {report_type}\n\nReport data is available for preview and export.", 'confidence': 85}
        base['message'] += (
            f"\n\n---\n"
            f"Use the buttons below to **Preview** the full data or **Export to Excel**."
        )
        return base

    def format_navigation(self, label: str, destination: str) -> dict:
        return {
            'message': (
                f"Navigating you to **{label}** now.\n\n"
                f"You can also use the sidebar menu to access {label} directly."
            ),
            'confidence': 95,
            'navigate_to': destination,
        }

    def format_unknown(self) -> dict:
        return {
            'message': (
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
            ),
            'confidence': 50,
        }

    def format_confirmation(self, action_description: str, confirm_label: str = 'Confirm',
                            cancel_label: str = 'Cancel') -> dict:
        return {
            'message': (
                f"{action_description}\n\n"
                f"Would you like me to proceed?"
            ),
            'confidence': 90,
            'requires_confirmation': True,
        }

    def format_action_result(self, result: dict) -> dict:
        return {
            'message': result.get('message', 'Action completed successfully.'),
            'confidence': 95,
        }

    def get_suggestions(self, intent: str, data: dict, user) -> list:
        suggestions_map = {
            'greeting': [
                'Which products need reorder?',
                'Show low stock products.',
                'Summarize inventory.',
                'Show best selling products.',
                'How is inventory health?',
                'Open Inventory page.',
            ],
            'help': [
                'Which products need reorder?',
                'Show me the inventory health.',
                'What are my best selling products?',
                'Predict next month\'s demand.',
            ],
            'reorder': [
                'Explain why these need reorder.',
                'Which supplier is best?',
                'Show inventory health.',
                'Generate report.',
                'View Inventory page.',
            ],
            'inventory_summary': [
                'Which products need reorder?',
                'Show low stock products.',
                'What is inventory health?',
                'Show dead stock items.',
                'Open Inventory page.',
            ],
            'low_stock': [
                'Create draft purchase orders.',
                'Which products need reorder?',
                'Show inventory health.',
                'View Inventory page.',
            ],
            'best_sellers': [
                'Which one has highest profit?',
                'Show slow moving products.',
                'Forecast demand.',
                'Generate Sales report.',
            ],
            'forecast': [
                'Will we have enough stock?',
                'Which products need reorder?',
                'Explain the trend.',
                'Show inventory health.',
            ],
            'health': [
                'What are my biggest issues?',
                'How to improve health score?',
                'Show slow moving items.',
                'Which categories need attention?',
            ],
            'suppliers': [
                'Compare supplier performance.',
                'Show supplier risk analysis.',
                'Open Supplier page.',
                'Generate Supplier report.',
            ],
            'insights': [
                'Show best selling products.',
                'What is inventory turnover?',
                'How to reduce dead stock?',
                'Show inventory health.',
            ],
            'sales': [
                'Show best selling products.',
                'What sold the most this month?',
                'Show purchase history.',
                'Generate Sales report.',
            ],
            'purchases': [
                'Show latest purchase orders.',
                'Which supplier is cheapest?',
                'Show pending purchases.',
                'Open Purchase page.',
            ],
            'products': [
                'How many low stock products?',
                'Show products by category.',
                'Search product by SKU.',
                'Open Products page.',
            ],
            'search_product': [
                'Show stock details.',
                'Check forecast for this product.',
                'Show sales history.',
                'View Products page.',
            ],
            'reports': [
                'Generate Sales report.',
                'Generate Inventory report.',
                'Generate Purchase report.',
                'Export PDF.',
            ],
            'navigation': [
                'Show dashboard.',
                'Show inventory health.',
                'Show supplier list.',
                'Which products need reorder?',
            ],
            'dashboard': [
                'Summarize inventory.',
                'Show best selling products.',
                'How is inventory health?',
                'Which products need reorder?',
            ],
            'analytics': [
                'Show best selling products.',
                'How is inventory health?',
                'Predict next month\'s demand.',
                'Show supplier performance.',
            ],
            'confirm_action': [
                'Which products need reorder?',
                'Summarize inventory.',
                'Show best selling products.',
                'How is inventory health?',
            ],
            'cancel_action': [
                'Which products need reorder?',
                'Summarize inventory.',
                'Show best selling products.',
                'How is inventory health?',
            ],
            'empty': [],
        }
        suggestions = suggestions_map.get(intent)
        if suggestions is not None:
            return suggestions
        if intent in ('follow_up', 'context_follow_up', 'general_knowledge', 'explain', 'unknown'):
            return [
                'Which products need reorder?',
                'Summarize inventory.',
                'Show best selling products.',
                'How is inventory health?',
            ]
        return [
            'Which products need reorder?',
            'Show low stock products.',
            'Summarize inventory.',
            'Show best selling products.',
        ]

    def get_knowledge_answer(self, message: str) -> str:
        msg = message.lower()
        for term, answer in ERP_KNOWLEDGE.items():
            if term.replace('_', ' ') in msg or term in msg:
                return answer
        return (
            "I can explain various inventory management concepts. "
            "You can ask me about: FIFO, LIFO, SKU, Barcode, QR Code, "
            "Inventory Turnover, Safety Stock, Lead Time, EOQ, or Reorder Point."
        )


response_generator = ResponseGenerator()
