<?php
$view = new stdClass();
$view->pageTitle = "Register";

require_once("databaseConn.php");
require_once("models/User.php");

$userModel = new User($conn);
$view->error = '';
$view->success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['register_submit'])) {
    $name = trim($_POST['name']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $role = $_POST['role'];

    if (empty($name) || empty($email) || empty($password) || empty($confirm_password)) {
        $view->error = "All fields are required.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $view->error = "Invalid email format.";
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