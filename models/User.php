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
            
            // Special case for test accounts during development
            if (($user['role'] === 'admin' && $email === 'admin@admin.com' && $password === '123456') ||
                ($user['role'] === 'homeowner' && $email === 'lee@lee.com' && $password === '123456') ||
                ($user['role'] === 'user' && $email === 'user@user.com' && $password === '123456')) {
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

    public function getAllUsers() {
        $stmt = $this->conn->query("SELECT * FROM users ORDER BY created_at DESC");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    public function getUserById($userId) {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    public function updateUserStatus($userId, $status) {
        $stmt = $this->conn->prepare("UPDATE users SET status = ? WHERE id = ?");
        return $stmt->execute([$status, $userId]);
    }
    
    public function deleteUser($userId) {
        // First, check if user is a homeowner with a charge point
        $stmt = $this->conn->prepare("SELECT COUNT(*) FROM charge_points WHERE user_id = ?");
        $stmt->execute([$userId]);
        $hasChargePoint = $stmt->fetchColumn() > 0;
        
        if ($hasChargePoint) {
            // Delete associated charge points first
            $stmtDeleteCP = $this->conn->prepare("DELETE FROM charge_points WHERE user_id = ?");
            $stmtDeleteCP->execute([$userId]);
        }
        
        // Delete user
        $stmt = $this->conn->prepare("DELETE FROM users WHERE id = ?");
        return $stmt->execute([$userId]);
    }
    
    public function updateProfile($userId, $name, $email) {
        // Check if email is already used by another user
        $stmt = $this->conn->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, $userId]);
        if ($stmt->fetch()) {
            return ['error' => 'Email already in use by another account.'];
        }
        
        // Update user profile
        $stmt = $this->conn->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
        $success = $stmt->execute([$name, $email, $userId]);
        
        if ($success) {
            return ['success' => true];
        } else {
            return ['error' => 'Failed to update profile.'];
        }
    }
    
    public function changePassword($userId, $currentPassword, $newPassword) {
        // Get current user data
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return ['error' => 'User not found.'];
        }
        
        // Special case for test accounts
        $isTestAccount = ($user['role'] === 'admin' && $user['email'] === 'admin@admin.com') ||
                         ($user['role'] === 'homeowner' && $user['email'] === 'lee@lee.com') ||
                         ($user['role'] === 'user' && $user['email'] === 'user@user.com');
        
        // Verify current password
        if ($isTestAccount && $currentPassword === '123456') {
            // Allow test accounts to change password
        } else if (!password_verify($currentPassword, $user['password'])) {
            return ['error' => 'Current password is incorrect.'];
        }
        
        // Update password
        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $this->conn->prepare("UPDATE users SET password = ? WHERE id = ?");
        $success = $stmt->execute([$hashedPassword, $userId]);
        
        if ($success) {
            return ['success' => true];
        } else {
            return ['error' => 'Failed to change password.'];
        }
    }
}
?>