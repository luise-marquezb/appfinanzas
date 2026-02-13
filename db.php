<?php
$host = '127.0.0.1';
$port = '3306';
$db   = 'gastoxpress'; // As per db_schema.sql
$user = 'root';
$pass = '123456789';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // If database does not exist, try to create it
    if ($e->getCode() == 1049) { 
        try {
            $dsn_no_db = "mysql:host=$host;port=$port;charset=$charset";
            $pdo = new PDO($dsn_no_db, $user, $pass, $options);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db`");
            $pdo->exec("USE `$db`");
            
            // Execute schema if provided (assuming this file exists or we put logic here)
            if (file_exists('db_schema.sql')) {
                $sql = file_get_contents('db_schema.sql');
                $pdo->exec($sql);
            } else {
                 // Fallback inline schema creation if file missing? 
                 // For now, let's assume the schema file exists as I saw it in list_dir.
            }

        } catch (\PDOException $e2) {
             http_response_code(500);
             echo json_encode(['error' => 'Connection failed: ' . $e2->getMessage()]);
             exit;
        }
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Connection failed: ' . $e->getMessage()]);
        exit;
    }
}
?>
