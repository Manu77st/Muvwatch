<?php
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$search = trim($_GET['q'] ?? '');
$estado = $_GET['estado'] ?? '';
$membresia = $_GET['membresia'] ?? '';

$conditions = ['c.cliente_vip = 1'];
$params = [];

if ($search !== '') {
    $conditions[] = '(u.nombres LIKE :term OR u.apellidos LIKE :term OR u.correo LIKE :term OR u.numero_documento LIKE :term)';
    $params[':term'] = '%' . $search . '%';
}

if ($estado !== '') {
    $conditions[] = 'c.estado_membresia = :estado';
    $params[':estado'] = $estado;
}

if ($membresia !== '') {
    $conditions[] = 'c.codigo_membresia = :membresia';
    $params[':membresia'] = $membresia;
}

$where = implode(' AND ', $conditions);

$sql = "SELECT 
            u.id_usuarios AS id_usuario,
            u.nombres,
            u.apellidos,
            CONCAT(u.nombres, ' ', u.apellidos) AS nombre_completo,
            u.tipo_documento,
            u.numero_documento,
            u.correo,
            u.telefono,
            c.id_cliente,
            c.codigo_membresia,
            c.estado_membresia,
            c.porcentaje_descuento,
            c.fecha_inicio_vip,
            c.fecha_fin_vip,
            c.notas
        FROM tbl_clientes c
        INNER JOIN tbl_usuarios u ON u.id_usuarios = c.id_cliente
        WHERE {$where}
        ORDER BY u.nombres ASC";

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$clientes = $stmt->fetchAll() ?: [];

jsonResponse([
    'success' => true,
    'total' => count($clientes),
    'clientes' => $clientes,
]);
