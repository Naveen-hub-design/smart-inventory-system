import os
import uuid
import hashlib
import qrcode
from io import BytesIO
import base64
import re

CATEGORY_CODES = {
    "Men's Wear": "MEN",
    "Women's Wear": "WOM",
    "Kids Wear": "KID",
    "Accessories": "ACC",
    "Sports Wear": "SPT",
    "Winter Wear": "WIN",
}

COLOR_CODES = {
    "Black": "BLK", "White": "WHT", "Red": "RED", "Blue": "BLU",
    "Navy Blue": "NVY", "Sky Blue": "SKY", "Royal Blue": "ROY",
    "Green": "GRN", "Olive Green": "OLG",
    "Yellow": "YLW", "Orange": "ORG", "Purple": "PRP", "Pink": "PNK",
    "Brown": "BRN", "Grey": "GRY", "Dark Grey": "DGY", "Light Grey": "LGY",
    "Maroon": "MRN", "Beige": "BGE", "Cream": "CRM", "Khaki": "KHK",
    "Gold": "GLD", "Silver": "SLV",
    # Aliases / legacy
    "Navy": "NAV", "Olive": "OLV", "Tan": "TAN", "Ivory": "IVY",
    "Charcoal": "CHR", "Indigo": "IND", "Multi": "MLT", "Various": "VAR",
}

PRODUCT_CODE_MAP = {
    "Cotton T-Shirt": "CTN",
    "Polo T-Shirt": "POL",
    "Hoodie": "HOD",
    "Sweatshirt": "SWT",
    "Denim Jacket": "DNJ",
    "Leather Jacket": "LTH",
    "Bomber Jacket": "BMB",
    "Blazer": "BLZ",
    "Waistcoat": "WST",
    "Sherwani": "SWN",
    "Jeans": "JNS",
    "Chinos": "CHN",
    "Cargo Trousers": "CRG",
    "Formal Trousers": "FTR",
    "Joggers": "JGR",
    "Track Pants": "TRK",
    "Shorts": "SHT",
    "Formal Shirt": "FSH",
    "Casual Shirt": "CSH",
    "Printed T-Shirt": "PTS",
    "V-Neck T-Shirt": "VNT",
    "Crew Neck T-Shirt": "CRW",
    "Slim Fit Shirt": "SFS",
    "Kurta": "KRT",
    "Kurta Pyjama Set": "KPS",
    "Cotton Kurta": "CKR",
    "Kurti": "KUR",
    "Anarkali Dress": "ANK",
    "Lehenga Choli": "LHN",
    "Saree": "SAR",
    "Salwar Kameez": "SLW",
    "Leggings": "LEG",
    "Yoga Pants": "YOG",
    "Maxi Dress": "MXD",
    "Party Gown": "GWN",
    "Top & Skirt Set": "TPS",
    "Tunic Top": "TUN",
    "Palazzo Pants": "PLZ",
    "Capri Pants": "CAP",
    "Shrug": "SRG",
    "Night Suit": "NTS",
    "Kaftan": "KFT",
    "Sweater": "SWR",
    "Cardigan": "CRD",
    "Down Jacket": "DNJ",
    "Fleece Jacket": "FLJ",
    "Overcoat": "OVC",
    "Thermal Wear": "THR",
    "Winter Coat": "WCT",
    "Sports Jersey": "JER",
    "Track Jacket": "TRJ",
    "Gym Vest": "GVM",
    "Swim Trunks": "SWM",
    "Base Layer": "BAS",
    "Sports Bra": "SBR",
    "Sports Tights": "STI",
    "Cap": "CAP",
    "Baseball Cap": "BCP",
    "Beanie Hat": "BEN",
    "Leather Belt": "BLT",
    "Silk Scarf": "SCF",
    "Muffler": "MUF",
    "Sunglasses": "SUN",
    "Wallet": "WAL",
    "Tie": "TIE",
    "Cufflinks": "CUF",
    "Socks": "SCK",
    "Hand Gloves": "GLV",
    "Suspenders": "SUS",
    "Bow Tie": "BOW",
    "Hair Band": "HRB",
    "Kids T-Shirt": "KTS",
    "Kids Polo": "KPL",
    "Kids Jeans": "KJN",
    "Kids Shorts": "KSH",
    "Kids Frock": "KFR",
    "Kids Party Dress": "KPD",
    "School Uniform": "SCH",
    "School Pants": "SCP",
    "Kids Sweater": "KSW",
    "Kids Jacket": "KJK",
    "Kids Tracksuit": "KTR",
    "Kids Kurta": "KKU",
    "Kids Leggings": "KLG",
    "Baby Bodysuit": "BBS",
    "Kids Night Suit": "KNS",
    "Kids Swimwear": "KSW",
    "Kids Raincoat": "KRN",
    "Dungaree": "DNG",
    "Kids Ethnic Set": "KES",
    "T-Shirt": "TSH",
    "Jacket": "JCK",
    "Dress": "DRS",
    "Shirt": "SHT",
    "Pants": "PNT",
    "Skirt": "SKT",
    "Blouse": "BLS",
    "Top": "TOP",
    "Coat": "COT",
}


def get_category_code(category_name):
    return CATEGORY_CODES.get(category_name, "GEN")


def get_product_code(product_name):
    if not product_name:
        return "PRD"
    name = product_name.strip()
    if name in PRODUCT_CODE_MAP:
        return PRODUCT_CODE_MAP[name]
    for key, code in PRODUCT_CODE_MAP.items():
        if name.startswith(key + " ") or name.startswith(key + " -"):
            return code
    words = name.split()
    if len(words) >= 3:
        raw = "".join(w[0] for w in words[:3]).upper()
        clean = re.sub(r'[^A-Z]', '', raw)
        if len(clean) >= 3:
            return clean[:3]
        return (clean + 'XXX')[:3]
    if len(words) == 2:
        raw = (words[0][0] + words[1][:2]).upper()
        clean = re.sub(r'[^A-Z]', '', raw)
        if len(clean) >= 3:
            return clean[:3]
        return (clean + 'XXX')[:3]
    clean = re.sub(r'[^A-Za-z]', '', name)
    if len(clean) >= 3:
        return clean[:3].upper()
    return (clean.upper() + 'XXX')[:3]


def get_color_code(color):
    if not color:
        return "GEN"
    if color in COLOR_CODES:
        return COLOR_CODES[color]
    clean = re.sub(r'[^A-Za-z]', '', color)
    if clean:
        return (clean.upper() + 'XXX')[:3]
    return "GEN"


def generate_sku(product, variant, sequence):
    cat_code = get_category_code(product.category.name if product.category else None)
    prod_code = get_product_code(product.product_name)
    col_code = get_color_code(variant.color)
    size_part = (variant.size or "OS").replace("-", "").replace(" ", "").upper()[:4]
    seq = f"{sequence:04d}"
    parts = [cat_code, prod_code, col_code, size_part, seq]
    parts = [p for p in parts if p]
    return "-".join(parts)


def generate_barcode_value(sku=None):
    if sku:
        num = int(hashlib.md5(sku.encode()).hexdigest()[:12], 16) % 10**12
        return f"{num:012d}"
    return str(uuid.uuid4().int)[:13]


def generate_qr_code_image(variant, product, category_name=None):
    data = (
        f"Product: {product.product_name}\n"
        f"SKU: {variant.sku}\n"
        f"Barcode: {variant.barcode}\n"
        f"Category: {category_name or (product.category.name if product.category else 'N/A')}\n"
        f"Color: {variant.color or 'N/A'}\n"
        f"Size: {variant.size or 'N/A'}\n"
        f"Price: \u20b9{variant.selling_price}\n"
        f"Stock: {variant.stock}"
    )
    qr = qrcode.QRCode(box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    return img


def save_qr_code_file(variant, product, qr_dir):
    os.makedirs(qr_dir, exist_ok=True)
    filename = f"qr_{variant.sku}.png"
    category_name = product.category.name if product.category else None
    img = generate_qr_code_image(variant, product, category_name)
    filepath = os.path.join(qr_dir, filename)
    img.save(filepath)
    return filename
