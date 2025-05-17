<?php
session_start();
$view = new stdClass();
$view->pageTitle = "Send Message";

require_once("databaseConn.php");

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: login.php");
    exit;
}

$view->error = '';
$view->success = '';

// Get chargepoint and homeowner info if provided
$chargePointId = isset($_GET['chargepoint_id']) ? intval($_GET['chargepoint_id']) : 0;
$homeownerId = isset($_GET['homeowner_id']) ? intval($_GET['homeowner_id']) : 0;

// If we have a chargepoint ID but no homeowner ID, try to get the homeowner
if ($chargePointId > 0 && $homeownerId == 0) {
    try {
        $stmt = $conn->prepare("SELECT user_id, title, address FROM chargepoints WHERE id = ?");
        $stmt->execute([$chargePointId]);
        $chargepoint = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($chargepoint) {
            $homeownerId = $chargepoint['user_id'];
            $view->chargepoint = $chargepoint;
        }
    } catch (PDOException $e) {
        $view->error = "Error retrieving chargepoint information.";
    }
}

// Get homeowner info if we have an ID
if ($homeownerId > 0) {
    try {
        $stmt = $conn->prepare("SELECT id, name FROM users WHERE id = ? AND role = 'homeowner'");
        $stmt->execute([$homeownerId]);
        $homeowner = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($homeowner) {
            $view->homeowner = $homeowner;
        } else {
            $view->error = "Homeowner not found.";
        }
    } catch (PDOException $e) {
        $view->error = "Error retrieving homeowner information.";
    }
}

// Process form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['send_message'])) {
    $receiverId = intval($_POST['receiver_id']);
    $chargepointId = intval($_POST['chargepoint_id']);
    $subject = trim($_POST['subject']);
    $message = trim($_POST['message']);
    
    if (empty($subject) || empty($message) || $receiverId <= 0) {
        $view->error = "All fields are required and receiver must be specified.";
    } else {
        try {
            // Check if messages table exists
            $result = $conn->query("SHOW TABLES LIKE 'messages'");
            $tableExists = $result->rowCount() > 0;
            
            // Create table if it doesn't exist
            if (!$tableExists) {
                $sql = "CREATE TABLE IF NOT EXISTS messages (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sender_id INT NOT NULL,
                    receiver_id INT NOT NULL,
                    chargepoint_id INT NOT NULL,
                    subject VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    created_at DATETIME NOT NULL,
                    is_read TINYINT(1) DEFAULT 0
                )";
                $conn->exec($sql);
            }
            
            // Insert the message
            $sql = "INSERT INTO messages (sender_id, receiver_id, chargepoint_id, subject, message, created_at, is_read) 
                   VALUES (?, ?, ?, ?, ?, NOW(), 0)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                $_SESSION['user_id'],
                $receiverId,
                $chargepointId,
                $subject,
                $message
            ]);
            
            $view->success = "Your message has been sent successfully!";
        } catch (PDOException $e) {
            $view->error = "Error sending message: " . $e->getMessage();
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $view->pageTitle; ?> - Borrow My Charger</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">
    <link rel="stylesheet" href="css/styles.css">
</head>
<body class="bg-light">
    <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-charging-station mr-2"></i>Borrow My Charger
            </a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="<?php echo $_SESSION['user_role'] === 'homeowner' ? 'homeowner-dashboard.php' : 'user-dashboard.php'; ?>">
                            <i class="fas fa-tachometer-alt mr-1"></i>Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="messages.php">
                            <i class="fas fa-envelope mr-1"></i>Messages
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="logout.php">
                            <i class="fas fa-sign-out-alt mr-1"></i>Logout
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container mt-4">
        <div class="row">
            <div class="col-md-8 mx-auto">
                <div class="card shadow-sm">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0"><i class="fas fa-envelope mr-2"></i>Send Message</h4>
                    </div>
                    <div class="card-body">
                        <?php if (!empty($view->error)): ?>
                            <div class="alert alert-danger">
                                <i class="fas fa-exclamation-circle mr-2"></i><?php echo $view->error; ?>
                            </div>
                        <?php endif; ?>
                        
                        <?php if (!empty($view->success)): ?>
                            <div class="alert alert-success">
                                <i class="fas fa-check-circle mr-2"></i><?php echo $view->success; ?>
                                <div class="mt-3">
                                    <a href="messages.php" class="btn btn-primary">View My Messages</a>
                                    <a href="<?php echo $_SESSION['user_role'] === 'homeowner' ? 'homeowner-dashboard.php' : 'user-dashboard.php'; ?>" class="btn btn-outline-secondary ml-2">Back to Dashboard</a>
                                </div>
                            </div>
                        <?php else: ?>
                            <?php if (isset($view->homeowner)): ?>
                                <form method="post" action="">
                                    <input type="hidden" name="receiver_id" value="<?php echo $view->homeowner['id']; ?>">
                                    <input type="hidden" name="chargepoint_id" value="<?php echo $chargePointId; ?>">
                                    
                                    <div class="form-group">
                                        <label for="to">To:</label>
                                        <input type="text" id="to" class="form-control" value="<?php echo htmlspecialchars($view->homeowner['name']); ?>" readonly>
                                    </div>
                                    
                                    <?php if (isset($view->chargepoint)): ?>
                                        <div class="form-group">
                                            <label for="chargepoint">Regarding Chargepoint:</label>
                                            <input type="text" id="chargepoint" class="form-control" value="<?php echo htmlspecialchars($view->chargepoint['title'] . ' (' . $view->chargepoint['address'] . ')'); ?>" readonly>
                                        </div>
                                    <?php endif; ?>
                                    
                                    <div class="form-group">
                                        <label for="subject">Subject:</label>
                                        <input type="text" id="subject" name="subject" class="form-control" required>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="message">Message:</label>
                                        <textarea id="message" name="message" class="form-control" rows="6" required></textarea>
                                    </div>
                                    
                                    <div class="form-group">
                                        <button type="submit" name="send_message" class="btn btn-primary">
                                            <i class="fas fa-paper-plane mr-2"></i>Send Message
                                        </button>
                                        <a href="<?php echo isset($view->chargepoint) ? 'chargepoint.php?id=' . $chargePointId : ($_SESSION['user_role'] === 'homeowner' ? 'homeowner-dashboard.php' : 'user-dashboard.php'); ?>" class="btn btn-outline-secondary ml-2">
                                            <i class="fas fa-times mr-2"></i>Cancel
                                        </a>
                                    </div>
                                </form>
                            <?php else: ?>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle mr-2"></i>Please select a homeowner to send a message to.
                                </div>
                                <a href="<?php echo $_SESSION['user_role'] === 'homeowner' ? 'homeowner-dashboard.php' : 'user-dashboard.php'; ?>" class="btn btn-primary">
                                    <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
                                </a>
                            <?php endif; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.16.1/dist/umd/popper.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>
</html>
