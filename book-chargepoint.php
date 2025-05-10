<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Book Charge Point";

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Check if user has the correct role
if ($_SESSION['user_role'] === 'admin') {
    // For admins, show a message instead of redirecting
    $view->pageTitle = "Access Restricted";
    $view->error = "As an administrator, you can manage the system but cannot book charge points. This feature is only available for regular users.";
    require_once("views/error.phtml");
    exit;
} else if ($_SESSION['user_role'] !== 'user') {
    // For homeowners or other roles
    header("Location: index.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/ChargePoint.php");
require_once("models/Booking.php");

// Check if ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    header("Location: chargepoints.php");
    exit;
}

$chargePointId = $_GET['id'];
$chargePointModel = new ChargePoint($conn);
$bookingModel = new Booking($conn);

// Get charge point details
$chargePoint = $chargePointModel->getById($chargePointId);

// Check if charge point exists and is available
if (!$chargePoint || !$chargePoint['availability']) {
    header("Location: chargepoints.php");
    exit;
}

$view->chargePoint = $chargePoint;
$view->error = '';
$view->success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['book_submit'])) {
    $bookingDate = $_POST['booking_date'];
    $bookingTime = $_POST['booking_time'];
    $message = trim($_POST['message']);
    
    // Validate inputs
    if (empty($bookingDate) || empty($bookingTime)) {
        $view->error = "Date and time are required.";
    } else {
        // Check if the date is in the future
        $bookingDateTime = new DateTime($bookingDate . ' ' . $bookingTime);
        $now = new DateTime();
        
        if ($bookingDateTime <= $now) {
            $view->error = "Booking must be for a future date and time.";
        } else {
            // Create booking
            if ($bookingModel->create($_SESSION['user_id'], $chargePointId, $bookingDate, $bookingTime, $message)) {
                $view->success = "Booking request submitted successfully! The homeowner will review your request.";
            } else {
                $view->error = "Failed to submit booking request. Please try again.";
            }
        }
    }
}

require_once("views/chargepoint/book.phtml");
?>