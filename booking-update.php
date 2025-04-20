<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Update Booking";

// Check if user is logged in and is a homeowner
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'homeowner') {
    header("Location: login.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/Booking.php");
require_once("models/ChargePoint.php");

$bookingModel = new Booking($conn);
$chargePointModel = new ChargePoint($conn);

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['booking_id']) && isset($_POST['status'])) {
    $bookingId = $_POST['booking_id'];
    $status = $_POST['status'];
    
    // Validate status
    if ($status !== 'approved' && $status !== 'declined') {
        header("Location: homeowner-dashboard.php");
        exit;
    }
    
    // Get booking details
    $booking = $bookingModel->getById($bookingId);
    
    // Check if booking exists
    if (!$booking) {
        header("Location: homeowner-dashboard.php");
        exit;
    }
    
    // Get charge point details
    $chargePoint = $chargePointModel->getById($booking['charge_point_id']);
    
    // Check if charge point belongs to the current user
    if (!$chargePoint || $chargePoint['user_id'] != $_SESSION['user_id']) {
        header("Location: homeowner-dashboard.php");
        exit;
    }
    
    // Update booking status
    if ($bookingModel->updateStatus($bookingId, $status)) {
        // Redirect back to dashboard
        header("Location: homeowner-dashboard.php");
        exit;
    }
}

// If we get here, something went wrong
header("Location: homeowner-dashboard.php");
exit;
?>