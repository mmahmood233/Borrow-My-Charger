<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Login";
require_once("databaseConn.php");
require_once("models/User.php");
require_once("config/recaptcha.php");
require_once("utils/security.php");

$userModel = new User($conn);
$view->error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['login_submit'])) {
    // Sanitize user input to prevent XSS
    $email = sanitizeInput(trim($_POST['email']));
    $password = $_POST['password']; // Don't sanitize password as it will be hashed
    
    // Check if the robot checkbox was checked
    $robot_check = isset($_POST['robot_check']) ? true : false;
    $recaptcha_verified = $robot_check; // Only pass verification if checkbox was checked

    if (empty($email) || empty($password)) {
        $view->error = "Both fields are required.";
    } elseif (!$recaptcha_verified) {
        $view->error = "Please verify that you are not a robot.";
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