<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Admin Dashboard";

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    header("Location: login.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/User.php");
require_once("models/ChargePoint.php");
require_once("models/Booking.php");

$userModel = new User($conn);
$chargePointModel = new ChargePoint($conn);
$bookingModel = new Booking($conn);

// Get all users and charge points
$view->users = $userModel->getAllUsers();
$view->chargePoints = $chargePointModel->getAll();

// Get all bookings
$view->bookings = $bookingModel->getAllBookings();

// Generate basic reports
$view->totalUsers = count($view->users);
$view->totalChargePoints = count($view->chargePoints);
$view->totalBookings = count($view->bookings);

// Count users by role
$view->usersByRole = [
    'admin' => 0,
    'homeowner' => 0,
    'user' => 0
];

foreach ($view->users as $user) {
    $view->usersByRole[$user['role']]++;
}

// Count bookings by status
$view->bookingsByStatus = [
    'pending' => 0,
    'approved' => 0,
    'declined' => 0
];

foreach ($view->bookings as $booking) {
    if (isset($view->bookingsByStatus[$booking['status']])) {
        $view->bookingsByStatus[$booking['status']]++;
    }
}

require_once("views/admin/dashboard.phtml");
?>