<?php
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($method, ['DELETE', 'POST'], true)) {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$input = getJsonInput();
$idCliente = isset($input['id_cliente']) ? (int)$input['id_cliente'] : 0;
$eliminarDefinitivo = filter_var($input['eliminar_definitivo'] ?? false, FILTER_VALIDATE_BOOLEAN);

if ($idCliente <= 0) {
    jsonResponse(['success' => false, 'message' => 'Id de cliente inválido.'], 422);
}

try {
    $pdo->beginTransaction();

    if (!fetchVipById($pdo, $idCliente)) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Cliente VIP no encontrado.'], 404);
    }

    if ($eliminarDefinitivo) {
        $stmtDeleteCliente = $pdo->prepare('DELETE FROM tbl_clientes WHERE id_cliente = :id');
        $stmtDeleteCliente->execute([':id' => $idCliente]);

        $stmtDeleteUsuario = $pdo->prepare('DELETE FROM tbl_usuarios WHERE id_usuarios = :id');
        $stmtDeleteUsuario->execute([':id' => $idCliente]);
    } else {
        $stmt = $pdo->prepare("UPDATE tbl_clientes
            SET cliente_vip = 0,
                porcentaje_descuento = 0,
                codigo_membresia = NULL,
                estado_membresia = 'inactivo',
                fecha_fin_vip = :fecha_fin
            WHERE id_cliente = :id");
        $stmt->execute([
            ':fecha_fin' => date('Y-m-d'),
            ':id' => $idCliente,
        ]);
    }

    $pdo->commit();

    jsonResponse([
        'success' => true,
        'message' => $eliminarDefinitivo
            ? 'Cliente eliminado correctamente.'
            : 'El cliente ya no es VIP.',
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'No se pudo completar la eliminación.',
        'error' => $e->getMessage(),
    ], 500);
}
