<?php
// Start session to maintain login state
session_start();

// Simple MVC approach
$view = new stdClass();
$view->pageTitle = 'Home';

// Include database connection
require_once('databaseConn.php'); // Replace with actual path
require_once('models/ChargePoint.php');

// Get latest charge points
try {
    $chargePoint = new ChargePoint($conn); // $conn should be defined in your database file
    $view->latestChargePoints = $chargePoint->getLatest(3); // Get 3 latest charge points
} catch (Exception $e) {
    // Fallback to empty array if database error occurs
    $view->latestChargePoints = [];
}

require_once('views/home/index.phtml');
?>