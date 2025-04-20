<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Cancel Booking";

// Check if user is logged in and is a regular user
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'user') {
    header("Location: login.php");
    exit;
}

// Check if ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    header("Location: user-dashboard.php");
    exit;
}

$bookingId = $_GET['id'];

require_once("databaseConn.php");
require_once("models/Booking.php");

$bookingModel = new Booking($conn);

// Get booking details
$booking = $bookingModel->getById($bookingId);

// Check if booking exists and belongs to the current user
if (!$booking || $booking['user_id'] != $_SESSION['user_id']) {
    $_SESSION['error_message'] = "Invalid booking or you don't have permission to cancel it.";
    header("Location: user-dashboard.php");
    exit;
}

// Check if booking is in pending status
if ($booking['status'] !== 'pending') {
    $_SESSION['error_message'] = "Only pending bookings can be cancelled.";
    header("Location: user-dashboard.php");
    exit;
}

// Cancel the booking (use 'declined' status instead of 'cancelled')
if ($bookingModel->updateStatus($bookingId, 'declined')) {
    $_SESSION['success_message'] = "Booking cancelled successfully!";
} else {
    $_SESSION['error_message'] = "Failed to cancel booking. Please try again.";
}

header("Location: user-dashboard.php");
exit;
?>