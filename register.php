<?php
$view = new stdClass();
$view->pageTitle = "Register";

require_once("databaseConn.php");
require_once("models/User.php");
require_once("config/recaptcha.php");
require_once("utils/security.php");

$userModel = new User($conn);
$view->error = '';
$view->success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register_submit'])) {
    // Sanitize user input to prevent XSS
    $name = sanitizeInput(trim($_POST['name']));
    $email = sanitizeInput(trim($_POST['email']));
    $password = $_POST['password']; // Don't sanitize password as it will be hashed
    $confirm_password = $_POST['confirm_password']; // Don't sanitize password
    $role = sanitizeInput($_POST['role']);
    
    // Check if the robot checkbox was checked
    $robot_check = isset($_POST['robot_check']) ? true : false;
    $recaptcha_verified = $robot_check; // Only pass verification if checkbox was checked

    if (empty($name) || empty($email) || empty($password) || empty($confirm_password)) {
        $view->error = "All fields are required.";
    } elseif (!$recaptcha_verified) {
        $view->error = "Please verify that you are not a robot.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $view->error = "Invalid email format.";
    } elseif (strlen($password) < 8) {
        $view->error = "Password must be at least 8 characters long.";
    } elseif ($password !== $confirm_password) {
        $view->error = "Passwords do not match.";
    } elseif ($userModel->emailExists($email)) {
        $view->error = "Email already registered.";
    } else {
        if ($userModel->register($name, $email, $password, $role)) {
            $view->success = "Registration successful! You can now <a href='login.php'>login</a>.";
        } else {
            $view->error = "Registration failed. Please try again.";
        }
    }
}

require_once("views/users/register.phtml");
?>