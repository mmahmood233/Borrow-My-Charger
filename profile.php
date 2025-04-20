<?php
session_start();
require_once("databaseConn.php");
require_once("models/User.php");

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$view = new stdClass();
$view->pageTitle = "My Profile";
$view->message = '';

$userModel = new User($conn);
$userId = $_SESSION['user_id'];
$view->user = $userModel->getUserById($userId);

// Handle profile update
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_profile'])) {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    
    // Basic validation
    if (empty($name) || empty($email)) {
        $view->message = '<div class="alert alert-danger">Name and email are required.</div>';
    } else {
        $result = $userModel->updateProfile($userId, $name, $email);
        
        if (isset($result['error'])) {
            $view->message = '<div class="alert alert-danger">' . $result['error'] . '</div>';
        } else {
            // Update session data
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;
            
            // Refresh user data
            $view->user = $userModel->getUserById($userId);
            $view->message = '<div class="alert alert-success">Profile updated successfully.</div>';
        }
    }
}

// Handle password change
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['change_password'])) {
    $currentPassword = $_POST['current_password'];
    $newPassword = $_POST['new_password'];
    $confirmPassword = $_POST['confirm_password'];
    
    // Basic validation
    if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
        $view->message = '<div class="alert alert-danger">All password fields are required.</div>';
    } else if ($newPassword !== $confirmPassword) {
        $view->message = '<div class="alert alert-danger">New passwords do not match.</div>';
    } else if (strlen($newPassword) < 6) {
        $view->message = '<div class="alert alert-danger">New password must be at least 6 characters.</div>';
    } else {
        $result = $userModel->changePassword($userId, $currentPassword, $newPassword);
        
        if (isset($result['error'])) {
            $view->message = '<div class="alert alert-danger">' . $result['error'] . '</div>';
        } else {
            $view->message = '<div class="alert alert-success">Password changed successfully.</div>';
        }
    }
}

require_once("views/profile/index.phtml");
?>