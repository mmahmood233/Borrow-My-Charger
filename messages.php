<?php
session_start();
$view = new stdClass();
$view->pageTitle = "My Messages";

require_once("databaseConn.php");
require_once("models/Contact.php");

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$contactModel = new Contact($conn);

// Get message type (sent or received)
$type = isset($_GET['type']) && $_GET['type'] === 'sent' ? 'sent' : 'received';
$view->type = $type;

// Get messages
$view->messages = $contactModel->getMessages($_SESSION['user_id'], $type);

// Mark message as read if specified
if (isset($_GET['mark_read']) && !empty($_GET['mark_read'])) {
    $messageId = $_GET['mark_read'];
    $contactModel->markAsRead($messageId);
    header("Location: messages.php?type=" . $type);
    exit;
}

require_once("views/messages/index.phtml");
?>
