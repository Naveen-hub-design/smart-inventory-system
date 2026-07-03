import uuid
from datetime import datetime

def generate_barcode(prefix='SIMS'):
    return f"{prefix}{uuid.uuid4().hex[:8].upper()}"

def generate_invoice(prefix='INV'):
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

def format_currency(amount):
    return f"₹{float(amount):,.2f}"

def validate_email(email):
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_phone(phone):
    import re
    pattern = r'^\+?[\d\s-]{10,15}$'
    return re.match(pattern, phone) is not None
