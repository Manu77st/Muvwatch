<?php
require_once __DIR__ . '/../../conexion.php';
require_once __DIR__ . '/schema.php';

ensureVipSchema($pdo);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function jsonResponse(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

function getJsonInput(): array
{
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

function normalizeDiscount($value): float
{
    $value = is_numeric($value) ? (float)$value : 0;
    if ($value < 0) {
        return 0;
    }

    if ($value > 100) {
        return 100;
    }

    return round($value, 2);
}

function fetchVipById(PDO $pdo, int $idCliente): ?array
{
    $sql = "SELECT 
                u.id_usuarios AS id_usuario,
                u.nombres,
                u.apellidos,
                u.correo,
                u.telefono,
                u.tipo_documento,
                u.numero_documento,
                u.fecha_nacimiento,
                u.activo,
                c.id_cliente,
                c.cliente_vip,
                c.porcentaje_descuento,
                c.codigo_membresia,
                c.estado_membresia,
                c.fecha_inicio_vip,
                c.fecha_fin_vip,
                c.notas
            FROM tbl_clientes c
            INNER JOIN tbl_usuarios u ON u.id_usuarios = c.id_cliente
            WHERE c.id_cliente = :id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $idCliente]);
    $row = $stmt->fetch();

    return $row ?: null;
}
