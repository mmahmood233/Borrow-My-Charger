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

    public function search($keyword = null, $minPrice = null, $maxPrice = null) {
        $sql = "SELECT cp.*, u.name as owner_name 
                FROM charge_points cp 
                JOIN users u ON cp.user_id = u.id 
                WHERE cp.availability = 1";
        $params = [];

        if ($keyword) {
            $sql .= " AND (cp.address LIKE ? OR u.name LIKE ?)";
            $params[] = "%$keyword%";
            $params[] = "%$keyword%";
        }

        if ($minPrice !== null) {
            $sql .= " AND cp.price >= ?";
            $params[] = $minPrice;
        }

        if ($maxPrice !== null) {
            $sql .= " AND cp.price <= ?";
            $params[] = $maxPrice;
        }

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>