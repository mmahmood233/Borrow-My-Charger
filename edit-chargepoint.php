<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Edit Charge Point";

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

// Check if ID is provided
if (!isset($_GET['id']) || empty($_GET['id'])) {
    header("Location: homeowner-dashboard.php");
    exit;
}

$chargePointId = $_GET['id'];
$chargePoint = $chargePointModel->getById($chargePointId);

// Check if charge point exists and belongs to the current user
if (!$chargePoint || $chargePoint['user_id'] != $_SESSION['user_id']) {
    header("Location: homeowner-dashboard.php");
    exit;
}

$view->chargePoint = $chargePoint;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['edit_chargepoint'])) {
    $address = trim($_POST['address']);
    $latitude = trim($_POST['latitude']);
    $longitude = trim($_POST['longitude']);
    $price = trim($_POST['price']);
    $availability = isset($_POST['availability']) ? 1 : 0;
    
    // Handle image upload
    $image = $chargePoint['image']; // Keep existing image by default
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
                // Delete old image if exists
                if ($chargePoint['image'] && file_exists($uploadDir . $chargePoint['image'])) {
                    unlink($uploadDir . $chargePoint['image']);
                }
                $image = $fileName;
            } else {
                $view->error = "Sorry, there was an error uploading your file.";
            }
        } else {
            $view->error = "File is not an image.";
        }
    }
    
    if (empty($view->error)) {
        if ($chargePointModel->update($chargePointId, $address, $latitude, $longitude, $price, $availability, $image)) {
            $view->success = "Charge point updated successfully!";
            // Refresh charge point data
            $view->chargePoint = $chargePointModel->getById($chargePointId);
        } else {
            $view->error = "Failed to update charge point. Please try again.";
        }
    }
}

require_once("views/homeowner/edit-charger.phtml");
?>