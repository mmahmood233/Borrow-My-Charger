<?php
/**
 * API endpoint for updating booking status
 * 
 * This endpoint allows users to update booking statuses:
 * - Regular users can cancel their own bookings
 * - Homeowners can approve or decline bookings for their charge points
 * - Admins can update any booking status
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

// Ensure this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false, 
        'message' => 'Method not allowed. Use POST.',
        'code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

// Get request parameters
$bookingId = isset($_POST['booking_id']) ? (int)$_POST['booking_id'] : 0;
$status = isset($_POST['status']) ? trim($_POST['status']) : '';

// Validate parameters
if ($bookingId <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid booking ID.',
        'code' => 'INVALID_BOOKING_ID'
    ]);
    exit;
}

// Validate status
$validStatuses = ['pending', 'approved', 'declined', 'cancelled'];
if (!in_array($status, $validStatuses)) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => 'Invalid status. Must be one of: ' . implode(', ', $validStatuses),
        'code' => 'INVALID_STATUS'
    ]);
    exit;
}

try {
    // Initialize models
    $bookingModel = new Booking($conn);
    
    // Get user info
    $userId = $_SESSION['user_id'];
    $userRole = $_SESSION['user_role'] ?? 'user';
    
    // Get booking details
    $booking = $bookingModel->getById($bookingId);
    
    if (!$booking) {
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'message' => 'Booking not found.',
            'code' => 'BOOKING_NOT_FOUND'
        ]);
        exit;
    }
    
    // Check permissions based on user role
    $canUpdate = false;
    
    if ($userRole === 'admin') {
        // Admins can update any booking
        $canUpdate = true;
    } elseif ($userRole === 'user' && $booking['user_id'] == $userId) {
        // Users can only cancel their own bookings
        $canUpdate = ($status === 'cancelled');
    } elseif ($userRole === 'homeowner') {
        // Get charge point to check if homeowner owns it
        $stmt = $conn->prepare("SELECT user_id FROM charge_points WHERE id = ?");
        $stmt->execute([$booking['charge_point_id']]);
        $chargePoint = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Homeowners can approve or decline bookings for their charge points
        if ($chargePoint && $chargePoint['user_id'] == $userId) {
            $canUpdate = ($status === 'approved' || $status === 'declined');
        }
    }
    
    if (!$canUpdate) {
        http_response_code(403);
        echo json_encode([
            'success' => false, 
            'message' => 'You do not have permission to update this booking status.',
            'code' => 'PERMISSION_DENIED'
        ]);
        exit;
    }
    
    // Update booking status
    $success = $bookingModel->updateStatus($bookingId, $status);
    
    if ($success) {
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Booking status updated successfully.',
            'booking_id' => $bookingId,
            'status' => $status,
            'timestamp' => time()
        ]);
    } else {
        // Return error response
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update booking status.',
            'code' => 'UPDATE_FAILED'
        ]);
    }
    
} catch (Exception $e) {
    // Log error
    error_log('Update booking status API error: ' . $e->getMessage());
    
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred while updating booking status.',
        'code' => 'SERVER_ERROR'
    ]);
}
