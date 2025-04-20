<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Add Charge Point";

// Check if user is logged in and is a homeowner
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'homeowner') {
    header("Location: login.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/ChargePoint.php");

$chargePointModel = new ChargePoint($conn);
$view->error = '';
$view->success = '';

// Check if homeowner already has a charge point
$existingChargePoint = $chargePointModel->getByUserId($_SESSION['user_id']);
if ($existingChargePoint) {
    header("Location: homeowner-dashboard.php");
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_chargepoint'])) {
    $address = trim($_POST['address']);
    $latitude = trim($_POST['latitude']);
    $longitude = trim($_POST['longitude']);
    $price = trim($_POST['price']);
    $availability = isset($_POST['availability']) ? 1 : 0;
    
    // Validate inputs
    if (empty($address) || empty($latitude) || empty($longitude) || empty($price)) {
        $view->error = "All fields are required.";
    } elseif (!is_numeric($price) || $price <= 0 || $price > 999.99) {
        $view->error = "Price must be a positive number less than 1000.";
    } elseif (!is_numeric($latitude) || !is_numeric($longitude)) {
        $view->error = "Latitude and longitude must be valid numbers.";
    } else {
        // Handle image upload
        $image = null;
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = 'uploads/';
            
            // Create directory if it doesn't exist
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $fileName = time() . '_' . basename($_FILES['image']['name']);
            $targetFile = $uploadDir . $fileName;
            
            // Check if image file is a actual image
            $check = getimagesize($_FILES['image']['tmp_name']);
            if ($check !== false) {
                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
                    $image = $fileName;
                } else {
                    $view->error = "Sorry, there was an error uploading your file.";
                }
            } else {
                $view->error = "File is not an image.";
            }
        }
        
        if (empty($view->error)) {
            try {
                if ($chargePointModel->create($_SESSION['user_id'], $address, $latitude, $longitude, $price, $availability, $image)) {
                    $view->success = "Charge point added successfully!";
                    header("Location: homeowner-dashboard.php");
                    exit;
                } else {
                    $view->error = "Failed to add charge point. Please try again.";
                }
            } catch (PDOException $e) {
                $view->error = "Database error: " . $e->getMessage();
            }
        }
    }
}

require_once("views/homeowner/add-charger.phtml");
?>