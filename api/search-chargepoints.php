<?php
/**
 * API endpoint for AJAX search and filtering of charge points with real-time updates
 * 
 * This endpoint supports:
 * - Keyword search for location or owner
 * - Price range filtering
 * - Location-based search with radius
 * - Availability filtering
 * - Real-time updates since last timestamp
 */
session_start();
require_once('../databaseConn.php');
require_once('../models/ChargePoint.php');

// Set headers for AJAX response
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

// Ensure this is an AJAX request or allow direct access for testing
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) && !isset($_GET['debug'])) {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'message' => 'Access forbidden - AJAX requests only'
    ]);
    exit;
}

// Initialize charge point model
$chargePointModel = new ChargePoint($conn);

// Get search parameters with proper validation and defaults
$query = isset($_GET['query']) ? trim($_GET['query']) : '';
$minPrice = isset($_GET['min_price']) && $_GET['min_price'] !== '' ? (float)$_GET['min_price'] : null;
$maxPrice = isset($_GET['max_price']) && $_GET['max_price'] !== '' ? (float)$_GET['max_price'] : null;
$onlyAvailable = isset($_GET['available']) && $_GET['available'] == 1;
$latitude = isset($_GET['lat']) && is_numeric($_GET['lat']) ? (float)$_GET['lat'] : null;
$longitude = isset($_GET['lng']) && is_numeric($_GET['lng']) ? (float)$_GET['lng'] : null;
$radius = isset($_GET['radius']) && is_numeric($_GET['radius']) ? (float)$_GET['radius'] : 10;

// Get last update timestamp for real-time updates
$lastUpdate = isset($_GET['last_update']) ? (int)$_GET['last_update'] : null;

// Validate radius is within reasonable bounds
if ($radius < 1) {
    $radius = 1;  // Minimum 1km radius
} else if ($radius > 500) {
    $radius = 500; // Maximum 500km radius
}

// Search for charge points
$chargePoints = $chargePointModel->search(
    $query,
    $minPrice,
    $maxPrice,
    $onlyAvailable,
    $latitude,
    $longitude,
    $radius,
    $lastUpdate
);

// Current timestamp for client to use in next request
$currentTimestamp = time();

// Return results as JSON
echo json_encode([
    'success' => true,
    'timestamp' => $currentTimestamp,
    'data' => $chargePoints,
    'count' => count($chargePoints),
    'search_params' => [
        'query' => $query,
        'min_price' => $minPrice,
        'max_price' => $maxPrice,
        'available_only' => $onlyAvailable,
        'location' => ($latitude && $longitude) ? [
            'lat' => $latitude,
            'lng' => $longitude,
            'radius' => $radius
        ] : null
    ]
]);
