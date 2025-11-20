<?php
require_once __DIR__ . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'JSON inválido']);
    exit;
}

$idCliente = $input['id_cliente'] ?? 1; // TODO: obtener de sesión
$idCajero  = $input['id_cajero'] ?? 2;   // TODO: obtener de sesión
$idFuncion = $input['id_funcion'] ?? null;
$total     = $input['total'] ?? null;
$sillas    = $input['sillas'] ?? [];
$metodo    = $input['metodo_pago'] ?? 'tarjeta';

if (!$idFuncion || !$total || !is_array($sillas) || empty($sillas)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Para simplificar: subtotal = total, sin descuento VIP calculado aquí
    $subtotal = $total;
    $descuentoVip = 0.00;

    $stmt = $pdo->prepare("INSERT INTO tbl_ventas (id_cliente, id_cajero, id_funcion, subtotal, descuento_vip, total, metodo_pago, numero_ticket)
                           VALUES (:id_cliente, :id_cajero, :id_funcion, :subtotal, :descuento_vip, :total, :metodo_pago, :numero_ticket)");

    $numeroTicket = 'T' . time();

    $stmt->execute([
        'id_cliente'     => $idCliente,
        'id_cajero'      => $idCajero,
        'id_funcion'     => $idFuncion,
        'subtotal'       => $subtotal,
        'descuento_vip'  => $descuentoVip,
        'total'          => $total,
        'metodo_pago'    => $metodo,
        'numero_ticket'  => $numeroTicket,
    ]);

    $idVenta = $pdo->lastInsertId();

    // Insertar detalles de sillas
    $stmtDetalle = $pdo->prepare("INSERT INTO detalles_venta (id_venta, id_silla, precio_silla)
                                  VALUES (:id_venta, :id_silla, :precio_silla)");

    foreach ($sillas as $silla) {
        // Por ahora no tenemos el id_silla real, así que guardamos 0
        $stmtDetalle->execute([
            'id_venta'      => $idVenta,
            'id_silla'      => 0,
            'precio_silla'  => $total / count($sillas),
        ]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'id_venta' => $idVenta, 'numero_ticket' => $numeroTicket]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al registrar la venta']);
}
