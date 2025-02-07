
-- Categories Table (For Product Categories)
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL
);

-- Products Table (Manages Product Details)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category_id INT NOT NULL,
    product_type ENUM('goods', 'services', 'digital') NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Inventory Table (Tracks Product Inventory)
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    stock_quantity INT DEFAULT 0,
    supply_quantity INT DEFAULT 0,
    available_stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales Table (Tracks Sales Transactions)
CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    staff_id INT,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (staff_id) REFERENCES users(id)
);

-- Expenses Table (Tracks Expenses Related to Products)
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    expense_type ENUM('raw_material', 'transport', 'tax', 'other') NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sales Analytics/Reports Table (Stores Analytics Data)
CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_date DATE NOT NULL,
    total_sales DECIMAL(10, 2) NOT NULL,
    total_expenses DECIMAL(10, 2) NOT NULL,
    total_profit DECIMAL(10, 2) NOT NULL,
    revenue_by_product JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `staffs` (
  `staff_id` int(11) NOT NULL,
  `staff_name` varchar(100) NOT NULL,
  `staff_email` varchar(100) NOT NULL,
  `staff_phone` varchar(20) NOT NULL,
  `position` enum('manager','sales') NOT NULL DEFAULT 'sales',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sales_analytics` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `revenue` decimal(10,2) NOT NULL,
  `profit_margin` decimal(10,2) NOT NULL,
  `year_over_year_growth` decimal(10,2) NOT NULL,
  `cost_of_selling` decimal(10,2) NOT NULL,
  `inventory_turnover_rate` decimal(10,2) NOT NULL,
  `stock_to_sales_ratio` decimal(10,2) NOT NULL,
  `sell_through_rate` decimal(10,2) NOT NULL,
  `gross_margin_by_category` decimal(10,2) NOT NULL,
  `net_margin_by_category` decimal(10,2) NOT NULL,
  `gross_margin` decimal(10,2) NOT NULL,
  `net_margin` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_sales` decimal(10,2) NOT NULL,
  `total_quantity` int(11) NOT NULL,
  `total_profit` decimal(10,2) NOT NULL,
  `total_expenses` decimal(10,2) NOT NULL,
  `net_profit` decimal(10,2) NOT NULL,
  `revenue_by_category` decimal(10,2) NOT NULL,
  `most_sold_product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `sales` (
  `sales_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `staff_id` int(11) NOT NULL,
  `sales_qty` int(11) NOT NULL,
  `sale_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `sale_status` enum('completed','pending') NOT NULL DEFAULT 'pending',
  `payment_status` enum('completed','due','paid') NOT NULL DEFAULT 'due',
  `name` varchar(255) NOT NULL,
  `product_type` enum('Goods','Services','Digital') NOT NULL,
  `sale_note` varchar(255) NOT NULL,
  `sales_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) GENERATED ALWAYS AS (`sales_qty` * `sales_price`) VIRTUAL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `revenue_by_product` (
  `id` int(11) NOT NULL,
  `report_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `total_quantity` int(11) NOT NULL,
  `total_sales` decimal(15,2) NOT NULL,
  `total_cost` decimal(15,2) NOT NULL,
  `total_profit` decimal(15,2) NOT NULL,
  `inventory_turnover_rate` decimal(10,4) NOT NULL,
  `sell_through_rate` decimal(10,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `reports` (
  `reports_id` int(11) NOT NULL,
  `report_date` date NOT NULL,
  `revenue` decimal(10,2) NOT NULL,
  `profit_margin` decimal(5,2) NOT NULL,
  `revenue_by_product` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `year_over_year_growth` decimal(5,2) NOT NULL,
  `cost_of_selling` decimal(10,2) NOT NULL,
  `inventory_turnover_rate` decimal(5,2) NOT NULL,
  `stock_to_sales_ratio` decimal(5,2) NOT NULL,
  `sell_through_rate` decimal(10,2) NOT NULL,
  `gross_margin_by_product` decimal(10,2) NOT NULL,
  `net_margin_by_product` decimal(10,2) NOT NULL,
  `gross_margin` decimal(10,2) NOT NULL,
  `net_margin` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_sales` decimal(10,0) NOT NULL,
  `total_quantity` int(11) NOT NULL,
  `total_profit` decimal(10,2) NOT NULL,
  `total_expenses` decimal(10,2) NOT NULL,
  `net_profit` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `invoice_description` text DEFAULT NULL,
  `order_date` date NOT NULL,
  `order_status` enum('Paid','Unpaid') NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `delivery_address` text NOT NULL,
  `mode_of_payment` varchar(255) NOT NULL,
  `due_date` date NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(5,2) NOT NULL,
  `total_amount` decimal(10,2) GENERATED ALWAYS AS (`subtotal` - `subtotal` * (`discount` / 100)) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `inventory` (
  `inventory_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `sales_qty` int(11) NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `stock_qty` int(11) DEFAULT NULL,
  `supply_qty` int(11) DEFAULT NULL,
  `available_stock` int(11) GENERATED ALWAYS AS (`stock_qty` + `supply_qty` - `sales_qty`) STORED,
  `inventory_qty` int(11) GENERATED ALWAYS AS (`stock_qty` + `supply_qty`) STORED,
  `product_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_by` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `customers` (
  `customer_id` int(11) NOT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_email` varchar(100) NOT NULL,
  `customer_phone` varchar(20) NOT NULL,
  `customer_location` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `categories` (
  `category_id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `category_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `stock_qty` int(11) NOT NULL,
  `supply_qty` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `product_type` enum('Goods','Services','Digital') NOT NULL DEFAULT 'Goods',
  `staff_name` varchar(45) NOT NULL,
  `category` varchar(255) NOT NULL,
  `inventory_qty` int(11) GENERATED ALWAYS AS (`stock_qty` + `supply_qty`) STORED,
  `profit` decimal(10,2) GENERATED ALWAYS AS (`price` - `cost`) STORED
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `supplier_name` varchar(255) NOT NULL,
  `supplier_email` varchar(255) NOT NULL,
  `supplier_phone` varchar(20) NOT NULL,
  `supplier_location` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `product_name` varchar(255) NOT NULL,
  `supply_qty` int(11) NOT NULL,
  `note` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
