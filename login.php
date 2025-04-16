<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Login";
require_once("databaseConn.php");
require_once("models/User.php");

$userModel = new User($conn);
$view->error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_submit'])) {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    if (empty($email) || empty($password)) {
        $view->error = "Both fields are required.";
    } else {
        $result = $userModel->login($email, $password);
        if (isset($result['error'])) {
            $view->error = $result['error'];
        } else {

            $_SESSION['user_id'] = $result['id'];
            $_SESSION['user_role'] = $result['role'];
            $_SESSION['user_name'] = $result['name'];

            if ($result['role'] == 'admin') {
                header("Location: admin-dashboard.php");
            } elseif ($result['role'] == 'homeowner') {
                header("Location: homeowner-dashboard.php");
            } else {
                header("Location: user-dashboard.php");
            }
            exit;
        }
    }
}
require_once("views/users/login.phtml");
?>