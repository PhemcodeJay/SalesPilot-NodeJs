-- Categories Table (For Product Categories)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE
);

-- Products Table (Manages Product Details)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    product_type ENUM('goods', 'services', 'digital') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) NOT NULL,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Inventory Table (Tracks Product Inventory)
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    stock_qty INT NOT NULL CHECK (stock_qty >= 0),
    supply_qty INT NOT NULL CHECK (supply_qty >= 0),
    available_stock INT GENERATED ALWAYS AS (stock_qty + supply_qty) STORED,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Customers Table
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staffs Table
CREATE TABLE staffs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_name VARCHAR(255) NOT NULL,
    staff_email VARCHAR(255) UNIQUE,
    staff_phone VARCHAR(20),
    position ENUM('manager', 'sales') NOT NULL DEFAULT 'sales',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Table (Tracks Sales Transactions)
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    staff_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    sale_price DECIMAL(10,2) NOT NULL CHECK (sale_price >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * sale_price) STORED,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sale_status ENUM('completed', 'pending') NOT NULL DEFAULT 'pending',
    payment_status ENUM('paid', 'due') NOT NULL DEFAULT 'due',
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staffs(id) ON DELETE SET NULL
);

-- Expenses Table (Tracks Expenses Related to Products)
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    expense_type ENUM('raw_material', 'transport', 'tax', 'other') NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Sales Analytics Table
CREATE TABLE sales_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    revenue DECIMAL(10,2) NOT NULL,
    profit_margin DECIMAL(10,2) NOT NULL,
    year_over_year_growth DECIMAL(10,2),
    cost_of_selling DECIMAL(10,2) NOT NULL,
    inventory_turnover_rate DECIMAL(10,2),
    stock_to_sales_ratio DECIMAL(10,2),
    sell_through_rate DECIMAL(10,2),
    gross_margin DECIMAL(10,2),
    net_margin DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue by Product Table
CREATE TABLE revenue_by_product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id INT NOT NULL,
    product_id INT NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    total_sales DECIMAL(15,2) NOT NULL CHECK (total_sales >= 0),
    total_cost DECIMAL(15,2) NOT NULL CHECK (total_cost >= 0),
    total_profit DECIMAL(15,2) NOT NULL,
    inventory_turnover_rate DECIMAL(10,4),
    sell_through_rate DECIMAL(10,4),
    FOREIGN KEY (report_id) REFERENCES sales_analytics(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Reports Table (Consolidates Sales & Financial Metrics)
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL,
    revenue DECIMAL(10,2) NOT NULL,
    profit_margin DECIMAL(5,2) NOT NULL,
    year_over_year_growth DECIMAL(5,2),
    cost_of_selling DECIMAL(10,2) NOT NULL,
    inventory_turnover_rate DECIMAL(5,2),
    stock_to_sales_ratio DECIMAL(5,2),
    sell_through_rate DECIMAL(10,2),
    gross_margin DECIMAL(10,2),
    net_margin DECIMAL(10,2),
    total_sales DECIMAL(10,2) NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    total_profit DECIMAL(10,2) NOT NULL,
    total_expenses DECIMAL(10,2) NOT NULL,
    net_profit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    invoice_description TEXT,
    order_date DATE NOT NULL,
    order_status ENUM('Paid', 'Unpaid') NOT NULL DEFAULT 'Unpaid',
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    discount DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal - (subtotal * (discount / 100))) STORED,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
