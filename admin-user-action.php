<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Admin User Action";

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    header("Location: login.php");
    exit;
}

require_once("databaseConn.php");
require_once("models/User.php");

$userModel = new User($conn);

// Check if ID and action are provided
if (!isset($_GET['id']) || !isset($_GET['action'])) {
    header("Location: admin-dashboard.php");
    exit;
}

$userId = $_GET['id'];
$action = $_GET['action'];

// Validate action
if (!in_array($action, ['approve', 'suspend', 'delete'])) {
    header("Location: admin-dashboard.php");
    exit;
}

// Get user details
$user = $userModel->getUserById($userId);

// Check if user exists and is not an admin
if (!$user || $user['role'] === 'admin') {
    header("Location: admin-dashboard.php");
    exit;
}

// Perform action
switch ($action) {
    case 'approve':
        $userModel->updateUserStatus($userId, 'approved');
        break;
    case 'suspend':
        $userModel->updateUserStatus($userId, 'suspended');
        break;
    case 'delete':
        $userModel->deleteUser($userId);
        break;
}

// Redirect back to admin dashboard
header("Location: admin-dashboard.php");
exit;
?>