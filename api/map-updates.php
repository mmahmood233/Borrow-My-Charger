<?php
// API endpoint for getting real-time map updates
session_start();
require_once('../databaseConn.php');
require_once('../models/ChargePoint.php');

// Ensure this is an AJAX request
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    header('HTTP/1.0 403 Forbidden');
    echo json_encode(['success' => false, 'message' => 'Access forbidden']);
    exit;
}

// Get last update timestamp
$lastUpdate = isset($_GET['last_update']) ? (int)$_GET['last_update'] : 0;

// Initialize charge point model
$chargePointModel = new ChargePoint($conn);

// Get updated charge points
$chargePoints = $chargePointModel->getUpdatedSince($lastUpdate);

// Return charge points as JSON
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'chargePoints' => $chargePoints,
    'count' => count($chargePoints),
    'timestamp' => time()
]);
