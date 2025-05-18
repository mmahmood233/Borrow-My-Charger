<?php
class Booking {
    private $conn;

    public function __construct($dbConn) {
        $this->conn = $dbConn;
    }

    public function create($userId, $chargePointId, $bookingDate, $bookingTime, $message) {
        // Ensure consistent time format (HH:MM)
        $formattedTime = $this->formatTimeString($bookingTime);
        
        $stmt = $this->conn->prepare("INSERT INTO bookings (user_id, charge_point_id, booking_date, booking_time, message, status) 
                                     VALUES (?, ?, ?, ?, ?, 'pending')");
        return $stmt->execute([$userId, $chargePointId, $bookingDate, $formattedTime, $message]);
    }

    public function getById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM bookings WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getByUserId($userId) {
        $stmt = $this->conn->prepare("
            SELECT b.*, cp.address, cp.price, u.name as owner_name 
            FROM bookings b
            JOIN charge_points cp ON b.charge_point_id = cp.id
            JOIN users u ON cp.user_id = u.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByHomeownerId($homeownerId) {
        $stmt = $this->conn->prepare("
            SELECT b.*, cp.address, u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN charge_points cp ON b.charge_point_id = cp.id
            JOIN users u ON b.user_id = u.id
            WHERE cp.user_id = ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$homeownerId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getAllBookings() {
        $stmt = $this->conn->prepare("
            SELECT b.*, 
                   cp.address, cp.price, 
                   u.name as user_name, u.email as user_email,
                   h.name as owner_name
            FROM bookings b
            JOIN charge_points cp ON b.charge_point_id = cp.id
            JOIN users u ON b.user_id = u.id
            JOIN users h ON cp.user_id = h.id
            ORDER BY b.created_at DESC
        ");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateStatus($id, $status) {
        // Validate status
        $validStatuses = ['pending', 'approved', 'declined', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            return false;
        }
        
        // Update status (note: updated_at column doesn't exist in the database yet)
        $stmt = $this->conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $id]);
    }
    
    public function getBookingsByDateAndChargePoint($chargePointId, $date) {
        $stmt = $this->conn->prepare("
            SELECT booking_time, status
            FROM bookings 
            WHERE charge_point_id = ? AND booking_date = ? AND status IN ('approved', 'pending')
            ORDER BY booking_time ASC
        ");
        $stmt->execute([$chargePointId, $date]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ensure all booking times are in the consistent format
        foreach ($bookings as &$booking) {
            $booking['booking_time'] = $this->formatTimeString($booking['booking_time']);
        }
        
        return $bookings;
    }
    
    /**
     * Get bookings for a user that have been updated since a specific timestamp
     * @param int $userId User ID
     * @param int $timestamp Unix timestamp
     * @return array Array of bookings
     */
    public function getByUserIdSince($userId, $timestamp) {
        $date = date('Y-m-d H:i:s', $timestamp);
        $stmt = $this->conn->prepare("
            SELECT b.*, cp.address, cp.price, u.name as owner_name 
            FROM bookings b
            JOIN charge_points cp ON b.charge_point_id = cp.id
            JOIN users u ON cp.user_id = u.id
            WHERE b.user_id = ? AND b.created_at > ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$userId, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get bookings for a homeowner's charge points that have been updated since a specific timestamp
     * @param int $homeownerId Homeowner user ID
     * @param int $timestamp Unix timestamp
     * @return array Array of bookings
     */
    public function getByHomeownerIdSince($homeownerId, $timestamp) {
        $date = date('Y-m-d H:i:s', $timestamp);
        
        // Log the query parameters for debugging
        error_log("Checking for new bookings for homeowner ID: {$homeownerId} since {$date}");
        
        // Modified query to ensure we capture all new bookings
        $stmt = $this->conn->prepare("
            SELECT b.*, cp.address, u.name as user_name, u.email as user_email
            FROM bookings b
            JOIN charge_points cp ON b.charge_point_id = cp.id
            JOIN users u ON b.user_id = u.id
            WHERE cp.user_id = ? AND b.created_at >= ?
            ORDER BY b.created_at DESC
        ");
        
        $stmt->execute([$homeownerId, $date]);
        $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log the number of bookings found
        error_log("Found " . count($bookings) . " new bookings for homeowner ID: {$homeownerId}");
        
        return $bookings;
    }
    
    /**
     * Get all bookings that have been updated since a specific timestamp (admin only)
     * @param int $timestamp Unix timestamp
     * @return array Array of bookings
     */
    public function getAllBookingsSince($timestamp) {
        $date = date('Y-m-d H:i:s', $timestamp);
        $stmt = $this->conn->prepare("
            SELECT b.*, 
                   cp.address, cp.price, 
                   u.name as user_name, u.email as user_email,
                   h.name as owner_name
            FROM bookings b
            JOIN charge_points cp ON b.charge_point_id = cp.id
            JOIN users u ON b.user_id = u.id
            JOIN users h ON cp.user_id = h.id
            WHERE b.created_at >= ?
            ORDER BY b.created_at DESC
        ");
        $stmt->execute([$date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Format time string to ensure consistent HH:MM format
     * @param string $timeStr The time string to format
     * @return string Formatted time in HH:MM format
     */
    private function formatTimeString($timeStr) {
        // If the time is already in the correct format, return it
        if (preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/', $timeStr)) {
            return $timeStr;
        }
        
        // Try to parse the time string
        $timestamp = strtotime($timeStr);
        if ($timestamp === false) {
            // If parsing fails, make a best effort to format it
            // Extract hours and minutes from the string
            if (preg_match('/([0-9]{1,2})[^0-9]*([0-5][0-9])/', $timeStr, $matches)) {
                $hour = (int)$matches[1];
                $minute = $matches[2];
                
                // Format with leading zeros
                return sprintf('%02d:%s', $hour, $minute);
            }
            
            // If all else fails, return the original string
            return $timeStr;
        }
        
        // Format the timestamp to HH:MM
        return date('H:i', $timestamp);
    }
}
?>