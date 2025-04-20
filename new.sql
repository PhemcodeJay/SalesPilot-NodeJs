CREATE TABLE `tenants` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(255) DEFAULT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'inactive',
  `subscription_type` ENUM('trial', 'starter', 'business', 'enterprise') NOT NULL DEFAULT 'trial',
  `subscription_start_date` TIMESTAMP NOT NULL,
  `subscription_end_date` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenant_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,  -- Ensure CHAR(36) matches the tenants' table
  `username` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `activation_codes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `activation_code` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activation_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `password_resets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `reset_code` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `subscriptions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `tenant_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `plan_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `plan_description` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `plan_price` DECIMAL(10,2) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `subscription_status` ENUM('active','inactive','expired') COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tenant_id` (`tenant_id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `categories` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` TEXT COLLATE utf8mb4_general_ci NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `category_id` INT NOT NULL,
  `product_description` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `product_price` DECIMAL(10,2) NOT NULL,
  `product_discount` DECIMAL(10,2) NOT NULL,
  `product_quantity` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `category_analytics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `revenue` DECIMAL(10,2) NOT NULL,
  `total_sales` DECIMAL(10,2) NOT NULL,
  `total_quantity` INT NOT NULL,
  `total_profit` DECIMAL(10,2) NOT NULL,
  `total_expenses` DECIMAL(10,2) NOT NULL,
  `net_profit` DECIMAL(10,2) NOT NULL,
  `revenue_by_category` DECIMAL(10,2) NOT NULL,
  `most_sold_product_id` INT NULL,
  `previous_year_sales` DECIMAL(10,2) NOT NULL,
  `cost_of_goods_sold` DECIMAL(10,2) NOT NULL,
  `average_inventory` DECIMAL(10,2) NOT NULL,
  `units_sold` INT NOT NULL,
  `units_stocked` INT NOT NULL,
  `total_cost` DECIMAL(10,2) NOT NULL,
  `gross_margin` DECIMAL(10,2) GENERATED ALWAYS AS (`total_sales` - `total_cost`) STORED,
  `net_margin` DECIMAL(10,2) NOT NULL,
  `profit_margin` DECIMAL(10,2) GENERATED ALWAYS AS ((`total_profit` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `year_over_year_growth` DECIMAL(10,2) GENERATED ALWAYS AS (((`total_sales` - `previous_year_sales`) / NULLIF(`previous_year_sales`, 0)) * 100) STORED,
  `cost_of_selling` DECIMAL(10,2) GENERATED ALWAYS AS (`total_sales` - `total_profit`) STORED,
  `inventory_turnover_rate` DECIMAL(10,2) GENERATED ALWAYS AS (`cost_of_goods_sold` / NULLIF(`average_inventory`, 0)) STORED,
  `stock_to_sales_ratio` DECIMAL(10,2) GENERATED ALWAYS AS (`average_inventory` / NULLIF(`total_sales`, 0)) STORED,
  `sell_through_rate` DECIMAL(10,2) GENERATED ALWAYS AS ((`units_sold` / NULLIF(`units_stocked`, 0)) * 100) STORED,
  `gross_margin_by_category` DECIMAL(10,2) GENERATED ALWAYS AS ((`gross_margin` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `net_margin_by_category` DECIMAL(10,2) GENERATED ALWAYS AS ((`net_margin` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `category_analytics_fk_1` FOREIGN KEY (`most_sold_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `customers` (
  `customer_id` INT NOT NULL AUTO_INCREMENT,
  `customer_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_email` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_phone` VARCHAR(20) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_location` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `expenses` (
  `expense_id` INT NOT NULL AUTO_INCREMENT,
  `description` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `expense_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `feedback` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `message` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` VARCHAR(50) COLLATE utf8mb4_general_ci NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `inventory` (
  `inventory_id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `sales_qty` INT NOT NULL,
  `last_updated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `stock_qty` INT DEFAULT NULL,
  `supply_qty` INT DEFAULT NULL,
  `available_stock` INT GENERATED ALWAYS AS (((`stock_qty` + `supply_qty`) - `sales_qty`)) STORED,
  `inventory_qty` INT GENERATED ALWAYS AS ((`stock_qty` + `supply_qty`)) STORED,
  `product_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`inventory_id`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `invoices` (
  `invoice_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `invoice_description` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `order_date` DATE NOT NULL,
  `order_status` ENUM('Paid','Unpaid') COLLATE utf8mb4_general_ci NOT NULL,
  `order_id` VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
  `delivery_address` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `mode_of_payment` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `due_date` DATE NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(5,2) NOT NULL,
  `total_amount` DECIMAL(10,2) GENERATED ALWAYS AS ((`subtotal` - (`subtotal` * (`discount` / 100)))) STORED,
  PRIMARY KEY (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `invoice_items` (
  `invoice_items_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_id` INT NOT NULL,
  `item_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `qty` INT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `total` DECIMAL(10,2) GENERATED ALWAYS AS ((`qty` * `price`)) STORED,
  PRIMARY KEY (`invoice_items_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `page_access` (
  `id` INT NOT NULL AUTO_INCREMENT,  
  `page` VARCHAR(255) NOT NULL,
  `required_access_level` ENUM('trial','starter','business','enterprise') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `sales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `quantity_sold` INT NOT NULL,
  `price_sold` DECIMAL(10,2) NOT NULL,
  `total_sale_amount` DECIMAL(10,2) GENERATED ALWAYS AS ((`quantity_sold` * `price_sold`)) STORED,
  `sale_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `suppliers` (
  `supplier_id` int NOT NULL AUTO_INCREMENT,
  `supplier_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `supplier_email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `supplier_phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `supplier_location` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `product_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `supply_qty` int NOT NULL,
  `note` text COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`supplier_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `staffs` (
  `staff_id` INT NOT NULL AUTO_INCREMENT,
  `staff_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `staff_email` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `staff_phone` VARCHAR(20) COLLATE utf8mb4_general_ci NOT NULL,
  `position` ENUM('manager','sales') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'sales',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;;

CREATE TABLE `product_analytics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `revenue` DECIMAL(10,2) NOT NULL,
  `total_sales` DECIMAL(10,2) NOT NULL,
  `total_quantity` INT NOT NULL,
  `total_profit` DECIMAL(10,2) NOT NULL,
  `total_expenses` DECIMAL(10,2) NOT NULL,
  `net_profit` DECIMAL(10,2) NOT NULL,
  `most_sold_product_id` INT NULL,
  `previous_year_sales` DECIMAL(10,2) NOT NULL,
  `cost_of_goods_sold` DECIMAL(10,2) NOT NULL,
  `average_inventory` DECIMAL(10,2) NOT NULL,
  `units_sold` INT NOT NULL,
  `units_stocked` INT NOT NULL,
  `total_cost` DECIMAL(10,2) NOT NULL,
  `gross_margin` DECIMAL(10,2) GENERATED ALWAYS AS (`total_sales` - `total_cost`) STORED,
  `net_margin` DECIMAL(10,2) NOT NULL,
  `profit_margin` DECIMAL(10,2) GENERATED ALWAYS AS ((`total_profit` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `year_over_year_growth` DECIMAL(10,2) GENERATED ALWAYS AS (((`total_sales` - `previous_year_sales`) / NULLIF(`previous_year_sales`, 0)) * 100) STORED,
  `cost_of_selling` DECIMAL(10,2) GENERATED ALWAYS AS (`total_sales` - `total_profit`) STORED,
  `inventory_turnover_rate` DECIMAL(10,2) GENERATED ALWAYS AS (`cost_of_goods_sold` / NULLIF(`average_inventory`, 0)) STORED,
  `stock_to_sales_ratio` DECIMAL(10,2) GENERATED ALWAYS AS (`average_inventory` / NULLIF(`total_sales`, 0)) STORED,
  `sell_through_rate` DECIMAL(10,2) GENERATED ALWAYS AS ((`units_sold` / NULLIF(`units_stocked`, 0)) * 100) STORED,
  `gross_margin_by_product` DECIMAL(10,2) GENERATED ALWAYS AS ((`gross_margin` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `net_margin_by_product` DECIMAL(10,2) GENERATED ALWAYS AS ((`net_margin` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `product_analytics_fk_1` FOREIGN KEY (`most_sold_product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `revenue_by_product` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `report_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `total_quantity` INT NOT NULL,
  `total_sales` DECIMAL(15,2) NOT NULL,
  `total_cost` DECIMAL(15,2) NOT NULL,
  `total_profit` DECIMAL(15,2) NOT NULL,
  `average_inventory` DECIMAL(15,2) NOT NULL,
  `units_sold` INT NOT NULL,
  `units_stocked` INT NOT NULL,
  `gross_margin` DECIMAL(15,2) GENERATED ALWAYS AS (`total_sales` - `total_cost`) STORED,
  `net_margin` DECIMAL(15,2) GENERATED ALWAYS AS (`total_sales` - `total_profit`) STORED,
  `sell_through_rate` DECIMAL(10,2) GENERATED ALWAYS AS ((`units_sold` / NULLIF(`units_stocked`, 0)) * 100) STORED,
  `gross_margin_by_product` DECIMAL(10,2) GENERATED ALWAYS AS ((`gross_margin` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `net_margin_by_product` DECIMAL(10,2) GENERATED ALWAYS AS ((`net_margin` / NULLIF(`total_sales`, 0)) * 100) STORED,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `revenue_by_product_fk_1` FOREIGN KEY (`report_id`) REFERENCES `product_analytics` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `revenue_by_product_fk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


CREATE TABLE `payments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `tenant_id` CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `subscription_id` INT DEFAULT NULL,
  `payment_method` ENUM('paypal','binance','mpesa','naira') COLLATE utf8mb4_general_ci NOT NULL,
  `payment_proof` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `payment_status` ENUM('pending','completed','failed') NOT NULL DEFAULT 'pending',
  PRIMARY KEY (`id`),
  CONSTRAINT `payments_fk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `payments_fk_2` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `payments_fk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
