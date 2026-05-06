-- Kenchic Management System — Database Schema
-- Run this file in MySQL to set up all tables
-- Updated to include payments and M-Pesa Daraja support

CREATE DATABASE IF NOT EXISTS kenchic_db;
USE kenchic_db;

-- Users (all roles in one table)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('customer', 'farmer', 'employee') NOT NULL DEFAULT 'customer',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (covers both customer products and chicks)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  image_url VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') DEFAULT 'unpaid',
  order_type ENUM('delivery', 'pickup') DEFAULT 'delivery',
  delivery_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order items (one row per product in an order)
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments (M-Pesa STK Push transactions)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  -- Daraja STK Push fields
  merchant_request_id VARCHAR(100),
  checkout_request_id VARCHAR(100),
  mpesa_receipt_number VARCHAR(50),
  -- Status tracking
  status ENUM('initiated', 'pending', 'completed', 'failed', 'cancelled') DEFAULT 'initiated',
  result_code VARCHAR(10),
  result_desc TEXT,
  -- Timestamps
  initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Deliveries
CREATE TABLE IF NOT EXISTS deliveries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  driver_name VARCHAR(100),
  scheduled_date DATE,
  status ENUM('scheduled', 'in_transit', 'delivered', 'failed') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Inquiries (customer support)
CREATE TABLE IF NOT EXISTS inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  inquiry_type VARCHAR(80) NOT NULL,
  order_id INT,
  message TEXT NOT NULL,
  status ENUM('open', 'in_progress', 'resolved') DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────
-- Sample data for testing
-- ─────────────────────────────────────────────

-- Default employee account (password: "password")
INSERT INTO users (name, email, password, role, phone) VALUES
  ('Kenchic Admin', 'admin@kenchic.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee', '0700000000');

-- Sample products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
  ('Broiler Day-Old Chick', 'High quality broiler chick from certified hatchery', 80.00, 'chicks', 500),
  ('Layer Day-Old Chick', 'Layer breed chick, starts laying at 20 weeks', 90.00, 'chicks', 300),
  ('Kenchic Whole Chicken', 'Fresh whole chicken 1.5kg', 650.00, 'poultry', 100),
  ('Chicken Portions', 'Mixed chicken portions 1kg', 450.00, 'poultry', 150),
  ('Poultry Feed 50kg', 'Starter feed for chicks', 3200.00, 'feed', 80);
