<?php
/**
 * API endpoint for getting real-time booking status updates
 * 
 * This endpoint provides real-time updates for bookings based on user role:
 * - Regular users see their own bookings
 * - Homeowners see bookings for their charge points
 * - Admins see all bookings
 * 
 * The endpoint supports timestamp-based polling to minimize data transfer
 */

session_start();
require_once('../databaseConn.php');
require_once('../models/Booking.php');

// Set headers for AJAX response
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Ensure this is an AJAX request or allow direct access for testing
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) && !isset($_GET['debug'])) {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'message' => 'Access forbidden - AJAX requests only',
        'code' => 'FORBIDDEN'
    ]);
    exit;
}

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

// Get last update timestamp with validation
$lastUpdate = isset($_GET['last_update']) && is_numeric($_GET['last_update']) ? (int)$_GET['last_update'] : 0;

try {
    // Initialize booking model
    $bookingModel = new Booking($conn);
    
    // Get bookings based on user role
    $bookings = [];
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'] ?? 'user'; // Default to user role if not set
    
    switch ($userRole) {
        case 'user':
            // Regular users see their own bookings
            $bookings = $bookingModel->getByUserIdSince($userId, $lastUpdate);
            break;
            
        case 'homeowner':
            // Homeowners see bookings for their charge points
            $bookings = $bookingModel->getByHomeownerIdSince($userId, $lastUpdate);
            break;
            
        case 'admin':
            // Admins see all bookings
            $bookings = $bookingModel->getAllBookingsSince($lastUpdate);
            break;
            
        default:
            // Unknown role, return empty bookings
            $bookings = [];
    }
    
    // Current timestamp for client to use in next request
    $currentTimestamp = time();
    
    // Format response data
    $response = [
        'success' => true,
        'timestamp' => $currentTimestamp,
        'data' => $bookings,
        'count' => count($bookings),
        'user_info' => [
            'id' => $userId,
            'role' => $userRole
        ]
    ];
    
    // Return bookings as JSON
    echo json_encode($response);
    
} catch (Exception $e) {
    // Log error
    error_log('Booking status API error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while retrieving booking data.',
        'code' => 'SERVER_ERROR'
    ]);
}
