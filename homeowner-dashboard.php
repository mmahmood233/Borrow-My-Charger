<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Homeowner Dashboard";

// Check if user is logged in and is a homeowner
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'homeowner') {
    header("Location: login.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/ChargePoint.php");
require_once("models/Booking.php");

$chargePointModel = new ChargePoint($conn);
$bookingModel = new Booking($conn);

$view->chargePoint = $chargePointModel->getByUserId($_SESSION['user_id']);
$view->bookings = $bookingModel->getByHomeownerId($_SESSION['user_id']);

require_once("views/homeowner/dashboard.phtml");
?>