-- Borrow My Charger Database Script
-- This script creates the database and tables for the Borrow My Charger application

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'homeowner', 'admin') NOT NULL,
    status ENUM('pending', 'approved', 'suspended') DEFAULT 'pending',
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

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    chargepoint_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- Insert sample data

-- Insert admin user
INSERT INTO users (name, email, password, role, status) VALUES 
('User Lee Griffiths', 'admin@admin.com', '$2y$10$mQ0.KjOJVYwcRUCQYdar1OQJ9UjlU7MJ1YPRH9iA/Yce7xTnn0oGO', 'admin', 'approved');
-- Password: 123456

-- Insert homeowner
INSERT INTO users (name, email, password, role, status) VALUES 
('Lee Griffiths', 'lee@lee.com', '$2y$10$mQ0.KjOJVYwcRUCQYdar1OQJ9UjlU7MJ1YPRH9iA/Yce7xTnn0oGO', 'homeowner', 'approved');
-- Password: 123456

-- Insert EV owner
INSERT INTO users (name, email, password, role, status) VALUES 
('User Lee Griffiths', 'user@user.com', '$2y$10$mQ0.KjOJVYwcRUCQYdar1OQJ9UjlU7MJ1YPRH9iA/Yce7xTnn0oGO', 'user', 'approved');
-- Password: 123456

-- Insert charge point
INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability) 
VALUES (2, '5 The Cresent, Salford, M5 4WT', 53.483710, -2.270110, 0.25, 1);

-- Insert booking
INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message) 
VALUES (3, 1, '2025-04-15', '14:30:00', 'I need to charge my Tesla');


-- -- Insert 1000 users with 50 admins, 100 users, and 850 homeowners
-- INSERT INTO users (name, email, password, role, created_at)
-- SELECT 
--     CONCAT('User ', n) AS name,
--     CONCAT('user', n, '@example.com') AS email,
--     -- Using the same hashed password as in your sample data: 'password'
--     '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' AS password,
--     -- First 50 are admins, next 100 are users, the rest are homeowners
--     CASE 
--         WHEN n <= 50 THEN 'admin'
--         WHEN n <= 150 THEN 'user'
--         ELSE 'homeowner'
--     END AS role,
--     -- Create timestamps spread over the last year
--     DATE_SUB(NOW(), INTERVAL FLOOR(RAND() * 365) DAY) AS created_at
-- FROM (
--     -- Generate numbers 1 to 1000
--     WITH RECURSIVE numbers AS (
--         SELECT 1 AS n
--         UNION ALL
--         SELECT n + 1 FROM numbers WHERE n < 1000
--     )
--     SELECT n FROM numbers
-- ) AS numbers;

-- -- 30 Sample Charge Points
-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '5 The Cresent, Salford, M5 4WT', 53.483710, -2.270110, 0.25, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '10 Downing Street, London, SW1A 2AA', 51.503400, -0.127600, 0.35, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '221B Baker Street, London, NW1 6XE', 51.523700, -0.158500, 0.40, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '22 Market Street, Manchester, M1 1PT', 53.482400, -2.236300, 0.28, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '1600 Pennsylvania Avenue, Washington DC', 38.897700, -77.036500, 0.50, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '350 Fifth Avenue, New York, NY 10118', 40.748400, -73.985700, 0.65, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '1 Infinite Loop, Cupertino, CA 95014', 37.331800, -122.031300, 0.55, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '233 S Wacker Dr, Chicago, IL 60606', 41.878900, -87.635900, 0.45, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, '5 Avenue Anatole, Paris, 75007', 48.858400, 2.294500, 0.42, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Platz der Republik 1, 11011 Berlin', 52.518600, 13.376200, 0.38, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Piazza San Pietro, 00120 Vatican City', 41.902200, 12.453900, 0.40, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Calle Gran Via, 28013 Madrid', 40.420000, -3.705000, 0.36, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Praça do Comércio, 1100-148 Lisbon', 38.707900, -9.136500, 0.33, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Dam Square, Amsterdam', 52.373100, 4.893100, 0.39, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Grand Place, 1000 Brussels', 50.846700, 4.352800, 0.37, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Nyhavn 1, 1051 Copenhagen', 55.679800, 12.587400, 0.45, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Stortorget 1, 111 29 Stockholm', 59.325000, 18.071800, 0.48, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Mannerheimintie 1, 00100 Helsinki', 60.170800, 24.941500, 0.47, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Red Square, Moscow', 55.753900, 37.620300, 0.30, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Rynek Główny, 31-042 Krakow', 50.061900, 19.937300, 0.28, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Stephansplatz, 1010 Vienna', 48.208600, 16.373600, 0.42, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Andrássy út 22, 1061 Budapest', 47.502400, 19.040200, 0.32, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Syntagma Square, Athens', 37.975500, 23.734800, 0.35, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Piata Unirii, Bucharest', 44.426800, 26.102500, 0.30, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Marina Bay Sands, Singapore', 1.283300, 103.860300, 0.58, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'The Bund, Shanghai', 31.240500, 121.498900, 0.48, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Gangnam District, Seoul', 37.498100, 127.027600, 0.55, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Shibuya Crossing, Tokyo', 35.659500, 139.700600, 0.60, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Al Khuwair, Muscat', 23.597300, 58.545800, 0.33, 1, 'chargeimg');

-- INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
-- VALUES (2, 'Sultan Qaboos Street, Muscat', 23.588800, 58.408900, 0.35, 1, 'chargeimg');

-- -- 30 Sample Bookings
-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 1, '2025-05-20', '10:00:00', 'I need to charge my Tesla Model S', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 2, '2025-05-21', '14:30:00', 'Charging my Nissan Leaf', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 3, '2025-05-22', '09:15:00', 'Need a quick charge for my BMW i3', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 4, '2025-05-23', '16:45:00', 'Will be charging for about 2 hours', 'declined');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 5, '2025-05-24', '11:30:00', 'My Audi e-tron needs charging', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 6, '2025-05-25', '13:00:00', 'I have a Hyundai Kona Electric', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 7, '2025-05-26', '15:15:00', 'Charging my Kia e-Niro', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 8, '2025-05-27', '10:45:00', 'Need to charge my Jaguar I-PACE', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 9, '2025-05-28', '12:30:00', 'Charging my Volkswagen ID.4', 'declined');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 10, '2025-05-29', '14:00:00', 'My Polestar 2 needs a charge', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 11, '2025-06-01', '09:00:00', 'Charging my Ford Mustang Mach-E', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 12, '2025-06-02', '11:15:00', 'Need to charge my Rivian R1T', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 13, '2025-06-03', '13:45:00', 'Charging my Lucid Air', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 14, '2025-06-04', '15:30:00', 'My Chevrolet Bolt needs charging', 'declined');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 15, '2025-06-05', '10:30:00', 'Charging my Mini Electric', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 16, '2025-06-06', '12:00:00', 'Need to charge my Volvo XC40 Recharge', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 17, '2025-06-07', '14:15:00', 'Charging my Mazda MX-30', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 18, '2025-06-08', '16:00:00', 'My Fiat 500e needs a charge', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 19, '2025-06-09', '09:30:00', 'Charging my Honda e', 'declined');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 20, '2025-06-10', '11:45:00', 'Need to charge my Porsche Taycan', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 21, '2025-06-11', '13:30:00', 'Charging my Mercedes EQC', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 22, '2025-06-12', '15:45:00', 'My Lexus UX 300e needs charging', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 23, '2025-06-13', '10:15:00', 'Charging my DS 3 Crossback E-Tense', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 24, '2025-06-14', '12:45:00', 'Need to charge my Skoda Enyaq iV', 'declined');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 25, '2025-06-15', '14:30:00', 'Charging my SEAT el-Born', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 26, '2025-06-16', '16:15:00', 'My Renault Zoe needs a charge', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 27, '2025-06-17', '09:45:00', 'Charging my Peugeot e-208', 'pending');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 28, '2025-06-18', '11:00:00', 'Need to charge my Citroen e-C4', 'approved');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 29, '2025-06-19', '13:15:00', 'Charging my Vauxhall Corsa-e', 'declined');

-- INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
-- VALUES (3, 30, '2025-06-20', '15:00:00', 'My Smart EQ ForTwo needs charging', 'pending');

-- -- 30 Sample Messages
-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Question about charging point', 'Hi, I was wondering if your charging point is compatible with a Type 2 connector?', '2025-05-15 09:30:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Question about charging point', 'Yes, it has a Type 2 connector and is compatible with most EVs.', '2025-05-15 10:15:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Booking confirmation', 'Thank you for approving my booking. I will arrive on time.', '2025-05-16 14:20:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Booking confirmation', 'Great! Looking forward to meeting you. The charger is in the driveway.', '2025-05-16 15:05:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 1, 'Issue with booking', 'Hello Admin, I\'m having trouble with a booking. Can you help?', '2025-05-17 11:45:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (1, 3, 'RE: Issue with booking', 'I\'ll look into it right away and get back to you shortly.', '2025-05-17 12:30:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Charging speed question', 'What\'s the maximum kW output of your charger?', '2025-05-18 09:00:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Charging speed question', 'It\'s a 22kW charger, so it should charge most EVs quite quickly.', '2025-05-18 10:30:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Parking space', 'Is there dedicated parking for the charging spot?', '2025-05-19 14:15:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Parking space', 'Yes, there\'s a dedicated space right next to the charger.', '2025-05-19 15:45:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 1, 'Payment issue', 'I was charged twice for my last booking. Can you help?', '2025-05-20 11:20:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (1, 3, 'RE: Payment issue', 'I\'ve checked and issued a refund for the duplicate charge. It should appear in 3-5 business days.', '2025-05-20 13:10:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Late arrival', 'I might be 15 minutes late for my booking tomorrow. Is that okay?', '2025-05-21 18:30:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Late arrival', 'That\'s fine, I\'ll make sure the charger is available for you.', '2025-05-21 19:15:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 1, 'Account verification', 'I\'ve updated my profile but it still shows as unverified. Can you check?', '2025-05-22 10:45:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (1, 3, 'RE: Account verification', 'I\'ve manually verified your account. It should show as verified now.', '2025-05-22 11:30:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Charging cable', 'Do I need to bring my own cable or is one provided?', '2025-05-23 09:20:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Charging cable', 'There\'s a tethered cable attached to the charger, so you don\'t need to bring your own.', '2025-05-23 10:05:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 1, 'Feature suggestion', 'It would be great if we could rate chargers after using them. Just a suggestion!', '2025-05-24 15:40:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (1, 3, 'RE: Feature suggestion', 'That\'s a great idea! We\'re actually working on implementing a rating system in our next update.', '2025-05-24 16:25:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Weather concerns', 'It\'s supposed to rain tomorrow. Is the charger covered or sheltered?', '2025-05-25 19:10:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Weather concerns', 'Yes, it\'s under a carport so you\'ll stay dry while charging.', '2025-05-25 20:00:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 1, 'App suggestion', 'The app would be better with push notifications for booking updates.', '2025-05-26 11:15:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (1, 3, 'RE: App suggestion', 'Thanks for the feedback! We\'re planning to add push notifications in our next release.', '2025-05-26 12:30:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Booking extension', 'Can I extend my booking by an hour tomorrow if needed?', '2025-05-27 16:45:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (2, 3, 'RE: Booking extension', 'Yes, that should be fine. Just let me know when you arrive.', '2025-05-27 17:20:00', 1);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 1, 'Thank you', 'Just wanted to say thanks for creating this platform. It\'s been really helpful!', '2025-05-28 14:30:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (1, 3, 'RE: Thank you', 'You\'re welcome! We\'re glad you\'re finding it useful. Let us know if you have any other feedback.', '2025-05-28 15:15:00', 0);

-- INSERT INTO messages (sender_id, receiver_id, subject, message, created_at, is_read) 
-- VALUES (3, 2, 'Charging complete', 'Just wanted to let you know I\'ve finished charging and left. Thanks again!', '2025-05-29 12:10:00', 0);