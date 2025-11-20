<?php
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$input = getJsonInput();
$idCliente = isset($input['id_cliente']) ? (int)$input['id_cliente'] : 0;

if ($idCliente <= 0) {
    jsonResponse(['success' => false, 'message' => 'Id de cliente inválido.'], 422);
}

$descuento = isset($input['porcentaje_descuento']) ? normalizeDiscount($input['porcentaje_descuento']) : null;

try {
    $pdo->beginTransaction();

    if (!fetchVipById($pdo, $idCliente)) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Cliente VIP no encontrado.'], 404);
    }

    $sqlUsuario = "UPDATE tbl_usuarios SET
            nombres = COALESCE(:nombres, nombres),
            apellidos = COALESCE(:apellidos, apellidos),
            correo = COALESCE(:correo, correo),
            telefono = COALESCE(:telefono, telefono),
            tipo_documento = COALESCE(:tipo_documento, tipo_documento),
            numero_documento = COALESCE(:numero_documento, numero_documento)
        WHERE id_usuarios = :id";

    $stmtUsuario = $pdo->prepare($sqlUsuario);
    $stmtUsuario->execute([
        ':nombres' => $input['nombres'] ?? null,
        ':apellidos' => $input['apellidos'] ?? null,
        ':correo' => isset($input['correo']) ? strtolower(trim($input['correo'])) : null,
        ':telefono' => $input['telefono'] ?? null,
        ':tipo_documento' => $input['tipo_documento'] ?? null,
        ':numero_documento' => $input['numero_documento'] ?? null,
        ':id' => $idCliente,
    ]);

    $sqlCliente = "UPDATE tbl_clientes SET
            porcentaje_descuento = COALESCE(:descuento, porcentaje_descuento),
            codigo_membresia = COALESCE(:codigo, codigo_membresia),
            estado_membresia = COALESCE(:estado, estado_membresia),
            fecha_inicio_vip = COALESCE(:fecha_inicio, fecha_inicio_vip),
            fecha_fin_vip = COALESCE(:fecha_fin, fecha_fin_vip),
            notas = COALESCE(:notas, notas)
        WHERE id_cliente = :id";

    $stmtCliente = $pdo->prepare($sqlCliente);
    $stmtCliente->execute([
        ':descuento' => $descuento,
        ':codigo' => $input['codigo_membresia'] ?? null,
        ':estado' => $input['estado_membresia'] ?? null,
        ':fecha_inicio' => $input['fecha_inicio_vip'] ?? null,
        ':fecha_fin' => $input['fecha_fin_vip'] ?? null,
        ':notas' => $input['notas'] ?? null,
        ':id' => $idCliente,
    ]);

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => 'Cliente VIP actualizado correctamente.',
        'cliente' => fetchVipById($pdo, $idCliente),
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'No se pudo actualizar el cliente VIP.',
        'error' => $e->getMessage(),
    ], 500);
}
