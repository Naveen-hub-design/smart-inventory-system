import os
import sys
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import (
    User, Category, Supplier, RawMaterial, Product,
    Purchase, PurchaseItem, Sale, SaleItem,
    InventoryLog, Notification, AuditLog, ProductVariant
)
from app.services.code_generator import generate_sku, generate_barcode_value, save_qr_code_file, CATEGORY_CODES, COLOR_CODES

app = create_app()

# ---------------------------------------------------------------------------
# DATA LISTS
# ---------------------------------------------------------------------------

CATEGORIES = [
    'Men\'s Wear', 'Women\'s Wear', 'Kids Wear',
    'Accessories', 'Sports Wear', 'Winter Wear'
]

CATEGORY_DESCRIPTIONS = {
    'Men\'s Wear': 'Casual and formal clothing for men',
    'Women\'s Wear': 'Stylish apparel and traditional wear for women',
    'Kids Wear': 'Comfortable clothing for children of all ages',
    'Accessories': 'Belts, caps, scarves and other fashion accessories',
    'Sports Wear': 'Athletic clothing and activewear',
    'Winter Wear': 'Cold-weather clothing and outerwear',
}

SUPPLIERS = [
    ('ABC Textiles', 'Rajesh Kumar', '9876543210', 'rajesh@abctextiles.com', '12, Industrial Area, Mumbai - 400001', '27AABC1234D1Z5'),
    ('South India Cotton Mills', 'Venkatesh Iyer', '9876543211', 'venkatesh@sicmills.com', '45, Textile Street, Coimbatore - 641001', '33ASDF5678E1Z6'),
    ('Chennai Fabrics', 'Sundaram Pillai', '9876543212', 'sundaram@chennaifabrics.com', '78, Mount Road, Chennai - 600002', '33GHIJ9012F1Z7'),
    ('Tiruppur Garments', 'Karthikeyan M', '9876543213', 'karthik@tiruppurgarments.com', '234, SIPCOT Complex, Tiruppur - 641606', '33KLMW3456G1Z8'),
    ('Coimbatore Threads', 'Natarajan S', '9876543214', 'natarajan@cbehreads.com', '56, North Street, Coimbatore - 641002', '33NPQR7890H1Z9'),
    ('Royal Textile Traders', 'Amit Shah', '9876543215', 'amit@royaltextiles.com', '89, Textile Market, Delhi - 110006', '07STUV1234J1Z0'),
    ('Prime Clothing Suppliers', 'Vikram Singh', '9876543216', 'vikram@primeclothing.com', '122, MG Road, Bengaluru - 560001', '29WXYZ5678K1Z1'),
    ('Elite Fashion House', 'Priya Sharma', '9876543217', 'priya@elitefashion.com', '45, Fashion Street, Mumbai - 400005', '27ABCD9012L1Z2'),
    ('Classic Fabrics', 'Ravi Verma', '9876543218', 'ravi@classicfabrics.com', '67, Park Street, Kolkata - 700016', '19EFGH3456M1Z3'),
    ('Modern Textile Works', 'Suresh Reddy', '9876543219', 'suresh@moderntextiles.com', '34, Industrial Estate, Hyderabad - 500033', '36IJKL7890N1Z4'),
    ('Gujarat Synthetics', 'Dinesh Patel', '9876543220', 'dinesh@gujsynth.com', '89, GIDC, Surat - 394210', '24MNOP1234P1Z5'),
    ('Ludhiana Woolen Mills', 'Harpreet Singh', '9876543221', 'harpreet@ludwoolen.com', '112, Focal Point, Ludhiana - 141010', '03QRST5678Q1Z6'),
    ('Bangalore Silk House', 'Anita Devi', '9876543222', 'anita@blrsilk.com', '78, Commercial Street, Bengaluru - 560001', '29UVWX9012R1Z7'),
    ('Jaipur Cotton Traders', 'Rahul Sharma', '9876543223', 'rahul@jaipurcotton.com', '56, Johari Bazaar, Jaipur - 302003', '08YZAB3456S1Z8'),
    ('Kanpur Leather Goods', 'Mohd Irfan', '9876543224', 'irfan@kanpurleather.com', '23, Leather Complex, Kanpur - 208001', '09CDEF7890T1Z9'),
    ('Punjab Textile Mills', 'Gurpreet Kaur', '9876543225', 'gurpreet@punjabtextiles.com', '90, GT Road, Amritsar - 143001', '03GHIJ1234U1Z0'),
    ('Ahmedabad Denim Co', 'Nikhil Shah', '9876543226', 'nikhil@ahmedenim.com', '45, Denim Park, Ahmedabad - 380001', '24KLMN5678V1Z1'),
    ('Himachal Woolens', 'Rajiv Thakur', '9876543227', 'rajiv@himwoolens.com', '67, Industrial Area, Solan - 173212', '02OPQR9012W1Z2'),
    ('Kerala Cotton Corporation', 'Saji Thomas', '9876543228', 'saji@keralacotton.com', '12, Textile Town, Thrissur - 680001', '32STUV3456X1Z3'),
    ('Eastern Silk Mills', 'Subrata Das', '9876543229', 'subrata@easternsilkmills.com', '78, Silk Road, Murshidabad - 742101', '19WXYZ7890Y1Z4'),
]

RAW_MATERIALS = [
    ('Cotton Fabric - White', 'Meters', 180, 5000, 10),
    ('Cotton Fabric - Black', 'Meters', 190, 4000, 10),
    ('Cotton Fabric - Blue', 'Meters', 185, 4500, 10),
    ('Denim Fabric - Indigo', 'Meters', 350, 3000, 8),
    ('Denim Fabric - Black', 'Meters', 360, 2500, 8),
    ('Polyester Fabric', 'Meters', 120, 8000, 15),
    ('Linen Fabric', 'Meters', 420, 2000, 5),
    ('Silk Fabric', 'Meters', 850, 1000, 3),
    ('Viscose Fabric', 'Meters', 250, 3500, 8),
    ('Rayon Fabric', 'Meters', 230, 3000, 8),
    ('Woolen Fabric', 'Meters', 650, 1500, 5),
    ('Nylon Fabric', 'Meters', 160, 6000, 12),
    ('Spandex Fabric', 'Meters', 280, 2500, 6),
    ('Cotton Thread - White', 'Spools', 45, 10000, 20),
    ('Cotton Thread - Black', 'Spools', 45, 8000, 20),
    ('Polyester Thread', 'Spools', 38, 12000, 25),
    ('Metal Buttons - Silver', 'Gross', 120, 5000, 15),
    ('Plastic Buttons - White', 'Gross', 60, 8000, 20),
    ('Plastic Buttons - Black', 'Gross', 60, 7000, 20),
    ('Zipper - 6 inch', 'Pieces', 12, 15000, 30),
    ('Zipper - 8 inch', 'Pieces', 15, 12000, 30),
    ('Zipper - 10 inch', 'Pieces', 18, 10000, 25),
    ('Elastic - 1 inch', 'Meters', 25, 20000, 40),
    ('Elastic - 2 inch', 'Meters', 35, 15000, 30),
    ('Hook & Eye', 'Pieces', 2, 50000, 100),
    ('Label - Woven', 'Pieces', 5, 25000, 50),
    ('Label - Printed', 'Pieces', 3, 30000, 60),
    ('Packing Poly Bag', 'Pieces', 4, 50000, 100),
    ('Carton Box', 'Pieces', 35, 10000, 20),
    ('Hangers - Plastic', 'Pieces', 8, 30000, 50),
]

PRODUCT_TEMPLATES = [
    # (name, category, size_variants, color_variants, price_range, cost_range, min_stock)
    ('Cotton Crew Neck T-Shirt', 'Men\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['White', 'Black', 'Navy', 'Grey'], (399, 699), (180, 320), 15),
    ('Polo T-Shirt', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['White', 'Black', 'Blue', 'Red', 'Green'], (699, 1199), (320, 550), 10),
    ('Slim Fit Formal Shirt', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['White', 'Blue', 'Light Blue', 'Pink'], (899, 1599), (420, 750), 10),
    ('Casual Check Shirt', 'Men\'s Wear', ['S', 'M', 'L', 'XL'], ['Red Check', 'Blue Check', 'Black Check'], (749, 1299), (350, 600), 12),
    ('Denim Jacket', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['Indigo', 'Black', 'Grey'], (1999, 3499), (950, 1600), 6),
    ('Slim Fit Jeans', 'Men\'s Wear', ['28', '30', '32', '34', '36', '38'], ['Blue', 'Black', 'Grey'], (999, 1999), (480, 900), 12),
    ('Cargo Trousers', 'Men\'s Wear', ['30', '32', '34', '36'], ['Khaki', 'Olive', 'Black', 'Navy'], (1199, 1899), (550, 880), 8),
    ('Track Pants', 'Men\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey'], (599, 999), (280, 460), 15),
    ('Cotton Shorts', 'Men\'s Wear', ['S', 'M', 'L', 'XL'], ['Grey', 'Navy', 'Black', 'Green'], (449, 749), (210, 350), 12),
    ('Formal Trousers', 'Men\'s Wear', ['30', '32', '34', '36', '38'], ['Black', 'Grey', 'Navy'], (1299, 2199), (600, 1000), 8),
    ('Blazer', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Charcoal'], (4999, 8999), (2400, 4200), 4),
    ('Waistcoat', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['Black', 'Grey', 'Navy'], (1499, 2499), (700, 1200), 6),
    ('Sherwani', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['Ivory', 'Maroon', 'Navy', 'Black'], (3999, 7999), (1900, 3800), 3),
    ('Kurta Pyjama Set', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['White', 'Beige', 'Blue', 'Green'], (1299, 2299), (600, 1050), 8),
    ('Hoodie', 'Men\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey', 'Olive'], (1499, 2499), (700, 1180), 8),
    ('Sweatshirt', 'Men\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Grey', 'Navy', 'Black', 'Maroon'], (1199, 1899), (550, 880), 10),
    ('Cotton Kurta', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['White', 'Blue', 'Black'], (899, 1499), (420, 700), 10),
    ('Printed T-Shirt', 'Men\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['White', 'Black', 'Navy'], (499, 899), (230, 410), 20),
    ('V-Neck T-Shirt', 'Men\'s Wear', ['S', 'M', 'L', 'XL'], ['White', 'Black', 'Grey', 'Navy'], (349, 599), (160, 280), 18),
    ('Jacket - Bomber', 'Men\'s Wear', ['M', 'L', 'XL', 'XXL'], ['Black', 'Green', 'Navy', 'Brown'],(2499, 3999), (1200, 1900), 5),

    ('Cotton Kurti', 'Women\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Red', 'Blue', 'Green', 'Pink', 'Yellow'], (799, 1499), (380, 700), 12),
    ('Anarkali Dress', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Red', 'Maroon', 'Green', 'Blue', 'Pink'], (2499, 4999), (1200, 2400), 5),
    ('Lehenga Choli', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Red', 'Pink', 'Blue', 'Green', 'Gold'], (3999, 8999), (1900, 4200), 3),
    ('Saree - Silk', 'Women\'s Wear', ['Free'], ['Red', 'Blue', 'Green', 'Purple', 'Gold'], (2999, 5999), (1400, 2800), 5),
    ('Saree - Cotton', 'Women\'s Wear', ['Free'], ['Red', 'Blue', 'Green', 'Yellow', 'White'], (999, 1999), (480, 950), 8),
    ('Salwar Kameez', 'Women\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Red', 'Blue', 'Green', 'Pink', 'Purple'], (1299, 2499), (620, 1200), 8),
    ('Top & Skirt Set', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['White', 'Black', 'Pink', 'Blue'], (899, 1599), (420, 750), 10),
    ('Leggings', 'Women\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey', 'Maroon'], (399, 699), (190, 330), 20),
    ('Yoga Pants', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Grey', 'Purple'], (699, 1199), (330, 560), 12),
    ('Maxi Dress', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Red', 'Blue', 'Green', 'Yellow', 'White'], (1499, 2999), (700, 1400), 6),
    ('Party Wear Gown', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Red', 'Blue', 'Pink', 'Purple', 'Gold'],(2999, 5999), (1400, 2800), 4),
    ('Blouse - Ready Made', 'Women\'s Wear', ['32', '34', '36', '38', '40'], ['Red', 'Blue', 'Green', 'Pink', 'White'], (449, 899), (210, 420), 15),
    ('Denim Jacket - Women', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Indigo', 'Black', 'Blue'],(1799, 2999), (850, 1400), 6),
    ('Cardigan', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Grey', 'Navy', 'Black', 'Cream'], (1299, 1999), (600, 950), 8),
    ('Tunic Top', 'Women\'s Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Blue', 'Green', 'Red', 'Purple', 'White'],(699, 1299), (330, 600), 12),
    ('Palazzo Pants', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Maroon', 'Green'],(899, 1499), (420, 700), 10),
    ('Shrug', 'Women\'s Wear', ['Free'], ['Black', 'White', 'Grey', 'Beige'], (699, 1199), (330, 560), 10),
    ('Night Suit - Cotton', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Pink', 'Blue', 'Green', 'Yellow'],(699, 1199), (330, 560), 12),
    ('Capri Pants', 'Women\'s Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Grey', 'Olive'],(549, 949), (260, 440), 12),
    ('Kaftan', 'Women\'s Wear', ['Free'], ['White', 'Blue', 'Green', 'Red'],(999, 1799), (470, 850), 8),

    ('Kids T-Shirt - Cotton', 'Kids Wear', ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-8Y'], ['Red', 'Blue', 'Green', 'Yellow'], (249, 449), (120, 210), 20),
    ('Kids Polo Shirt', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Blue', 'Red', 'Green', 'White'],(349, 549), (160, 260), 18),
    ('Kids Jeans', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Blue', 'Black'],(599, 999), (280, 470), 12),
    ('Kids Shorts', 'Kids Wear', ['2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-8Y'], ['Blue', 'Grey', 'Black', 'Green'],(299, 499), (140, 230), 18),
    ('Kids Frock', 'Kids Wear', ['2-3Y', '3-4Y', '4-5Y', '5-6Y'], ['Pink', 'Red', 'Blue', 'Yellow'],(599, 999), (280, 470), 12),
    ('Kids Party Dress', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y'], ['Pink', 'Red', 'Blue', 'Purple'],(899, 1599), (420, 750), 8),
    ('School Uniform Shirt', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y', '10-12Y'],['White', 'Light Blue'],(399, 699), (190, 330), 20),
    ('School Pants', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y', '10-12Y'], ['Navy', 'Black', 'Grey'],(449, 749), (210, 350), 18),
    ('Kids Sweater', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Red', 'Blue', 'Green', 'Yellow'],(499, 899), (240, 420), 15),
    ('Kids Jacket', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Blue', 'Red', 'Black'],(999, 1799), (470, 850), 8),
    ('Kids Tracksuit', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Blue', 'Red', 'Grey', 'Navy'],(699, 1299), (330, 600), 10),
    ('Kids Kurta', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['White', 'Blue', 'Maroon'],(499, 899), (240, 420), 12),
    ('Kids Leggings', 'Kids Wear', ['2-3Y', '3-4Y', '4-5Y', '5-6Y'], ['Pink', 'Blue', 'Black', 'Purple'],(249, 399), (120, 190), 20),
    ('Baby Bodysuit', 'Kids Wear', ['0-3M', '3-6M', '6-12M', '12-18M'], ['White', 'Pink', 'Blue', 'Yellow'],(199, 349), (95, 165), 25),
    ('Kids Night Suit', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Blue', 'Pink', 'Green', 'Yellow'],(499, 799), (240, 380), 15),
    ('Kids Swimwear', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y'], ['Blue', 'Red', 'Green', 'Multi'],(449, 749), (210, 350), 10),
    ('Kids Raincoat', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Yellow', 'Blue', 'Red', 'Green'],(599, 999), (280, 470), 8),
    ('Winter Coat - Kids', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y', '8-10Y'], ['Red', 'Blue', 'Navy', 'Grey'],(1299, 2199), (600, 1020), 6),
    ('Dungaree - Kids', 'Kids Wear', ['2-3Y', '3-4Y', '4-5Y', '5-6Y'], ['Blue', 'Grey', 'Olive'],(699, 1199), (330, 560), 10),
    ('Kids Ethnic Set', 'Kids Wear', ['3-4Y', '4-5Y', '5-6Y', '6-8Y'], ['Red', 'Maroon', 'Blue', 'Gold'],(899, 1599), (420, 750), 8),

    ('Baseball Cap', 'Accessories', ['Free'], ['Black', 'Navy', 'Red', 'Blue'],(299, 599), (140, 280), 20),
    ('Leather Belt', 'Accessories', ['28', '30', '32', '34', '36', '38', '40'], ['Black', 'Brown', 'Tan'],(499, 999), (240, 470), 15),
    ('Silk Scarf', 'Accessories', ['Free'], ['Red', 'Blue', 'Green', 'Pink', 'Purple'],(599, 1299), (280, 600), 12),
    ('Sunglasses', 'Accessories', ['Free'], ['Black', 'Brown', 'Gold', 'Silver'],(399, 899), (190, 420), 15),
    ('Wallet - Leather', 'Accessories', ['Free'], ['Black', 'Brown', 'Tan'],(699, 1299), (330, 600), 12),
    ('Tie - Silk', 'Accessories', ['Free'], ['Black', 'Navy', 'Red', 'Grey', 'Blue'],(399, 799), (190, 380), 15),
    ('Cufflinks Set', 'Accessories', ['Free'], ['Silver', 'Gold', 'Black'],(299, 599), (140, 280), 15),
    ('Muffler', 'Accessories', ['Free'], ['Grey', 'Navy', 'Black', 'Red'],(399, 699), (190, 330), 15),
    ('Beanie Hat', 'Accessories', ['Free'], ['Black', 'Grey', 'Navy', 'Red'],(249, 449), (120, 210), 20),
    ('Hand Gloves', 'Accessories', ['Free'], ['Black', 'Grey', 'Navy', 'Brown'],(299, 499), (140, 240), 18),
    ('Socks - Cotton', 'Accessories', ['6-8', '8-10', '10-12'], ['White', 'Black', 'Grey', 'Navy'],(99, 199), (45, 95), 40),
    ('Socks - Sports', 'Accessories', ['6-8', '8-10', '10-12'], ['White', 'Black', 'Grey'],(149, 249), (70, 120), 30),
    ('Suspenders', 'Accessories', ['Free'], ['Black', 'Grey', 'Navy'],(299, 499), (140, 240), 12),
    ('Bow Tie', 'Accessories', ['Free'], ['Black', 'Navy', 'Red', 'Gold'],(249, 449), (120, 210), 15),
    ('Hair Band Set', 'Accessories', ['Free'], ['Black', 'Brown', 'Multi'],(149, 299), (70, 140), 25),

    ('Athletic T-Shirt', 'Sports Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'White', 'Navy', 'Red'],(499, 899), (240, 420), 18),
    ('Sports Jersey', 'Sports Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Red', 'Blue', 'Green', 'White'],(699, 1299), (330, 600), 12),
    ('Shorts - Sports', 'Sports Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey'],(399, 699), (190, 330), 18),
    ('Track Jacket', 'Sports Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Red', 'Blue'],(1499, 2499), (700, 1180), 8),
    ('Gym Vest', 'Sports Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Grey', 'White', 'Navy'],(349, 599), (165, 280), 20),
    ('Swim Trunks', 'Sports Wear', ['S', 'M', 'L', 'XL'], ['Blue', 'Black', 'Red', 'Green'],(449, 799), (210, 380), 12),
    ('Yoga Top', 'Sports Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Pink', 'Purple', 'Blue'],(399, 699), (190, 330), 15),
    ('Cycling Shorts', 'Sports Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Grey'],(499, 799), (240, 380), 12),
    ('Sports Bra', 'Sports Wear', ['S', 'M', 'L', 'XL'], ['Black', 'White', 'Grey', 'Pink'],(599, 999), (280, 470), 12),
    ('Base Layer Top', 'Sports Wear', ['S', 'M', 'L', 'XL'], ['Black', 'White', 'Navy'],(699, 1099), (330, 520), 10),
    ('Warm Up Jacket', 'Sports Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Navy', 'Red', 'Black', 'White'],(1799, 2999), (850, 1400), 6),
    ('Sports Tights', 'Sports Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Grey'],(799, 1299), (380, 600), 10),
    ('Cricket Pads', 'Sports Wear', ['Free'], ['White'],(1499, 2499), (700, 1180), 5),
    ('Football Socks', 'Sports Wear', ['Free'], ['White', 'Black', 'Red'],(199, 349), (95, 165), 25),

    ('Down Jacket', 'Winter Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey', 'Green'],(3499, 5999), (1700, 2800), 5),
    ('Woolen Sweater', 'Winter Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Grey', 'Navy', 'Red', 'Green', 'Cream'],(1499, 2499), (700, 1180), 8),
    ('Thermal Inner Wear', 'Winter Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['White', 'Black', 'Grey'],(599, 999), (280, 470), 15),
    ('Fleece Jacket', 'Winter Wear', ['S', 'M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey', 'Red'],(1999, 3499), (950, 1650), 6),
    ('Overcoat', 'Winter Wear', ['M', 'L', 'XL', 'XXL'], ['Black', 'Navy', 'Grey', 'Brown'],(3999, 6999), (1900, 3300), 4),
    ('Woolen Cap', 'Winter Wear', ['Free'], ['Grey', 'Navy', 'Black', 'Red'],(299, 499), (140, 240), 20),
    ('Ear Muffs', 'Winter Wear', ['Free'], ['Black', 'Grey', 'Navy'],(199, 349), (95, 165), 15),
    ('Snow Gloves', 'Winter Wear', ['Free'], ['Black', 'Grey', 'Navy', 'Red'],(399, 699), (190, 330), 12),
    ('Woolen Scarf', 'Winter Wear', ['Free'], ['Grey', 'Navy', 'Red', 'Green', 'Cream'],(449, 799), (210, 380), 15),
    ('Fur Lined Boots', 'Winter Wear', ['6', '7', '8', '9', '10', '11'], ['Black', 'Brown', 'Tan'],(2499, 3999), (1200, 1900), 5),
    ('Fleece Lined Leggings', 'Winter Wear', ['S', 'M', 'L', 'XL'], ['Black', 'Navy', 'Grey'],(699, 1199), (330, 560), 12),
    ('Winter Poncho', 'Winter Wear', ['Free'], ['Grey', 'Cream', 'Navy', 'Red'],(999, 1799), (470, 850), 8),
]

CUSTOMER_NAMES = [
    'Amit Kumar', 'Sneha Patel', 'Ravi Shankar', 'Priya Singh', 'Vikram Joshi',
    'Anita Desai', 'Rahul Mehta', 'Pooja Reddy', 'Sunil Verma', 'Kavita Sharma',
    'Deepak Gupta', 'Neha Kapoor', 'Arun Nair', 'Meera Iyer', 'Vijay Khanna',
    'Lakshmi Menon', 'Suresh Babu', 'Divya Pillai', 'Rajiv Saxena', 'Anjali Das',
    'Manoj Tiwari', 'Shweta Chauhan', 'Prakash Rao', 'Ritu Agarwal', 'Gaurav Malik',
    'Swati Bhat', 'Harish Nambiar', 'Deepa Venkat', 'Nitin Chopra', 'Geeta Rani',
    'Rohit Malhotra', 'Kiran Bedi', 'Sanjay Jain', 'Nandini Gopal', 'Ashok Thakur',
    'Bhavana Srinivas', 'Ankur Bhatia', 'Rekha Devi', 'Pradeep Yadav', 'Sonali Bose',
    'Mohan Krishnan', 'Usha Rani', 'Dinesh Pandey', 'Komal Shah', 'Hari Krishnan',
    'Jyoti Ranjan', 'Rajdeep Singh', 'Maya Dasgupta', 'Siddharth Sinha', 'Tara Prasad',
]

PAYMENT_METHODS = ['cash', 'card', 'bank', 'other']

PURCHASE_STATUS = ['completed', 'completed', 'completed', 'completed', 'pending', 'cancelled']
SALE_STATUS = ['completed', 'completed', 'completed', 'completed', 'pending', 'cancelled']


def random_date(start, end):
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))


def generate_barcode():
    return generate_barcode_value()


_qr_dir = os.path.join(os.path.dirname(__file__), 'uploads', 'qrcodes')


def seed_database():
    with app.app_context():
        print('Seeding database...')

        # -------------------------------------------------------------------
        # USERS
        # -------------------------------------------------------------------
        if not User.query.filter_by(username='admin').first():
            admin = User(
                username='admin',
                email='admin@sims.com',
                password_hash=generate_password_hash('admin123'),
                full_name='Admin User',
                role='admin',
                employee_id='EMP0001',
                is_active=True
            )
            db.session.add(admin)
            print('  Created admin user')

        if not User.query.filter_by(username='staff1').first():
            staff = User(
                username='staff1',
                email='staff1@sims.com',
                password_hash=generate_password_hash('staff123'),
                full_name='Staff One',
                role='staff',
                employee_id='EMP0002',
                is_active=True
            )
            db.session.add(staff)
            print('  Created staff user')

        db.session.commit()
        admin_user = User.query.filter_by(username='admin').first()
        staff_user = User.query.filter_by(username='staff1').first()

        # -------------------------------------------------------------------
        # CATEGORIES
        # -------------------------------------------------------------------
        category_map = {}
        for cat_name in CATEGORIES:
            existing = Category.query.filter_by(name=cat_name).first()
            if not existing:
                cat = Category(name=cat_name, description=CATEGORY_DESCRIPTIONS[cat_name])
                db.session.add(cat)
                db.session.flush()
                category_map[cat_name] = cat
                print(f'  Created category: {cat_name}')
            else:
                category_map[cat_name] = existing
        db.session.commit()

        # -------------------------------------------------------------------
        # SUPPLIERS
        # -------------------------------------------------------------------
        supplier_list = []
        for s in SUPPLIERS:
            existing = Supplier.query.filter_by(supplier_name=s[0]).first()
            if not existing:
                sup = Supplier(
                    supplier_name=s[0],
                    contact_person=s[1],
                    phone=s[2],
                    email=s[3],
                    address=s[4],
                    gst_number=s[5],
                    status='active'
                )
                db.session.add(sup)
                db.session.flush()
                supplier_list.append(sup)
                print(f'  Created supplier: {s[0]}')
            else:
                supplier_list.append(existing)
        db.session.commit()

        # -------------------------------------------------------------------
        # RAW MATERIALS
        # -------------------------------------------------------------------
        material_list = []
        for i, m in enumerate(RAW_MATERIALS):
            name = m[0]
            existing = RawMaterial.query.filter_by(material_name=name).first()
            if not existing:
                sup = random.choice(supplier_list)
                mat = RawMaterial(
                    material_name=name,
                    unit=m[1],
                    supplier_id=sup.id,
                    quantity=m[3],
                    min_stock=m[4],
                    cost=m[2],
                    description=f'{name} for garment manufacturing'
                )
                db.session.add(mat)
                db.session.flush()
                material_list.append(mat)
            else:
                material_list.append(existing)
        db.session.commit()
        print(f'  Raw materials: {len(material_list)}')

        # -------------------------------------------------------------------
        # PRODUCTS
        # -------------------------------------------------------------------
        product_list = []
        random.seed(42)
        for i, t in enumerate(PRODUCT_TEMPLATES):
            name = t[0]
            category_name = t[1]
            sizes = t[2]
            colors = t[3]
            price_range = t[4]
            cost_range = t[5]
            min_stock_val = t[6]

            # Create 1-2 size/color variants per template to reach ~100 products
            variants = random.randint(1, 2)
            for v in range(variants):
                size = random.choice(sizes) if sizes[0] != 'Free' else 'Free'
                color = random.choice(colors)
                variant_name = f'{name} - {color}'
                if size != 'Free':
                    variant_name += f' ({size})'

                existing = Product.query.filter_by(
                    product_name=variant_name,
                    size=size,
                    color=color
                ).first()
                if existing:
                    product_list.append(existing)
                    continue

                price = random.randint(price_range[0], price_range[1])
                cost = random.randint(cost_range[0], cost_range[1])
                qty = random.randint(20, 500)
                cat = category_map[category_name]
                sup = random.choice(supplier_list)

                prod = Product(
                    product_name=variant_name,
                    category_id=cat.id,
                    size=size,
                    color=color,
                    price=price,
                    quantity=qty,
                    min_stock=min_stock_val,
                    barcode=generate_barcode(),
                    status='active',
                    description=f'{name} in {color} color, Size {size}. Made from premium quality fabric.'
                )
                db.session.add(prod)
                db.session.flush()
                product_list.append(prod)

            if i % 25 == 0:
                db.session.commit()

        db.session.commit()
        print(f'  Products: {len(product_list)}')

        # Ensure some low-stock products
        random.seed(99)
        low_stock_products = random.sample(product_list, min(10, len(product_list)))
        for p in low_stock_products:
            p.quantity = random.randint(0, p.min_stock - 1)
        db.session.commit()
        print(f'  Low-stock products set: {len(low_stock_products)}')

        # -------------------------------------------------------------------
        # PRODUCT VARIANTS
        # -------------------------------------------------------------------
        random.seed(789)
        variant_count = 0
        # Pick products that have size and color info to create variants for
        variant_templates = [t for t in PRODUCT_TEMPLATES if t[2][0] != 'Free' and len(t[2]) >= 3 and len(t[3]) >= 2]
        random.shuffle(variant_templates)
        selected_templates = variant_templates[:20]

        for t in selected_templates:
            base_name = t[0]
            sizes = t[2]
            colors = t[3]
            price_range = t[4]
            cost_range = t[5]
            min_stock_val = t[6]
            cat_name = t[1]
            cat = category_map[cat_name]

            # Find or create a base product for this template
            base_product = Product.query.filter_by(
                product_name=base_name,
                category_id=cat.id
            ).first()

            if not base_product:
                base_price = random.randint(price_range[0], price_range[1])
                base_product = Product(
                    product_name=base_name,
                    category_id=cat.id,
                    size='Free',
                    color='Various',
                    price=base_price,
                    quantity=0,
                    min_stock=min_stock_val,
                    barcode=generate_barcode(),
                    status='active',
                    description=f'{base_name} - available in multiple sizes and colors'
                )
                db.session.add(base_product)
                db.session.flush()
                product_list.append(base_product)

            existing_combos = set()
            for v in base_product.variants.all():
                existing_combos.add((v.size, v.color))

            # Create variants for 3-5 size/color combos
            num_combos = random.randint(3, 5)
            combo_colors = random.sample(colors, min(num_combos, len(colors)))
            seq = 0
            for color in combo_colors:
                size = random.choice(sizes)
                if (size, color) in existing_combos:
                    continue
                existing_combos.add((size, color))

                temp_variant = ProductVariant(product_id=base_product.id, size=size, color=color)
                seq += 1

                price = random.randint(price_range[0], price_range[1])
                cost = random.randint(cost_range[0], cost_range[1])
                vstock = random.randint(10, 200)

                sku = generate_sku(base_product, temp_variant, seq)
                if ProductVariant.query.filter_by(sku=sku).first():
                    sku = f'{sku}-{random.randint(10, 99)}'

                bcode = generate_barcode_value(sku)
                while ProductVariant.query.filter_by(barcode=bcode).first():
                    bcode = generate_barcode_value()  # fallback to random

                variant = ProductVariant(
                    product_id=base_product.id,
                    size=size,
                    color=color,
                    sku=sku,
                    barcode=bcode,
                    stock=vstock,
                    min_stock=min_stock_val,
                    cost_price=cost,
                    selling_price=price,
                )
                db.session.add(variant)
                db.session.flush()
                qr_filename = save_qr_code_file(variant, base_product, _qr_dir)
                variant.qr_code = qr_filename
                variant_count += 1

            base_product.sync_stock_from_variants()

        db.session.commit()
        print(f'  Variants: {variant_count}')

        # -------------------------------------------------------------------
        # PURCHASES (150+ over 12 months)
        # -------------------------------------------------------------------
        random.seed(123)
        now = datetime.utcnow()
        twelve_months_ago = now - timedelta(days=365)
        purchase_count = 0
        existing_invoices = set(
            row[0] for row in db.session.query(Purchase.invoice_number).all()
        )

        for _ in range(160):
            date = random_date(twelve_months_ago, now)
            sup = random.choice(supplier_list)
            user = random.choice([admin_user, staff_user])
            status = random.choice(PURCHASE_STATUS)
            inv_num = f'PO-{date.strftime("%Y%m%d")}-{random.randint(1000, 9999)}'
            if inv_num in existing_invoices:
                continue
            existing_invoices.add(inv_num)

            # 1-4 items per purchase
            num_items = random.randint(1, 4)
            selected_materials = random.sample(material_list, min(num_items, len(material_list)))
            total = 0
            items = []
            for mat in selected_materials:
                qty = random.randint(50, 500)
                unit_price = float(mat.cost) + random.uniform(-5, 10)
                unit_price = max(unit_price, 10)
                total_price = round(qty * unit_price, 2)
                total += total_price
                items.append({
                    'material_id': mat.id,
                    'quantity': qty,
                    'unit_price': round(unit_price, 2),
                    'total_price': total_price,
                })

            discount = round(total * random.uniform(0, 0.05), 2)
            tax = round((total - discount) * 0.12, 2)
            grand = round(total - discount + tax, 2)

            pur = Purchase(
                invoice_number=inv_num,
                supplier_id=sup.id,
                user_id=user.id,
                total_amount=round(total, 2),
                discount=discount,
                tax=tax,
                grand_total=grand,
                status=status,
                purchase_date=date,
                notes=f'Purchase order for {len(items)} material(s)',
                created_at=date,
            )
            db.session.add(pur)
            db.session.flush()

            for item_data in items:
                pi = PurchaseItem(
                    purchase_id=pur.id,
                    material_id=item_data['material_id'],
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    total_price=item_data['total_price'],
                    created_at=date,
                )
                db.session.add(pi)

            purchase_count += 1
            if purchase_count % 50 == 0:
                db.session.commit()

        db.session.commit()
        print(f'  Purchases: {purchase_count}')

        # -------------------------------------------------------------------
        # SALES (300+ over 12 months)
        # -------------------------------------------------------------------
        random.seed(456)
        sale_count = 0
        existing_sale_invoices = set(
            row[0] for row in db.session.query(Sale.invoice_number).all()
        )

        for _ in range(320):
            date = random_date(twelve_months_ago, now)
            user = random.choice([admin_user, staff_user])
            customer = random.choice(CUSTOMER_NAMES)
            method = random.choice(PAYMENT_METHODS)
            status = random.choice(SALE_STATUS)
            inv_num = f'INV-{date.strftime("%Y%m%d")}-{random.randint(1000, 9999)}'
            if inv_num in existing_sale_invoices:
                continue
            existing_sale_invoices.add(inv_num)

            # 1-5 items per sale
            num_items = random.randint(1, 5)
            selected_products = random.sample(product_list, min(num_items, len(product_list)))
            total = 0
            items = []
            for prod in selected_products:
                # Don't sell more than available (unless minor oversell)
                max_qty = max(prod.quantity, 1)
                qty = random.randint(1, min(10, max_qty + 2))
                unit_price = float(prod.price)
                total_price = round(qty * unit_price, 2)
                total += total_price

                # Reduce product stock (simulate real sales)
                prod.quantity = max(0, prod.quantity - qty)

                items.append({
                    'product_id': prod.id,
                    'quantity': qty,
                    'unit_price': unit_price,
                    'discount': 0,
                    'total_price': total_price,
                })

            discount = round(total * random.uniform(0, 0.10), 2)
            tax = round((total - discount) * 0.12, 2)
            grand = round(total - discount + tax, 2)

            sale = Sale(
                invoice_number=inv_num,
                customer_name=customer,
                user_id=user.id,
                total_amount=round(total, 2),
                discount=discount,
                tax=tax,
                grand_total=grand,
                payment_method=method,
                status=status,
                sale_date=date,
                notes=f'Sale to {customer}',
                created_at=date,
            )
            db.session.add(sale)
            db.session.flush()

            for item_data in items:
                si = SaleItem(
                    sale_id=sale.id,
                    product_id=item_data['product_id'],
                    quantity=item_data['quantity'],
                    unit_price=item_data['unit_price'],
                    discount=item_data['discount'],
                    total_price=item_data['total_price'],
                    created_at=date,
                )
                db.session.add(si)

            sale_count += 1
            if sale_count % 50 == 0:
                db.session.commit()

        db.session.commit()
        print(f'  Sales: {sale_count}')

        # -------------------------------------------------------------------
        # INVENTORY LOGS
        # -------------------------------------------------------------------
        inventory_log_count = 0
        for prod in product_list[:50]:
            if random.random() < 0.3:
                log = InventoryLog(
                    product_id=prod.id,
                    change_type='in',
                    quantity=random.randint(10, 100),
                    reference_type='adjustment',
                    notes='Initial stock seeding',
                    user_id=admin_user.id,
                    created_at=random_date(twelve_months_ago, now),
                )
                db.session.add(log)
                inventory_log_count += 1
        db.session.commit()
        print(f'  Inventory logs: {inventory_log_count}')

        # -------------------------------------------------------------------
        # NOTIFICATIONS
        # -------------------------------------------------------------------
        for p in low_stock_products:
            existing_notif = Notification.query.filter_by(
                title='Low Stock Alert',
                link=f'/products'
            ).first()
            if not existing_notif:
                notif = Notification(
                    user_id=admin_user.id,
                    title='Low Stock Alert',
                    message=f'{p.product_name} is running low (stock: {p.quantity})',
                    type='warning',
                    is_read=False,
                    link='/products',
                    created_at=now,
                )
                db.session.add(notif)
        db.session.commit()
        print(f'  Notifications created for low-stock products')

        # -------------------------------------------------------------------
        # SUMMARY
        # -------------------------------------------------------------------
        print()
        print('=== SEED SUMMARY ===')
        print(f'  Users:        {User.query.count()}')
        print(f'  Categories:   {Category.query.count()}')
        print(f'  Suppliers:    {Supplier.query.count()}')
        print(f'  Materials:    {RawMaterial.query.count()}')
        print(f'  Products:     {Product.query.count()}')
        print(f'  Variants:     {ProductVariant.query.count()}')
        print(f'  Purchases:    {Purchase.query.count()}')
        print(f'  Purchase Items: {PurchaseItem.query.count()}')
        print(f'  Sales:        {Sale.query.count()}')
        print(f'  Sale Items:   {SaleItem.query.count()}')
        print(f'  Inventory Logs: {InventoryLog.query.count()}')
        print(f'  Notifications:  {Notification.query.count()}')


if __name__ == '__main__':
    print('Smart Inventory - Database Seeder')
    print('=' * 40)
    seed_database()
    print()
    print('Seeding complete!')
