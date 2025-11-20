<?php
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$input = getJsonInput();
$idCliente = isset($input['id_cliente']) ? (int)$input['id_cliente'] : 0;

if ($idCliente <= 0) {
    jsonResponse(['success' => false, 'message' => 'Id de cliente inválido.'], 422);
}

$descuento = normalizeDiscount($input['porcentaje_descuento'] ?? 0);

try {
    $pdo->beginTransaction();

    $stmtUsuario = $pdo->prepare('SELECT id_usuarios FROM tbl_usuarios WHERE id_usuarios = :id AND tipo_usuario = \'cliente\'');
    $stmtUsuario->execute([':id' => $idCliente]);
    if (!$stmtUsuario->fetchColumn()) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'El usuario no existe o no es un cliente.'], 404);
    }

    $stmtCliente = $pdo->prepare('SELECT COUNT(*) FROM tbl_clientes WHERE id_cliente = :id');
    $stmtCliente->execute([':id' => $idCliente]);
    $clienteExiste = (int)$stmtCliente->fetchColumn() > 0;

    if ($clienteExiste) {
        $sql = "UPDATE tbl_clientes
                SET cliente_vip = 1,
                    porcentaje_descuento = :descuento,
                    codigo_membresia = :codigo,
                    estado_membresia = :estado,
                    fecha_inicio_vip = COALESCE(:fecha_inicio, fecha_inicio_vip),
                    fecha_fin_vip = :fecha_fin,
                    notas = :notas
                WHERE id_cliente = :id";
    } else {
        $sql = "INSERT INTO tbl_clientes
                    (id_cliente, cliente_vip, porcentaje_descuento, codigo_membresia, estado_membresia, fecha_inicio_vip, fecha_fin_vip, notas)
                VALUES
                    (:id, 1, :descuento, :codigo, :estado, :fecha_inicio, :fecha_fin, :notas)";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $idCliente,
        ':descuento' => $descuento,
        ':codigo' => $input['codigo_membresia'] ?? null,
        ':estado' => $input['estado_membresia'] ?? 'activo',
        ':fecha_inicio' => $input['fecha_inicio_vip'] ?? date('Y-m-d'),
        ':fecha_fin' => $input['fecha_fin_vip'] ?? null,
        ':notas' => $input['notas'] ?? null,
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'El cliente ahora es VIP.',
        'cliente' => fetchVipById($pdo, $idCliente),
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'No se pudo convertir el cliente en VIP.',
        'error' => $e->getMessage(),
    ], 500);
}
