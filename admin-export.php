<?php
session_start();
require_once("databaseConn.php");
require_once("models/User.php");
require_once("models/ChargePoint.php");
require_once("models/Booking.php");

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    header("Location: login.php");
    exit;
}

// Check if we have a type
if (!isset($_GET['type'])) {
    $_SESSION['error'] = "Invalid export request.";
    header("Location: admin-dashboard.php");
    exit;
}

$type = $_GET['type'];

// Set headers for CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="' . $type . '_export_' . date('Y-m-d') . '.csv"');

// Create a file pointer connected to the output stream
$output = fopen('php://output', 'w');

// Process the export based on type
switch ($type) {
    case 'users':
        $userModel = new User($conn);
        $users = $userModel->getAllUsers();
        
        // Add the CSV headers
        fputcsv($output, ['ID', 'Name', 'Email', 'Role', 'Status', 'Created At']);
        
        // Add the data
        foreach ($users as $user) {
            fputcsv($output, [
                $user['id'],
                $user['name'],
                $user['email'],
                $user['role'],
                $user['status'],
                $user['created_at']
            ]);
        }
        break;
        
    case 'chargepoints':
        $chargePointModel = new ChargePoint($conn);
        $chargePoints = $chargePointModel->getAll();
        
        // Add the CSV headers
        fputcsv($output, ['ID', 'Owner Name', 'Address', 'Price', 'Availability', 'Created At']);
        
        // Add the data
        foreach ($chargePoints as $cp) {
            fputcsv($output, [
                $cp['id'],
                $cp['owner_name'],
                $cp['address'],
                $cp['price'],
                $cp['availability'] ? 'Available' : 'Not Available',
                $cp['created_at']
            ]);
        }
        break;
        
    case 'bookings':
        $bookingModel = new Booking($conn);
        $bookings = $bookingModel->getAllBookings();
        
        // Add the CSV headers
        fputcsv($output, ['ID', 'User Name', 'User Email', 'Charge Point Address', 'Owner Name', 'Booking Date', 'Booking Time', 'Status', 'Created At']);
        
        // Add the data
        foreach ($bookings as $booking) {
            fputcsv($output, [
                $booking['id'],
                $booking['user_name'],
                $booking['user_email'],
                $booking['address'],
                $booking['owner_name'],
                $booking['booking_date'],
                $booking['booking_time'],
                $booking['status'],
                $booking['created_at']
            ]);
        }
        break;
        
    default:
        // Close the file pointer
        fclose($output);
        
        $_SESSION['error'] = "Invalid export type.";
        header("Location: admin-dashboard.php");
        exit;
}

// Close the file pointer
fclose($output);
exit;
?>