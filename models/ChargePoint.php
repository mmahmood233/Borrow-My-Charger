<?php
class ChargePoint {
    private $conn;

    public function __construct($dbConn) {
        $this->conn = $dbConn;
    }

    public function getByUserId($userId) {
        $stmt = $this->conn->prepare("SELECT * FROM charge_points WHERE user_id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM charge_points WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getAll() {
        $stmt = $this->conn->query("SELECT cp.*, u.name as owner_name 
                                   FROM charge_points cp 
                                   JOIN users u ON cp.user_id = u.id 
                                   WHERE cp.availability = 1");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getLatest($limit = 4) {
        // Modified to work without relying on created_at column
        $stmt = $this->conn->prepare("SELECT cp.*, u.name as owner_name 
                                     FROM charge_points cp 
                                     JOIN users u ON cp.user_id = u.id 
                                     WHERE cp.availability = 1 
                                     ORDER BY cp.id DESC 
                                     LIMIT ?");
        $stmt->bindParam(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($userId, $address, $latitude, $longitude, $price, $availability, $image = null) {
        $stmt = $this->conn->prepare("INSERT INTO charge_points (user_id, address, latitude, longitude, price, availability, image) 
                                     VALUES (?, ?, ?, ?, ?, ?, ?)");
        return $stmt->execute([$userId, $address, $latitude, $longitude, $price, $availability, $image]);
    }

    public function update($id, $address, $latitude, $longitude, $price, $availability, $image = null) {
        $sql = "UPDATE charge_points SET address = ?, latitude = ?, longitude = ?, price = ?, availability = ?";
        $params = [$address, $latitude, $longitude, $price, $availability];
        
        if ($image !== null) {
            $sql .= ", image = ?";
            $params[] = $image;
        }
        
        $sql .= " WHERE id = ?";
        $params[] = $id;
        
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute($params);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM charge_points WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    /**
     * Get charge points updated since a specific timestamp
     * @param int $timestamp Unix timestamp
     * @return array Array of charge points
     */
    public function getUpdatedSince($timestamp) {
        $date = date('Y-m-d H:i:s', $timestamp);
        $stmt = $this->conn->prepare("
            SELECT cp.*, u.name as owner_name 
            FROM charge_points cp 
            JOIN users u ON cp.user_id = u.id 
            WHERE cp.created_at > ? OR cp.id > (SELECT COALESCE(MAX(id), 0) FROM charge_points WHERE created_at <= ?)
            ORDER BY cp.id DESC
        ");
        $stmt->execute([$date, $date]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function search($keyword = null, $minPrice = null, $maxPrice = null, $onlyAvailable = true, $latitude = null, $longitude = null, $radius = 10, $lastUpdate = null) {
        $sql = "SELECT cp.*, u.name as owner_name 
                FROM charge_points cp 
                JOIN users u ON cp.user_id = u.id 
                WHERE 1=1";
        $params = [];

        // Filter by availability if specified
        if ($onlyAvailable) {
            $sql .= " AND cp.availability = 1";
        }

        // Keyword search for address or owner name
        if ($keyword) {
            $sql .= " AND (cp.address LIKE ? OR u.name LIKE ?)";
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
        }

        // Price range filters
        if ($minPrice !== null) {
            $sql .= " AND cp.price >= ?";
            $params[] = $minPrice;
        }

        if ($maxPrice !== null) {
            $sql .= " AND cp.price <= ?";
            $params[] = $maxPrice;
        }

        // Location-based search with radius calculation
        if ($latitude !== null && $longitude !== null && $radius > 0) {
            // Haversine formula to calculate distance in kilometers
            $sql .= " AND (
                6371 * acos(
                    cos(radians(?)) * 
                    cos(radians(cp.latitude)) * 
                    cos(radians(cp.longitude) - radians(?)) + 
                    sin(radians(?)) * 
                    sin(radians(cp.latitude))
                ) <= ?
            )";
            $params[] = $latitude;
            $params[] = $longitude;
            $params[] = $latitude;
            $params[] = $radius;
        }

        // Only get charge points updated since last timestamp
        if ($lastUpdate !== null) {
            $sql .= " AND cp.created_at > FROM_UNIXTIME(?)";
            $params[] = $lastUpdate;
        }

        // Order by distance if location is provided, otherwise by ID
        if ($latitude !== null && $longitude !== null) {
            $sql .= " ORDER BY (
                6371 * acos(
                    cos(radians(?)) * 
                    cos(radians(cp.latitude)) * 
                    cos(radians(cp.longitude) - radians(?)) + 
                    sin(radians(?)) * 
                    sin(radians(cp.latitude))
                )
            ) ASC";
            $params[] = $latitude;
            $params[] = $longitude;
            $params[] = $latitude;
        } else {
            $sql .= " ORDER BY cp.id DESC";
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>