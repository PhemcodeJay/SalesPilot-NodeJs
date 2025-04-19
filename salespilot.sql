-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: salespilot
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activation_codes`
--

DROP TABLE IF EXISTS `activation_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activation_codes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `activation_code` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activation_codes`
--

LOCK TABLES `activation_codes` WRITE;
/*!40000 ALTER TABLE `activation_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `activation_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_analytics`
--

DROP TABLE IF EXISTS `category_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_analytics` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_sales` decimal(10,2) NOT NULL,
  `total_quantity` int NOT NULL,
  `total_profit` decimal(10,2) NOT NULL,
  `total_expenses` decimal(10,2) NOT NULL,
  `net_profit` decimal(10,2) NOT NULL,
  `revenue_by_category` decimal(10,2) NOT NULL,
  `most_sold_product_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_analytics`
--

LOCK TABLES `category_analytics` WRITE;
/*!40000 ALTER TABLE `category_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_location` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `expense_id` int NOT NULL AUTO_INCREMENT,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `expense_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`expense_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feedback`
--

DROP TABLE IF EXISTS `feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feedback` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phone` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feedback`
--

LOCK TABLES `feedback` WRITE;
/*!40000 ALTER TABLE `feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory` (
  `inventory_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `sales_qty` int NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `stock_qty` int DEFAULT NULL,
  `supply_qty` int DEFAULT NULL,
  `available_stock` int GENERATED ALWAYS AS (((`stock_qty` + `supply_qty`) - `sales_qty`)) STORED,
  `inventory_qty` int GENERATED ALWAYS AS ((`stock_qty` + `supply_qty`)) STORED,
  `product_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`inventory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `invoice_items_id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `item_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `qty` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) GENERATED ALWAYS AS ((`qty` * `price`)) STORED,
  PRIMARY KEY (`invoice_items_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` int NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `invoice_description` text COLLATE utf8mb4_general_ci,
  `order_date` date NOT NULL,
  `order_status` enum('Paid','Unpaid') COLLATE utf8mb4_general_ci NOT NULL,
  `order_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `delivery_address` text COLLATE utf8mb4_general_ci NOT NULL,
  `mode_of_payment` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `due_date` date NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `discount` decimal(5,2) NOT NULL,
  `total_amount` decimal(10,2) GENERATED ALWAYS AS ((`subtotal` - (`subtotal` * (`discount` / 100)))) STORED,
  PRIMARY KEY (`invoice_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `page_access`
--

DROP TABLE IF EXISTS `page_access`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `page_access` (
  `id` int NOT NULL,
  `page` varchar(255) NOT NULL,
  `required_access_level` enum('trial','starter','business','enterprise') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `page_access`
--

LOCK TABLES `page_access` WRITE;
/*!40000 ALTER TABLE `page_access` DISABLE KEYS */;
/*!40000 ALTER TABLE `page_access` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_resets`
--

DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reset_code` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `password_resets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_resets`
--

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `payment_method` enum('paypal','binance','mpesa','naira') NOT NULL,
  `payment_proof` varchar(255) NOT NULL,
  `payment_amount` decimal(10,2) NOT NULL,
  `payment_status` enum('pending','completed','failed') DEFAULT 'pending',
  `payment_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subscription_id` int DEFAULT NULL,
  `tenant_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_analytics`
--

DROP TABLE IF EXISTS `product_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_analytics` (
  `reports_id` int NOT NULL AUTO_INCREMENT,
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
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_sales` decimal(10,0) NOT NULL,
  `total_quantity` int NOT NULL,
  `total_profit` decimal(10,2) NOT NULL,
  `total_expenses` decimal(10,2) NOT NULL,
  `net_profit` decimal(10,2) NOT NULL,
  PRIMARY KEY (`reports_id`),
  CONSTRAINT `product_analytics_chk_1` CHECK (json_valid(`revenue_by_product`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_analytics`
--

LOCK TABLES `product_analytics` WRITE;
/*!40000 ALTER TABLE `product_analytics` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost` decimal(10,2) NOT NULL,
  `category_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `stock_qty` int NOT NULL,
  `supply_qty` int NOT NULL,
  `image_path` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `product_type` enum('Goods','Services','Digital') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Goods',
  `staff_name` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `inventory_qty` int GENERATED ALWAYS AS ((`stock_qty` + `supply_qty`)) STORED,
  `profit` decimal(10,2) GENERATED ALWAYS AS ((`price` - `cost`)) STORED,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `revenue_by_product`
--

DROP TABLE IF EXISTS `revenue_by_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `revenue_by_product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `product_id` int NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `total_quantity` int NOT NULL,
  `total_sales` decimal(15,2) NOT NULL,
  `total_cost` decimal(15,2) NOT NULL,
  `total_profit` decimal(15,2) NOT NULL,
  `inventory_turnover_rate` decimal(10,4) NOT NULL,
  `sell_through_rate` decimal(10,4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `revenue_by_product`
--

LOCK TABLES `revenue_by_product` WRITE;
/*!40000 ALTER TABLE `revenue_by_product` DISABLE KEYS */;
/*!40000 ALTER TABLE `revenue_by_product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `sales_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `sales_qty` int NOT NULL,
  `sale_status` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `payment_status` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `product_type` enum('goods','services','digital') COLLATE utf8mb4_general_ci NOT NULL,
  `sale_note` text COLLATE utf8mb4_general_ci,
  `sales_price` float NOT NULL,
  PRIMARY KEY (`sales_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staffs`
--

DROP TABLE IF EXISTS `staffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staffs` (
  `staff_id` int NOT NULL AUTO_INCREMENT,
  `staff_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `staff_email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `staff_phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `position` enum('manager','sales') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'sales',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staffs`
--

LOCK TABLES `staffs` WRITE;
/*!40000 ALTER TABLE `staffs` DISABLE KEYS */;
/*!40000 ALTER TABLE `staffs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscriptions`
--

DROP TABLE IF EXISTS `subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subscription_plan` enum('trial','starter','business','enterprise') DEFAULT 'trial',
  `end_date` datetime DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active',
  `is_free_trial_used` tinyint(1) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscriptions`
--

LOCK TABLES `subscriptions` WRITE;
/*!40000 ALTER TABLE `subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_general_ci DEFAULT 'inactive',
  `subscription_type` enum('trial','starter','business','enterprise') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'trial',
  `subscription_end_date` datetime NOT NULL,
  `subscription_start_date` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`) /*!80000 INVISIBLE */,
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `role` enum('sales','admin','manager') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'sales',
  `phone` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `activation_token` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_token` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime NOT NULL,
  `created_at` datetime NOT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `phone_UNIQUE` (`phone`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `tenant_id_UNIQUE` (`tenant_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-19 21:45:29
