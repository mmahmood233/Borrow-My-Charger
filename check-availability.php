<?php
// This file handles AJAX requests for checking charge point availability
header('Content-Type: application/json');

require_once("databaseConn.php");
require_once("models/Booking.php");

// Get parameters
$chargePointId = isset($_GET['charge_point_id']) ? $_GET['charge_point_id'] : null;
$date = isset($_GET['date']) ? $_GET['date'] : null;

if (!$chargePointId || !$date) {
    echo json_encode(['error' => 'Missing parameters']);
    exit;
}

// Create booking model
$bookingModel = new Booking($conn);

// Get existing bookings for this charge point on the selected date
$bookings = $bookingModel->getBookingsByDateAndChargePoint($chargePointId, $date);

// Return the bookings as JSON
echo json_encode(['bookings' => $bookings]);
?>