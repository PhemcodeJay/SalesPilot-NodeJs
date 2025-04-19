CREATE TABLE `activation_codes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `activation_code` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `activation_codes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `categories` (
  `category_id` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` TEXT COLLATE utf8mb4_general_ci,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `category_analytics` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `date` DATE NOT NULL,
  `revenue` DECIMAL(10,2) NOT NULL,
  `profit_margin` DECIMAL(10,2) NOT NULL,
  `year_over_year_growth` DECIMAL(10,2) NOT NULL,
  `cost_of_selling` DECIMAL(10,2) NOT NULL,
  `inventory_turnover_rate` DECIMAL(10,2) NOT NULL,
  `stock_to_sales_ratio` DECIMAL(10,2) NOT NULL,
  `sell_through_rate` DECIMAL(10,2) NOT NULL,
  `gross_margin_by_category` DECIMAL(10,2) NOT NULL,
  `net_margin_by_category` DECIMAL(10,2) NOT NULL,
  `gross_margin` DECIMAL(10,2) NOT NULL,
  `net_margin` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_sales` DECIMAL(10,2) NOT NULL,
  `total_quantity` INT NOT NULL,
  `total_profit` DECIMAL(10,2) NOT NULL,
  `total_expenses` DECIMAL(10,2) NOT NULL,
  `net_profit` DECIMAL(10,2) NOT NULL,
  `revenue_by_category` DECIMAL(10,2) NOT NULL,
  `most_sold_product_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `category_analytics_ibfk_1` FOREIGN KEY (`most_sold_product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `customers` (
  `customer_id` INT NOT NULL AUTO_INCREMENT,
  `customer_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_email` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_phone` VARCHAR(20) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_location` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `expenses` (
  `expense_id` INT NOT NULL AUTO_INCREMENT,
  `description` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `expense_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `feedback` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `message` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
/*!40101 SET character_set_client = @saved_cs_client */;

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
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `invoices` (
  `invoice_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(50) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `invoice_description` TEXT COLLATE utf8mb4_general_ci,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `page_access` (
  `id` INT NOT NULL,
  `page` VARCHAR(255) NOT NULL,
  `required_access_level` ENUM('trial','starter','business','enterprise') NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `password_resets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `reset_code` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `products` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `category_id` INT NOT NULL,
  `product_description` TEXT COLLATE utf8mb4_general_ci,
  `product_price` DECIMAL(10,2) NOT NULL,
  `product_discount` DECIMAL(10,2) NOT NULL,
  `product_quantity` INT NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `sales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `product_id` INT NOT NULL,
  `quantity_sold` INT NOT NULL,
  `price_sold` DECIMAL(10,2) NOT NULL,
  `total_sale_amount` DECIMAL(10,2) GENERATED ALWAYS AS ((`quantity_sold` * `price_sold`)) STORED,
  `sale_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `sales_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `subscriptions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `plan_name` VARCHAR(100) COLLATE utf8mb4_general_ci NOT NULL,
  `plan_description` TEXT COLLATE utf8mb4_general_ci NOT NULL,
  `plan_price` DECIMAL(10,2) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `subscription_status` ENUM('active','inactive','expired') COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `last_name` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

-- Remove the 'plans' table, as it's now merged into subscriptions
DROP TABLE IF EXISTS `plans`;

-- Adjust the relevant queries or functionality to reflect the new structure of the 'subscriptions' table.
