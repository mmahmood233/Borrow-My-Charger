-- Borrow My Charger Database Script
-- This script creates the database and tables for the Borrow My Charger application

-- Create database
CREATE DATABASE IF NOT EXISTS borrow_my_charger;
USE borrow_my_charger;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'homeowner', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create charge_points table
CREATE TABLE IF NOT EXISTS charge_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    price DECIMAL(5, 2) NOT NULL,
    availability BOOLEAN DEFAULT TRUE,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    charge_point_id INT NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    message TEXT,
    status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (charge_point_id) REFERENCES charge_points(id) ON DELETE CASCADE
);

-- Insert sample data

-- Insert admin user
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Password: password

-- Insert homeowner
INSERT INTO users (name, email, password, role) VALUES 
('Lee Griffiths', 'lee@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'homeowner');
-- Password: password

-- Insert EV owner
INSERT INTO users (name, email, password, role) VALUES 
('John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');
-- Password: password

-- Insert charge point
INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability) 
VALUES (2, '5 The Cresent, Salford, M5 4WT', 53.483710, -2.270110, 0.25, 1);

-- Insert booking
INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message) 
VALUES (3, 1, '2025-04-15', '14:30:00', 'I need to charge my Tesla');
