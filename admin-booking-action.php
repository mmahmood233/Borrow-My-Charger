<?php
session_start();
require_once("databaseConn.php");
require_once("models/Booking.php");

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    header("Location: login.php");
    exit;
}

// Check if we have an ID and action
if (!isset($_GET['id']) || !isset($_GET['action'])) {
    $_SESSION['error'] = "Invalid request.";
    header("Location: admin-dashboard.php");
    exit;
}

$bookingId = $_GET['id'];
$action = $_GET['action'];
$bookingModel = new Booking($conn);

// Get the booking to make sure it exists
$booking = $bookingModel->getById($bookingId);
if (!$booking) {
    $_SESSION['error'] = "Booking not found.";
    header("Location: admin-dashboard.php");
    exit;
}

// Process the action
switch ($action) {
    case 'approve':
        if ($bookingModel->updateStatus($bookingId, 'approved')) {
            $_SESSION['success'] = "Booking #" . $bookingId . " has been approved.";
        } else {
            $_SESSION['error'] = "Failed to approve booking.";
        }
        break;
        
    case 'decline':
        if ($bookingModel->updateStatus($bookingId, 'declined')) {
            $_SESSION['success'] = "Booking #" . $bookingId . " has been declined.";
        } else {
            $_SESSION['error'] = "Failed to decline booking.";
        }
        break;
        
    case 'delete':
        // For now, we'll just mark it as declined rather than actually deleting
        if ($bookingModel->updateStatus($bookingId, 'declined')) {
            $_SESSION['success'] = "Booking #" . $bookingId . " has been deleted.";
        } else {
            $_SESSION['error'] = "Failed to delete booking.";
        }
        break;
        
    default:
        $_SESSION['error'] = "Invalid action.";
        break;
}

// Redirect back to admin dashboard
header("Location: admin-dashboard.php");
exit;
?>