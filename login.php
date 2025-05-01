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
    
    // Verify reCAPTCHA
    $recaptcha_response = $_POST['g-recaptcha-response'] ?? '';
    $recaptcha_verified = false;
    
    if (!empty($recaptcha_response)) {
        $verify_response = file_get_contents('https://www.google.com/recaptcha/api/siteverify?secret='.$recaptcha_secret_key.'&response='.$recaptcha_response);
        $response_data = json_decode($verify_response);
        $recaptcha_verified = $response_data->success;
    }

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