<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


//currently working locally so when u work just create a new database and 
// call it localdb and run the script when we are done we will host it then
$serverName = "localhost"; //change to uni ip when we are done
$database = "localdb"; // change this after to ur db name 
$username = "root"; //same here
$password = ""; //same here

try {
    $conn = new PDO("mysql:host=$serverName;dbname=$database;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "Connected to MySQL database successfully!<br>";

    $stmt = $conn->query("SELECT id, name, email, role FROM users LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<pre>";
        print_r($row);
        echo "</pre>";
    }
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>