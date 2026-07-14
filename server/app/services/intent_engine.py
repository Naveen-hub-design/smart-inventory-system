import re
from typing import List, Dict, Optional


INTENT_KEYWORDS = {
    'greeting': [
        'hello', 'hi ', 'hey', 'greetings', 'good morning', 'good afternoon',
        'good evening', 'howdy', 'hi there', 'hello there', 'morning',
        'afternoon', 'evening', 'what\'s up', 'sup', 'yo',
    ],
    'help': [
        'help', 'what can you do', 'how to use', 'capabilities',
        'what do you do', 'features', 'what are your capabilities',
        'what can i ask', 'how do you work', 'what can you help me with',
        'what commands', 'available commands', 'get started',
    ],
    'low_stock': [
        'show low stock', 'low stock product', 'low stock item',
        'below minimum', 'what is low', 'whats low', 'below stock',
        'items below', 'products below', 'running low', 'running out of stock',
        'stock running low', 'what stock is low', 'low on stock',
        'products low on stock', 'items low on stock', 'which items are low',
        'which products are low', 'low inventory', 'low stock alert',
        'stock alerts', 'minimum stock', 'below threshold',
    ],
    'reorder': [
        'reorder', 'running out', 'restock', 'need to order',
        'what should i order', 'order now', 'out of stock',
        'what do i need to reorder', 'what should i reorder',
        'products to reorder', 'items to reorder', 'reorder recommendation',
        'reorder suggestions', 'suggest reorder', 'needs reorder',
        'need reordering', 'place order', 'create purchase order',
        'what to buy', 'what to stock', 'supply',
    ],
    'inventory_summary': [
        'summarize inventory', 'inventory summary', 'stock summary',
        'show inventory', 'total stock', 'inventory status',
        'overview of inventory', 'stock overview', 'inventory overview',
        'inventory report', 'stock report', 'how much stock',
        'show me the inventory', 'inventory details',
        'what is my inventory', 'current stock', 'stock level',
        'inventory level', 'overview of stock',
    ],
    'best_sellers': [
        'best selling', 'top selling', 'most sold', 'what sold the most',
        'best seller', 'popular product', 'top product', 'highest selling',
        'most popular', 'top sellers', 'best performers',
        'which products sell best', 'what sells the most',
        'top performing', 'most revenue', 'highest revenue',
        'most profitable', 'highest profit', 'top profit',
    ],
    'forecast': [
        'forecast', 'predict', 'demand', 'next month', 'future sales',
        'expected sales', 'projected', 'upcoming demand', 'demand forecast',
        'sales prediction', 'future demand', 'what will sell',
        'predicted demand', 'stock prediction', 'inventory forecast',
        'upcoming trend', 'demand planning', 'what to expect',
        'sales forecast', 'predict sales',
    ],
    'health': [
        'health', 'how healthy', 'health score', 'inventory health',
        'system health', 'warehouse health', 'health status',
        'inventory health score', 'how is inventory', 'stock health',
        'overall health', 'health check', 'inventory check',
        'how healthy is my inventory', 'warehouse status',
    ],
    'suppliers': [
        'supplier', 'vendor', 'cheapest supplier', 'best supplier',
        'supplier performance', 'supplier rating', 'which supplier',
        'reliable supplier', 'compare supplier', 'supplier list',
        'show suppliers', 'who supplies', 'supplier score',
        'supplier intelligence', 'supplier analysis',
        'vendor list', 'list suppliers', 'top supplier',
        'supplier reliability', 'supplier delivery',
    ],
    'insights': [
        'dead stock', 'slow moving', 'overstock', 'excess stock',
        'not selling', 'obsolete', 'stagnant', 'inventory insights',
        'underperforming', 'waste', 'unsold', 'inventory analysis',
        'stock analysis', 'what isnt selling', 'what is not selling',
        'slow movers', 'overstocked', 'excess inventory',
    ],
    'sales': [
        'sale', 'revenue', 'how much sold', 'how much revenue',
        'total sales', "today's sale", 'todays sale', 'todays sales',
        "today's sales", 'sales summary', 'monthly sales',
        "today's revenue", 'todays revenue', 'sell today', 'sold today',
        'earn today', 'earnings', "today's business", 'todays business',
        'sales today', 'what did we sell', 'sales performance',
        'how are sales', 'sales figure', 'sales data', 'business today',
        'how much did we sell', 'sales report', 'revenue report',
        'what have we sold', 'our sales today', 'daily sales',
    ],
    'purchases': [
        'purchase', 'bought', 'procurement', 'received stock',
        'purchase history', 'recent purchase', 'pending purchase',
        'latest order', 'purchase order', 'what did we buy',
        'incoming stock', 'purchase list', 'orders',
        'recent orders', 'pending orders', 'goods received',
        'stock received', 'procurement status',
    ],
    'products': [
        'how many products', 'product list', 'product count',
        'products in', 'product', 'by category', 'product overview',
        'all products', 'list products', 'show products',
        'what products exist', 'product catalog', 'categories',
        'product categories', 'what categories',
    ],
    'search_product': [
        'search for product', 'search product', 'search item',
        'search sku', 'find product', 'find item', 'find sku',
        'look up product', 'lookup product', 'search for item',
        'look up item', 'lookup item', 'find by sku',
        'search by name', 'look for product', 'find by name',
    ],
    'reports': [
        'report', 'export', 'download', 'generate report',
        'print report', 'pdf', 'excel', 'csv',
        'create report', 'make report', 'get report',
        'report data', 'export data', 'download data',
    ],
    'navigation': [
        'navigate', 'navigate to', 'switch to', 'go to',
        'take me to', 'open', 'show me', 'go into',
        'visit', 'take me', 'move to', 'head to',
        'redirect me to', 'bring me to',
    ],
    'explain': [
        'explain', 'what is', 'meaning of', 'define',
        'tell me about', 'what does', 'how does',
    ],
    'general_knowledge': [
        'how does', 'how to', 'what does', 'tips', 'advice',
        'suggestion', 'best practice', 'recommend',
        'inventory management', 'erp', 'how can i',
        'what should', 'ways to',
    ],
    'dashboard': [
        'dashboard', 'home page', 'main page', 'overview',
        'show dashboard', 'main dashboard', 'home screen',
        'summary dashboard',
    ],
    'analytics': [
        'analytics', 'analysis', 'business intelligence',
        'data analysis', 'trends', 'business overview',
        'business summary', 'big picture', 'overall picture',
        'how is business', 'business performance',
    ],
}

NAV_PHRASE_PATTERNS = [
    (r'^\s*open\s+(the\s+)?(product|inventory|stock|sale|purchase|supplier|report|dashboard|setting|category|user|analytics|insight)', 'navigation'),
    (r'^\s*(go\s+to|take\s+me\s+to|switch\s+to|navigate\s+to|show\s+me|head\s+to|move\s+to|visit|bring\s+me\s+to)\s+(the\s+)?(product|inventory|stock|sale|purchase|supplier|report|dashboard|setting|category|user|analytics|insight)', 'navigation'),
]

SALES_PATTERNS = [
    r'\b(today\'?s?\s+(sale|revenue|business|earning|figure|summary))',
    r'\b(how\s+much\s+(did\s+we\s+)?(sell|earn|make|get))\b',
    r'\b(total\s+(sale|revenue|earning)s?\b)',
    r'\b(sale|revenue|sell|sold|earn|earning)s?\b',
    r'\b(daily\s+sales?|monthly\s+sales?|sales?\s+todays?)\b',
    r'\b(revenue\s+todays?|todays?\s+revenue)\b',
]

CONTEXT_QUALIFIERS = [
    'today', 'today\'s', 'todays', 'yesterday', 'yesterday\'s',
    'this week', 'this month', 'this year', 'last week',
    'last month', 'last year', 'only', 'just',
    'this quarter', 'last quarter',
    'inventory', 'stock', 'product', 'products',
    'material', 'materials', 'category',
    'low stock', 'low', 'out of stock',
    'only today', 'only this week', 'only this month',
    'for today', 'for this week', 'for this month',
]


class IntentEngine:

    def detect(self, message: str, context: Optional[List[Dict]] = None,
               has_pending_action: bool = False) -> str:
        msg = message.lower().strip()

        if msg in ('', ' ', '.'):
            return 'empty'

        if has_pending_action:
            if re.search(r'^\s*(yes|yeah|sure|okay?|ok\b|confirm|proceed|go\s+ahead|do\s+it|please\s+do|correct|right|that\'?s?\s+right|absolutely|definitely)\s*$', msg, re.IGNORECASE):
                return 'confirm_action'
            if re.search(r'^\s*(no|nope|nah|cancel|stop|never\s+mind|forget\s+it|don\'?t|do\s+not|abort|not\s+now|maybe\s+later|skip)\s*$', msg, re.IGNORECASE):
                return 'cancel_action'

        if self._is_context_qualifier(msg, context):
            return 'context_follow_up'

        intent = self._check_explicit_nav(msg)
        if intent:
            return intent

        intent = self._check_keywords(msg)
        if intent:
            return intent

        if self._match_sales(msg):
            return 'sales'

        intent = self._check_follow_up(msg, context)
        if intent:
            return intent

        return 'unknown'

    def _is_context_qualifier(self, msg: str, context: Optional[List[Dict]]) -> bool:
        if not context or len(context) == 0:
            return False
        msg_clean = msg.lower().strip()
        for qualifier in CONTEXT_QUALIFIERS:
            if qualifier in msg_clean:
                return True
        return False

    def _check_explicit_nav(self, msg: str) -> Optional[str]:
        for pattern, intent in NAV_PHRASE_PATTERNS:
            if re.search(pattern, msg, re.IGNORECASE):
                return intent
        return None

    _KEYWORD_INTENTS = [
        'explain', 'greeting', 'help', 'low_stock', 'reorder',
        'best_sellers', 'forecast', 'health', 'suppliers', 'insights',
        'reports', 'search_product', 'purchases', 'products',
        'inventory_summary', 'navigation', 'general_knowledge',
        'dashboard', 'analytics',
    ]

    @staticmethod
    def _has_keyword(msg: str, keyword: str) -> bool:
        if keyword not in msg:
            return False
        pattern = r'\b' + re.escape(keyword)
        if ' ' in keyword:
            pattern += r'\b'
        return bool(re.search(pattern, msg, re.IGNORECASE))

    def _check_keywords(self, msg: str) -> Optional[str]:
        for intent in self._KEYWORD_INTENTS:
            if any(self._has_keyword(msg, kw) for kw in INTENT_KEYWORDS[intent]):
                if intent == 'explain':
                    return self._check_explain_term(msg)
                return intent
        return None

    def _match_sales(self, msg: str) -> bool:
        for pattern in SALES_PATTERNS:
            if re.search(pattern, msg, re.IGNORECASE):
                return True
        return any(kw in msg for kw in INTENT_KEYWORDS['sales'])

    def _check_follow_up(self, msg: str, context: Optional[List[Dict]]) -> Optional[str]:
        if not context or len(context) == 0:
            return None
        follow_kw = ['it', 'that', 'those', 'them', 'this', 'previous',
                     'that one', 'first one', 'second one', 'last one',
                     'the first', 'the second', 'the third', 'the last',
                     'the top', 'the best', 'the highest',
                     'more details', 'tell me more', 'expand',
                     'elaborate', 'go on', 'continue',
                     'the first one', 'the second one', 'the last one',
                     'the top one', 'the best one', 'the highest one']
        if any(kw in msg for kw in follow_kw):
            return 'follow_up'
        return None

    def _check_explain_term(self, msg: str) -> str:
        EXPLAIN_TERMS = [
            'fifo', 'lifo', 'sku', 'barcode', 'qr code', 'qr_code',
            'inventory turnover', 'safety stock', 'lead time', 'eoq',
            'economic order quantity', 'reorder point',
            'abc analysis', 'cycle count', 'perpetual inventory',
            'dropshipping', 'just in time', 'jit',
        ]
        for term in EXPLAIN_TERMS:
            normalized = term.replace(' ', '_')
            alt_term = term.replace(' ', '')
            if term in msg or alt_term in msg:
                return f'explain_{normalized}'
        return 'explain'


intent_engine = IntentEngine()
