<?php
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

$input = getJsonInput();

$required = ['nombres', 'apellidos', 'correo', 'tipo_documento', 'numero_documento', 'fecha_nacimiento'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        jsonResponse(['success' => false, 'message' => "El campo {$field} es obligatorio."], 422);
    }
}

$correo = strtolower(trim($input['correo']));
$tipoDocumento = strtolower(trim($input['tipo_documento']));
$numeroDocumento = trim($input['numero_documento']);
$descuento = normalizeDiscount($input['porcentaje_descuento'] ?? 0);
$password = $input['contrasena'] ?? bin2hex(random_bytes(4));

try {
    $pdo->beginTransaction();

    $sqlCheck = "SELECT COUNT(*) FROM tbl_usuarios WHERE correo = :correo OR numero_documento = :numero";
    $stmtCheck = $pdo->prepare($sqlCheck);
    $stmtCheck->execute([
        ':correo' => $correo,
        ':numero' => $numeroDocumento,
    ]);

    if ((int)$stmtCheck->fetchColumn() > 0) {
        $pdo->rollBack();
        jsonResponse(['success' => false, 'message' => 'Ya existe un usuario con ese correo o documento.'], 409);
    }

    $sqlUsuario = "INSERT INTO tbl_usuarios 
        (nombres, apellidos, correo, contrase�a, telefono, tipo_documento, numero_documento, fecha_nacimiento, tipo_usuario, activo) 
        VALUES 
        (:nombres, :apellidos, :correo, :contrasena, :telefono, :tipo_documento, :numero_documento, :fecha_nacimiento, 'cliente', 1)";

    $stmtUsuario = $pdo->prepare($sqlUsuario);
    $stmtUsuario->execute([
        ':nombres' => trim($input['nombres']),
        ':apellidos' => trim($input['apellidos']),
        ':correo' => $correo,
        ':contrasena' => $password,
        ':telefono' => $input['telefono'] ?? null,
        ':tipo_documento' => $tipoDocumento,
        ':numero_documento' => $numeroDocumento,
        ':fecha_nacimiento' => $input['fecha_nacimiento'],
    ]);

    $idUsuario = (int)$pdo->lastInsertId();

    $sqlCliente = "INSERT INTO tbl_clientes 
        (id_cliente, cliente_vip, porcentaje_descuento, codigo_membresia, estado_membresia, fecha_inicio_vip, fecha_fin_vip, notas)
        VALUES
        (:id_cliente, 1, :descuento, :codigo, :estado, :fecha_inicio, :fecha_fin, :notas)";

    $stmtCliente = $pdo->prepare($sqlCliente);
    $stmtCliente->execute([
        ':id_cliente' => $idUsuario,
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
        'message' => 'Cliente VIP creado correctamente.',
        'cliente' => fetchVipById($pdo, $idUsuario),
        'password_generada' => $password,
    ], 201);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    jsonResponse([
        'success' => false,
        'message' => 'No se pudo crear el cliente VIP.',
        'error' => $e->getMessage(),
    ], 500);
}
