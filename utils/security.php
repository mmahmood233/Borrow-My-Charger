<?php
/**
 * Security utility functions for Borrow My Charger
 * Provides protection against XSS and SQL injection
 */

/**
 * Sanitize input to prevent XSS attacks
 * 
 * @param string $input The input to sanitize
 * @return string The sanitized input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = sanitizeInput($value);
        }
        return $input;
    }
    
    // Convert special characters to HTML entities
    return htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
}

/**
 * Sanitize output to prevent XSS attacks
 * 
 * @param string $output The output to sanitize
 * @return string The sanitized output
 */
function sanitizeOutput($output) {
    if (is_array($output)) {
        foreach ($output as $key => $value) {
            $output[$key] = sanitizeOutput($value);
        }
        return $output;
    }
    
    // Convert special characters to HTML entities
    return htmlspecialchars($output, ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email address
 * 
 * @param string $email The email to validate
 * @return bool True if valid, false otherwise
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Sanitize and validate URL
 * 
 * @param string $url The URL to sanitize and validate
 * @return string|false The sanitized URL or false if invalid
 */
function sanitizeUrl($url) {
    $url = filter_var($url, FILTER_SANITIZE_URL);
    if (filter_var($url, FILTER_VALIDATE_URL)) {
        return $url;
    }
    return false;
}

/**
 * Prevent CSRF attacks by generating and validating tokens
 */
class CSRFProtection {
    /**
     * Generate a CSRF token
     * 
     * @return string The generated token
     */
    public static function generateToken() {
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Validate a CSRF token
     * 
     * @param string $token The token to validate
     * @return bool True if valid, false otherwise
     */
    public static function validateToken($token) {
        if (!isset($_SESSION['csrf_token']) || $token !== $_SESSION['csrf_token']) {
            return false;
        }
        return true;
    }
}
?>
