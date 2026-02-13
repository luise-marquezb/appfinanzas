<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

if (!isset($pdo)) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed internally']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Fetch all transactions
        $stmt = $pdo->query("SELECT id, descripcion as description, monto as amount, tipo as type, categoria as category, fecha as date FROM transacciones ORDER BY fecha DESC, id DESC");
        $data = $stmt->fetchAll();
        
        // Ensure numeric values are numbers, not strings (PDO sometimes returns strings)
        foreach ($data as &$row) {
             $row['amount'] = (float)$row['amount'];
        }
        
        echo json_encode($data);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);

        // Simple validation
        if (!isset($input['description']) || !isset($input['amount']) || !isset($input['date'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
            exit;
        }

        $sql = "INSERT INTO transacciones (descripcion, monto, tipo, categoria, fecha, usuario_id) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        // Default usuario_id to 1 as per schema.
        $usuario_id = 1;

        try {
            $stmt->execute([
                $input['description'],
                $input['amount'],
                $input['type'],
                $input['category'],
                $input['date'],
                $usuario_id
            ]);
            echo json_encode(['id' => $pdo->lastInsertId(), 'message' => 'Movimiento creado']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Error al insertar: ' . $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Allow deleting all or single
        $id = isset($_GET['id']) ? $_GET['id'] : null;

        if (!$id) {
            http_response_code(400);
            echo json_encode(['error' => 'ID no proporcionado']);
            exit;
        }

        $stmt = $pdo->prepare("DELETE FROM transacciones WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['message' => 'Movimiento eliminado']);
        break;

    case 'OPTIONS':
        http_response_code(200);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        break;
}
?>
