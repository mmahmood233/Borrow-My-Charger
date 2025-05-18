<?php
require_once 'databaseConn.php';

// Set all existing charge points to use the default image
$stmt = $conn->prepare("UPDATE charge_points SET image = 'chargeimg' WHERE image IS NULL OR image = ''");

if ($stmt->execute()) {
    echo "<p>Successfully updated all charge points without images to use the default image.</p>";
    echo "<p>Affected rows: " . $stmt->rowCount() . "</p>";
} else {
    echo "<p>Error updating charge points: " . $stmt->errorInfo()[2] . "</p>";
}

echo "<p><a href='chargepoints.php'>Return to Charge Points</a></p>";
?>
