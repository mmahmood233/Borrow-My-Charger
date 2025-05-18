# Borrow My Charger

## Overview
Borrow My Charger is a web application that connects electric vehicle (EV) owners with homeowners who have EV charging points. The platform enables homeowners to list their charging points for rental, while EV owners can search for and book available charging points in their area.

## Features

### User Management
- Multi-role system (Admin, Homeowner, EV Owner)
- User registration and login with simple verification
- User status management (pending, approved, suspended)
- Secure password storage using bcrypt hashing

### Charge Point Management
- Homeowners can add, edit, and manage their charging points
- Image upload functionality for charging points
- Location-based search with Google Maps integration
- Pricing and availability settings

### Booking System
- EV owners can book available charging points
- Booking approval workflow
- Calendar-based availability
- Messaging system between users

### Admin Dashboard
- User management and approval
- Charge point oversight
- Booking statistics and monitoring
- System-wide messaging

## Technical Stack
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Backend**: PHP
- **Database**: MySQL
- **Maps**: Google Maps API

## Installation

1. Clone the repository to your XAMPP htdocs folder
2. Import the `borrow_my_charger.sql` file into your MySQL database
3. Configure database connection in `databaseConn.php`
4. Access the application via http://localhost/Borrow-My-Charger

## Default Users

- **Admin**: admin@admin.com (Password: 123456)
- **Homeowner**: lee@lee.com (Password: 123456)
- **EV Owner**: user@user.com (Password: 123456)

## Sample Data

The database includes sample data with:
- 30 charging points across various locations
- 30 bookings with different statuses (approved, pending, declined)
- 30 messages between users


