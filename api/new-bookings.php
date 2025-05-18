<?php
/**
 * API endpoint for getting real-time new booking notifications
 * 
 * This endpoint provides real-time updates for new bookings based on user role:
 * - Homeowners see new bookings for their charge points
 * - Admins see all new bookings
 */

session_start();
require_once('../databaseConn.php');
require_once('../models/Booking.php');

// Set headers for AJAX response
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false, 
        'message' => 'Authentication required. Please log in.',
        'code' => 'UNAUTHORIZED'
    ]);
    exit;
}

// Ensure user is a homeowner or admin
if (!isset($_SESSION['user_role']) || ($_SESSION['user_role'] !== 'homeowner' && $_SESSION['user_role'] !== 'admin')) {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'message' => 'Access forbidden - Homeowners and Admins only',
        'code' => 'FORBIDDEN'
    ]);
    exit;
}

// Get last update timestamp with validation
$lastUpdate = isset($_GET['last_update']) && is_numeric($_GET['last_update']) ? (int)$_GET['last_update'] : 0;
$role = isset($_GET['role']) ? $_GET['role'] : $_SESSION['user_role'];

try {
    // Initialize booking model
    $bookingModel = new Booking($conn);
    
    // Get bookings based on user role
    $bookings = [];
    $userId = $_SESSION['user_id'];
    
    if ($role === 'homeowner') {
        // Homeowners see bookings for their charge points
        $bookings = $bookingModel->getByHomeownerIdSince($userId, $lastUpdate);
    } else if ($role === 'admin') {
        // Admins see all bookings
        $bookings = $bookingModel->getAllBookingsSince($lastUpdate);
    }
    
    // Current timestamp for client to use in next request
    $currentTimestamp = time();
    
    // Format response data
    $response = [
        'success' => true,
        'timestamp' => $currentTimestamp,
        'data' => $bookings,
        'count' => count($bookings)
    ];
    
    // Return bookings as JSON
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log error
    error_log('New bookings API error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while retrieving booking data.',
        'code' => 'SERVER_ERROR'
    ]);
}
