<?php
$view = new stdClass();
$view->pageTitle = "Admin Dashboard";
$view->totalUsers = 3;
$view->totalChargePoints = 1;
$view->totalBookings = 0;
$view->pendingBookings = 0;
require_once("views/admin/dashboard.phtml");
?>