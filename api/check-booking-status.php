<?php
// API endpoint to check booking status
header('Content-Type: application/json');
session_start();

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Check if booking ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    echo json_encode(['error' => 'Booking ID is required']);
    exit;
}

$bookingId = $_GET['id'];

require_once("../databaseConn.php");
require_once("../models/Booking.php");
require_once("../utils/security.php");

$bookingModel = new Booking($conn);

// Get booking details
$booking = $bookingModel->getById($bookingId);

// Check if booking exists and belongs to the current user
if (!$booking || ($_SESSION['user_role'] === 'user' && $booking['user_id'] != $_SESSION['user_id'])) {
    echo json_encode(['error' => 'Booking not found or access denied']);
    exit;
}

// Return booking status and other relevant information
echo json_encode([
    'id' => $booking['id'],
    'status' => $booking['status'],
    'statusText' => getStatusText($booking['status']),
    'statusClass' => getStatusClass($booking['status']),
    'timestamp' => time() // Include timestamp for client-side verification
]);

/**
 * Get human-readable status text
 */
function getStatusText($status) {
    switch ($status) {
        case 'pending':
            return 'Pending';
        case 'approved':
            return 'Approved';
        case 'declined':
            return 'Declined';
        default:
            return 'Unknown';
    }
}

/**
 * Get CSS class for status badge
 */
function getStatusClass($status) {
    switch ($status) {
        case 'pending':
            return 'badge-warning';
        case 'approved':
            return 'badge-success';
        case 'declined':
            return 'badge-danger';
        default:
            return 'badge-secondary';
    }
}
?>
