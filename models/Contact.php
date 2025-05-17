<?php

class Contact {
    private $conn;
    
    public function __construct($conn) {
        $this->conn = $conn;
    }
    
    /**
     * Send a message from a user to a homeowner
     * 
     * @param int $senderId User ID of the sender
     * @param int $receiverId User ID of the receiver (homeowner)
     * @param int $chargepointId ID of the chargepoint
     * @param string $subject Message subject
     * @param string $message Message content
     * @return bool True if message sent successfully, false otherwise
     */
    public function sendMessage($senderId, $receiverId, $chargepointId, $subject, $message) {
        try {
            // Check if messages table exists
            $tableExists = $this->checkTableExists('messages');
            if (!$tableExists) {
                $this->createMessagesTable();
            }
            
            // Prepare a simple insert statement
            $sql = "INSERT INTO messages (sender_id, receiver_id, chargepoint_id, subject, message, created_at, is_read) 
                   VALUES (?, ?, ?, ?, ?, NOW(), 0)";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$senderId, $receiverId, $chargepointId, $subject, $message]);
            return true;
        } catch (PDOException $e) {
            error_log("Message sending error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Check if a table exists
     * 
     * @param string $tableName Name of the table to check
     * @return bool True if table exists, false otherwise
     */
    private function checkTableExists($tableName) {
        try {
            $result = $this->conn->query("SHOW TABLES LIKE '{$tableName}'")->rowCount() > 0;
            return $result;
        } catch (PDOException $e) {
            return false;
        }
    }
    
    /**
     * Get all messages for a user
     * 
     * @param int $userId User ID
     * @param string $type 'sent' or 'received'
     * @return array Array of messages
     */
    public function getMessages($userId, $type = 'received') {
        try {
            $field = ($type === 'sent') ? 'sender_id' : 'receiver_id';
            $sql = "SELECT m.id, m.subject, m.message, m.created_at, m.is_read, 
                          s.name as sender_name, r.name as receiver_name, 
                          c.address as chargepoint_title, m.chargepoint_id 
                   FROM messages m 
                   JOIN users s ON m.sender_id = s.id 
                   JOIN users r ON m.receiver_id = r.id 
                   JOIN charge_points c ON m.chargepoint_id = c.id 
                   WHERE m.{$field} = ? 
                   ORDER BY m.created_at DESC 
                   LIMIT 50";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            // If the first query fails, try a simpler query without the join
            try {
                $sql = "SELECT m.id, m.subject, m.message, m.created_at, m.is_read, 
                              s.name as sender_name, r.name as receiver_name,
                              m.chargepoint_id
                       FROM messages m 
                       JOIN users s ON m.sender_id = s.id 
                       JOIN users r ON m.receiver_id = r.id 
                       WHERE m.{$field} = ? 
                       ORDER BY m.created_at DESC";
                
                $stmt = $this->conn->prepare($sql);
                $stmt->execute([$userId]);
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e2) {
                error_log("Get messages error (fallback): " . $e2->getMessage());
                return [];
            }
        }
    }
    
    /**
     * Mark a message as read
     * 
     * @param int $messageId Message ID
     * @return bool True if marked as read successfully, false otherwise
     */
    public function markAsRead($messageId) {
        try {
            $sql = "UPDATE messages SET is_read = 1 WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->execute([$messageId]);
            return true;
        } catch (PDOException $e) {
            error_log("Mark as read error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Create the messages table if it doesn't exist
     */
    private function createMessagesTable() {
        try {
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
            
            $this->conn->exec($sql);
            return true;
        } catch (PDOException $e) {
            error_log("Create table error: " . $e->getMessage());
            return false;
        }
    }
}
