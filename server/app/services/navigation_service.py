import re
from typing import Dict, List, Optional


NAVIGATION_MAP = [
    (r'\b(dashboard|home|main|overview|homepage)\b', '/dashboard', 'Dashboard'),
    (r'\b(inventory|stock|warehouse|storage|stocks)\b', '/inventory', 'Inventory'),
    (r'\b(product|products|item|items|category|categories|catalog)\b', '/products', 'Products'),
    (r'\b(sale|sales|revenue|order|orders|selling)\b', '/sales', 'Sales'),
    (r'\b(purchase|purchases|procurement|buy|bought|ordering|goods\s+receipt)\b', '/purchases', 'Purchases'),
    (r'\b(supplier|suppliers|vendor|vendors|supply|supplies)\b', '/suppliers', 'Suppliers'),
    (r'\b(report|reports|export|insight|insights|analytics|bi|business\s+intelligence)\b', '/reports', 'Reports'),
    (r'\b(user|users|staff|employee|team|personnel)\b', '/users', 'Users'),
    (r'\b(setting|settings|configuration|preference|preferences|config)\b', '/settings', 'Settings'),
    (r'\b(ai|intelligence|copilot|assistant)\b', '/ai-intelligence', 'AI Intelligence'),
]

SECTION_KEYWORDS = {
    'inventory': ['low stock', 'dead stock', 'overstock', 'stock', 'inventory', 'warehouse'],
    'products': ['product', 'item', 'sku', 'category'],
    'sales': ['sale', 'revenue', 'order', 'selling'],
    'purchases': ['purchase', 'procurement', 'buy'],
    'suppliers': ['supplier', 'vendor'],
    'reports': ['report', 'export'],
}


class NavigationService:

    def resolve(self, message: str) -> Dict:
        msg = message.lower().strip()

        for pattern, destination, label in NAVIGATION_MAP:
            if re.search(pattern, msg, re.IGNORECASE):
                return {
                    'destination': destination,
                    'label': label,
                    'confidence': 95,
                }

        return {
            'destination': '/dashboard',
            'label': 'Dashboard',
            'confidence': 85,
        }

    def matches_section(self, message: str, section: str) -> bool:
        msg = message.lower().strip()
        keywords = SECTION_KEYWORDS.get(section, [])
        return any(kw in msg for kw in keywords)


navigation_service = NavigationService()
