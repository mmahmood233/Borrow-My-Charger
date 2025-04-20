<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Booking Action";

// Check if user is logged in and is a homeowner
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'homeowner') {
    header("Location: login.php");
    exit;
}

// Check if ID and action are provided
if (!isset($_GET['id']) || empty($_GET['id']) || !isset($_GET['action']) || empty($_GET['action'])) {
    header("Location: homeowner-dashboard.php");
    exit;
}

$bookingId = $_GET['id'];
$action = $_GET['action'];

// Validate action
if ($action !== 'approve' && $action !== 'decline') {
    header("Location: homeowner-dashboard.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/Booking.php");
require_once("models/ChargePoint.php");

$bookingModel = new Booking($conn);
$chargePointModel = new ChargePoint($conn);

// Get booking details
$booking = $bookingModel->getById($bookingId);

// Check if booking exists
if (!$booking) {
    header("Location: homeowner-dashboard.php");
    exit;
}

// Get charge point details
$chargePoint = $chargePointModel->getById($booking['charge_point_id']);

// Check if the homeowner owns this charge point
if (!$chargePoint || $chargePoint['user_id'] != $_SESSION['user_id']) {
    header("Location: homeowner-dashboard.php");
    exit;
}

// Update booking status
$status = ($action === 'approve') ? 'approved' : 'declined';
if ($bookingModel->updateStatus($bookingId, $status)) {
    $message = ($action === 'approve') ? 'Booking approved successfully!' : 'Booking declined successfully!';
    $_SESSION['success_message'] = $message;
} else {
    $_SESSION['error_message'] = 'Failed to update booking status. Please try again.';
}

header("Location: homeowner-dashboard.php");
exit;
?>