<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Contact Homeowner";

require_once("databaseConn.php");
require_once("models/Contact.php");
require_once("models/ChargePoint.php");
require_once("models/User.php");
require_once("utils/security.php");

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

// Ensure chargepoint ID is provided
if (!isset($_GET['chargepoint_id']) || empty($_GET['chargepoint_id'])) {
    header("Location: chargepoints.php");
    exit;
}

$chargePointId = $_GET['chargepoint_id'];
$chargePointModel = new ChargePoint($conn);
$userModel = new User($conn);
$contactModel = new Contact($conn);

// Get chargepoint details
$chargePoint = $chargePointModel->getById($chargePointId);
if (!$chargePoint) {
    header("Location: chargepoints.php");
    exit;
}

// Get homeowner details
$homeowner = $userModel->getUserById($chargePoint['user_id']);
if (!$homeowner) {
    header("Location: chargepoint.php?id=" . $chargePointId);
    exit;
}

$view->chargePoint = $chargePoint;
$view->homeowner = $homeowner;
$view->error = '';
$view->success = '';

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['contact_submit'])) {
    // Sanitize user input
    $subject = sanitizeInput(trim($_POST['subject']));
    $message = sanitizeInput(trim($_POST['message']));
    
    if (empty($subject) || empty($message)) {
        $view->error = "Both subject and message are required.";
    } else {
        // Send message
        $result = $contactModel->sendMessage(
            $_SESSION['user_id'],
            $homeowner['id'],
            $chargePointId,
            $subject,
            $message
        );
        
        if ($result) {
            $view->success = "Your message has been sent to the homeowner successfully.";
        } else {
            $view->error = "Failed to send message. Please try again.";
        }
    }
}

require_once("views/contact/form.phtml");
?>
