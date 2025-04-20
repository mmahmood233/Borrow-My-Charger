<?php
session_start();
$view = new stdClass();
$view->pageTitle = "User Dashboard";

// Check if user is logged in and is a regular user
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'user') {
    header("Location: login.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/Booking.php");

$bookingModel = new Booking($conn);
$view->bookings = $bookingModel->getByUserId($_SESSION['user_id']);

require_once("views/users/dashboard.phtml");
?>