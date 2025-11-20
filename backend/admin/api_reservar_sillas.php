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

$idCliente = $input['id_cliente'] ?? 1; // TODO: tomar de sesión
$idFuncion = $input['id_funcion'] ?? null;
$sillasCodigos = $input['sillas'] ?? [];

if (!$idFuncion || !is_array($sillasCodigos) || empty($sillasCodigos)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Datos incompletos']);
    exit;
}

try {
    $pdo->beginTransaction();

    // Crear reserva simple
    $stmtReserva = $pdo->prepare("INSERT INTO tbl_reservas (id_cliente, id_funcion, fecha_reserva, hora, fecha_expiracion, estado)
                                  VALUES (:id_cliente, :id_funcion, CURDATE(), CURTIME(), DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'activa')");

    $stmtReserva->execute([
        'id_cliente' => $idCliente,
        'id_funcion' => $idFuncion,
    ]);

    $idReserva = $pdo->lastInsertId();

    // Mapear códigos A1, B3, etc. a id_silla reales
    // Consulta: todas las sillas de la sala de la función
    $sqlSillas = "SELECT s.id_silla, CONCAT(s.fila, s.numero) AS codigo
                  FROM tbl_sillas s
                  INNER JOIN tbl_bloquesillas b ON s.id_bloque = b.id_bloque
                  INNER JOIN tbl_salas sa ON b.id_sala = sa.id_sala
                  INNER JOIN tbl_funcion f ON f.id_sala = sa.id_sala
                  WHERE f.id_funcion = :id_funcion";

    $stmtSillas = $pdo->prepare($sqlSillas);
    $stmtSillas->execute(['id_funcion' => $idFuncion]);
    $todasSillas = $stmtSillas->fetchAll();

    $mapCodigoId = [];
    foreach ($todasSillas as $s) {
        $mapCodigoId[$s['codigo']] = $s['id_silla'];
    }

    $stmtDetalle = $pdo->prepare("INSERT INTO detalles_reserva (id_reserva, id_silla) VALUES (:id_reserva, :id_silla)");

    foreach ($sillasCodigos as $codigo) {
        if (!isset($mapCodigoId[$codigo])) {
            continue; // si no existe esa silla en la sala, la ignoramos
        }
        $idSilla = $mapCodigoId[$codigo];

        $stmtDetalle->execute([
            'id_reserva' => $idReserva,
            'id_silla'   => $idSilla,
        ]);

        // Marcar silla como no disponible
        $pdo->prepare("UPDATE tbl_sillas SET disponible = 0 WHERE id_silla = :id_silla")
            ->execute(['id_silla' => $idSilla]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'id_reserva' => $idReserva]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al reservar sillas']);
}
