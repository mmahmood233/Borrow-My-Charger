<?php
// This file handles AJAX requests for charge point searches
header('Content-Type: application/json');

require_once("databaseConn.php");
require_once("models/ChargePoint.php");

$chargePointModel = new ChargePoint($conn);

// Get search parameters
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$minPrice = isset($_GET['min_price']) && is_numeric($_GET['min_price']) ? $_GET['min_price'] : null;
$maxPrice = isset($_GET['max_price']) && is_numeric($_GET['max_price']) ? $_GET['max_price'] : null;

// Get charge points based on search criteria
$chargePoints = $chargePointModel->search($keyword, $minPrice, $maxPrice);

// Return results as JSON
echo json_encode($chargePoints);
?>