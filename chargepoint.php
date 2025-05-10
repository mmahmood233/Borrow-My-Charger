<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Charge Point Details";

// Check if ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    header("Location: chargepoints.php");
    exit;
}

// Include database connection and model
require_once("databaseConn.php");
require_once("models/ChargePoint.php");

// Get charge point details
$chargePointId = $_GET['id'];
$chargePointModel = new ChargePoint($conn);
$view->chargePoint = $chargePointModel->getById($chargePointId);

// Check if charge point exists
if (!$view->chargePoint) {
    header("Location: chargepoints.php");
    exit;
}

require_once("views/chargepoint/show.phtml");
?>