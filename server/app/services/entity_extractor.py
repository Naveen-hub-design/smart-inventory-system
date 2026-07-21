import re
from typing import Dict, List, Optional, Any
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.models.supplier import Supplier
from app.models.category import Category


class EntityExtractor:
    DATE_PATTERNS = [
        (r'(?:last|past|this)\s+(\d+)\s+(day|week|month|year)s?', lambda m: f'{m.group(1)} {m.group(2)}'),
        (r'(?:from|since|after)\s+(\d{4}[-/]\d{1,2}[-/]\d{1,2})', lambda m: m.group(1)),
        (r'(?:until|to|before)\s+(\d{4}[-/]\d{1,2}[-/]\d{1,2})', lambda m: m.group(1)),
        (r'(?:in|during|for)\s+(?:the\s+)?(last|past|this|current)\s+(day|week|month|year|quarter)', lambda m: f'{m.group(1)} {m.group(2)}'),
        (r'\b(today|yesterday|this\s+week|this\s+month|this\s+year|last\s+week|last\s+month|last\s+year)\b', lambda m: m.group(1).lower()),
        (r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})', lambda m: m.group(1)),
    ]

    SIZE_PATTERNS = [
        r'\b(XS|S|M|L|XL|XXL|XXXL|2XL|3XL)\b',
        r'\b(\d+)\s*(ml|liter|kg|g|cm|inch|oz|lb)s?\b',
        r'\bsize\s+(\d+)\b',
        r'\bsize\s+(XS|S|M|L|XL|XXL|XXXL)\b',
    ]

    COLOR_PATTERNS = [
        r'\b(red|blue|green|black|white|yellow|pink|purple|orange|brown|grey|gray|navy|teal|maroon|beige|cream|gold|silver|bronze|multicolor|rainbow)\b',
    ]

    def extract(self, message: str, session_entities: Optional[Dict] = None) -> Dict[str, Any]:
        msg = message.lower().strip()
        entities = {
            'product_name': None,
            'sku': None,
            'supplier_name': None,
            'category_name': None,
            'size': None,
            'color': None,
            'date_range': None,
            'product': None,
            'variant': None,
            'supplier': None,
            'category': None,
            'index_ref': None,
        }
        self._extract_sku(msg, entities)
        self._extract_product(msg, entities)
        self._extract_supplier(msg, entities)
        self._extract_category(msg, entities)
        self._extract_size(msg, entities)
        self._extract_color(msg, entities)
        self._extract_date_range(msg, entities)
        self._extract_index_ref(msg, entities)

        if session_entities:
            self._resolve_session_refs(entities, session_entities)

        return entities

    def _extract_sku(self, msg: str, entities: Dict):
        match = re.search(r'\b([A-Za-z]{2,6}-\d{3,6}|[A-Za-z]{2,6}-\d{2,4}-[A-Za-z0-9]{1,4})\b', msg)
        if match:
            sku = match.group(1).upper()
            variant = ProductVariant.query.filter_by(sku=sku).first()
            if variant:
                entities['sku'] = sku
                entities['variant'] = variant
                entities['product'] = variant.product
                entities['product_name'] = variant.product.product_name if variant.product else None

    def _extract_product(self, msg: str, entities: Dict):
        if entities['product']:
            return
        products = Product.query.filter(Product.status == 'active').all()
        for p in products:
            name_lower = p.product_name.lower()
            if name_lower in msg or any(word in msg for word in name_lower.split() if len(word) > 3):
                entities['product_name'] = p.product_name
                entities['product'] = p
                break

    def _extract_supplier(self, msg: str, entities: Dict):
        suppliers = Supplier.query.filter(Supplier.status == 'active').all()
        for s in suppliers:
            name_lower = s.supplier_name.lower()
            if name_lower in msg:
                entities['supplier_name'] = s.supplier_name
                entities['supplier'] = s
                break

    def _extract_category(self, msg: str, entities: Dict):
        categories = Category.query.all()
        for c in categories:
            name_lower = c.name.lower()
            if name_lower in msg:
                entities['category_name'] = c.name
                entities['category'] = c
                break

    def _extract_size(self, msg: str, entities: Dict):
        for pattern in self.SIZE_PATTERNS:
            match = re.search(pattern, msg, re.IGNORECASE)
            if match:
                entities['size'] = match.group(1).upper()
                break

    def _extract_color(self, msg: str, entities: Dict):
        for pattern in self.COLOR_PATTERNS:
            match = re.search(pattern, msg, re.IGNORECASE)
            if match:
                entities['color'] = match.group(1).lower()
                break

    def _extract_date_range(self, msg: str, entities: Dict):
        for pattern, formatter in self.DATE_PATTERNS:
            match = re.search(pattern, msg, re.IGNORECASE)
            if match:
                entities['date_range'] = formatter(match)
                break

    def _extract_index_ref(self, msg: str, entities: Dict):
        patterns = [
            (r'\b(the\s+)?first\s+one\b', 0),
            (r'\b(the\s+)?second\s+one\b', 1),
            (r'\b(the\s+)?third\s+one\b', 2),
            (r'\b(the\s+)?last\s+one\b', -1),
            (r'\b(the\s+)?top\s+one\b', 0),
            (r'\b(the\s+)?first\s+item\b', 0),
            (r'\b(the\s+)?(top|best|highest)\b', 0),
        ]
        for pattern, idx in patterns:
            if re.search(pattern, msg, re.IGNORECASE):
                entities['index_ref'] = idx
                break

    def _resolve_session_refs(self, entities: Dict, session_entities: Dict):
        if entities.get('index_ref') is not None and not entities.get('product_name'):
            idx = entities['index_ref']
            prev_results = session_entities.get('results', [])
            if prev_results and idx < len(prev_results):
                item = prev_results[idx]
                entities['product_name'] = item.get('product_name')
                entities['sku'] = item.get('sku')

    def extract_from_context(self, context: List[Dict]) -> Dict[str, Any]:
        merged = {'product_name': None, 'sku': None, 'supplier_name': None, 'category_name': None,
                  'size': None, 'color': None, 'date_range': None, 'results': []}
        for msg in reversed(context):
            if msg.get('role') == 'assistant':
                md = msg.get('metadata', {})
                data = md.get('data', {})
                if 'items' in data:
                    merged['results'] = data['items']
                elif 'forecasts' in data:
                    merged['results'] = data['forecasts']
                elif 'scores' in data:
                    merged['results'] = data['scores']
        return merged


entity_extractor = EntityExtractor()
