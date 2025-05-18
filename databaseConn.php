<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


//currently working locally so when u work just create a new database and 
// call it localdb and run the script when we are done we will host it then
$serverName = "20.126.5.244"; //change to uni ip when we are done
$database = "db202200948"; // change this after to ur db name 
$username = "u202200948"; //same here
$password = "u202200948"; //same here

  


try {
    $conn = new PDO("mysql:host=$serverName;dbname=$database;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Debug connection message - comment out in production
    // echo "Connected to MySQL database successfully!<br>";
    
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>