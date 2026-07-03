CREATE DATABASE IF NOT EXISTS smart_inventory;
USE smart_inventory;

-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Categories Table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Suppliers Table
CREATE TABLE suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    gst_number VARCHAR(50),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suppliers_name (supplier_name),
    INDEX idx_suppliers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    category_id INT,
    size VARCHAR(20),
    color VARCHAR(50),
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 10,
    image VARCHAR(255),
    barcode VARCHAR(100) UNIQUE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_name (product_name),
    INDEX idx_products_category (category_id),
    INDEX idx_products_status (status),
    INDEX idx_products_barcode (barcode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Raw Materials Table
CREATE TABLE raw_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_name VARCHAR(200) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    supplier_id INT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10, 2) NOT NULL DEFAULT 10,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    INDEX idx_materials_name (material_name),
    INDEX idx_materials_supplier (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchases Table
CREATE TABLE purchases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT,
    user_id INT,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_purchases_invoice (invoice_number),
    INDEX idx_purchases_supplier (supplier_id),
    INDEX idx_purchases_date (purchase_date),
    INDEX idx_purchases_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Purchase Items Table
CREATE TABLE purchase_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    material_id INT,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE SET NULL,
    INDEX idx_purchase_items_purchase (purchase_id),
    INDEX idx_purchase_items_material (material_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sales Table
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(150),
    user_id INT,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    tax DECIMAL(10, 2) DEFAULT 0,
    grand_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_method ENUM('cash', 'card', 'bank', 'other') DEFAULT 'cash',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_sales_invoice (invoice_number),
    INDEX idx_sales_date (sale_date),
    INDEX idx_sales_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sale Items Table
CREATE TABLE sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    discount DECIMAL(10, 2) DEFAULT 0,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inventory Logs Table
CREATE TABLE inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    material_id INT,
    change_type ENUM('in', 'out', 'adjustment') NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    notes TEXT,
    user_id INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (material_id) REFERENCES raw_materials(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_logs_product (product_id),
    INDEX idx_logs_material (material_id),
    INDEX idx_logs_type (change_type),
    INDEX idx_logs_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    type ENUM('info', 'warning', 'success', 'danger') DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    link VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notifications_user (user_id),
    INDEX idx_notifications_read (is_read),
    INDEX idx_notifications_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Admin User (password: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@sims.com', 'pbkdf2:sha256:600000$salt$hash', 'System Admin', 'admin'),
('staff1', 'staff1@sims.com', 'pbkdf2:sha256:600000$salt$hash', 'Staff One', 'staff');

-- Insert Sample Categories
INSERT INTO categories (name, description) VALUES
('T-Shirts', 'Cotton and polyester t-shirts'),
('Shirts', 'Formal and casual shirts'),
('Jeans', 'Denim jeans and trousers'),
('Dresses', 'Women dresses and gowns'),
('Jackets', 'Winter jackets and blazers'),
('Ethnic Wear', 'Traditional ethnic clothing'),
('Sportswear', 'Sports and active wear'),
('Accessories', 'Belts, caps, scarves');

-- Insert Sample Suppliers
INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, gst_number, status) VALUES
('FabTextile Pvt Ltd', 'Ramesh Kumar', '+91-9876543210', 'ramesh@fabtextile.com', 'Mumbai, Maharashtra', 'GSTIN27AABCU1234H1Z1', 'active'),
('GarmentPro Supplies', 'Priya Sharma', '+91-9876543211', 'priya@garmentpro.com', 'Delhi, India', 'GSTIN07ABCDE1234H1Z1', 'active'),
('Threads & Co', 'Amit Singh', '+91-9876543212', 'amit@threadsco.com', 'Bangalore, Karnataka', 'GSTIN29XYZAB1234H1Z1', 'active'),
('WeaveCraft Ltd', 'Sunita Patel', '+91-9876543213', 'sunita@weavecraft.com', 'Ahmedabad, Gujarat', 'GSTIN24PQRST1234H1Z1', 'active');

-- Insert Sample Raw Materials
INSERT INTO raw_materials (material_name, unit, supplier_id, quantity, min_stock, cost) VALUES
('Cotton Fabric', 'Meters', 1, 500, 100, 150.00),
('Polyester Fabric', 'Meters', 1, 300, 80, 120.00),
('Denim Fabric', 'Meters', 2, 200, 50, 250.00),
('Silk Fabric', 'Meters', 3, 100, 30, 500.00),
('Buttons', 'Pieces', 2, 5000, 500, 2.00),
('Zippers', 'Pieces', 3, 2000, 200, 15.00),
('Thread Rolls', 'Pieces', 1, 1000, 100, 30.00),
('Elastic', 'Meters', 4, 400, 80, 20.00),
('Lace', 'Meters', 4, 200, 40, 45.00),
('Interlining', 'Meters', 2, 300, 60, 80.00);

-- Insert Sample Products
INSERT INTO products (product_name, category_id, size, color, price, quantity, min_stock, barcode, status) VALUES
('Classic White T-Shirt', 1, 'M', 'White', 499.00, 150, 20, 'SIMS100001', 'active'),
('Slim Fit Blue Jeans', 3, '32', 'Blue', 1299.00, 80, 15, 'SIMS100002', 'active'),
('Formal Black Shirt', 2, 'L', 'Black', 899.00, 60, 15, 'SIMS100003', 'active'),
('Red Silk Dress', 4, 'M', 'Red', 2499.00, 30, 10, 'SIMS100004', 'active'),
('Denim Jacket', 5, 'XL', 'Blue', 1999.00, 25, 10, 'SIMS100005', 'active'),
('Cotton Kurti', 6, 'L', 'Pink', 699.00, 100, 20, 'SIMS100006', 'active'),
('Sports T-Shirt', 7, 'M', 'Grey', 599.00, 120, 20, 'SIMS100007', 'active'),
('Leather Belt', 8, 'Free', 'Brown', 399.00, 200, 30, 'SIMS100008', 'active'),
('Casual White Shirt', 2, 'M', 'White', 749.00, 90, 15, 'SIMS100009', 'active'),
('Black Skinny Jeans', 3, '30', 'Black', 1399.00, 45, 10, 'SIMS100010', 'active');
