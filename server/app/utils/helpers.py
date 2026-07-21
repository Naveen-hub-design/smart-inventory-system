import uuid
from datetime import datetime


def parse_date(date_str):
    if not date_str:
        return None
    try:
        return datetime.fromisoformat(date_str)
    except (ValueError, TypeError):
        return None


def generate_barcode(prefix='SIMS'):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"


def generate_invoice(prefix='INV'):
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
