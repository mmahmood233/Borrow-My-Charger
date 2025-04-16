<?php
// Simple MVC approach
$view = new stdClass();
$view->pageTitle = 'Home';
require_once('views/home/index.phtml');
?>
