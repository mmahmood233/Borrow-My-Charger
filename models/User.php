<?php
class User {
    private $conn;

    public function __construct($dbConn) {
        $this->conn = $dbConn;
    }

    public function emailExists($email) {
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch() ? true : false;
    }

    public function register($name, $email, $password, $role) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $status = ($role === "homeowner") ? "pending" : "approved";
        $stmt = $this->conn->prepare("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)");
        return $stmt->execute([$name, $email, $hashedPassword, $role, $status]);
    }

    public function login($email, $password) {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // For debugging
            // echo "User found: " . $user['email'] . "<br>";
            // echo "Password from DB: " . $user['password'] . "<br>";
            // echo "Entered password: " . $password . "<br>";
            // echo "Role: " . $user['role'] . "<br>";
            // echo "Status: " . $user['status'] . "<br>";
            
            // Special case for admin during development
            if ($user['role'] === 'admin' && $password === '123456') {
                return $user;
            }
            
            // Check if password matches
            $passwordVerified = password_verify($password, $user['password']);
            // echo "Password verified: " . ($passwordVerified ? 'Yes' : 'No') . "<br>";
            
            if ($passwordVerified) {
                // Check status for non-admin users
                if ($user['role'] !== 'admin' && $user['status'] !== 'approved') {
                    return ['error' => 'Account not approved or suspended.'];
                }
                return $user;
            }
        }
        
        return ['error' => 'Invalid email or password.'];
    }
}
?>