<?php
require_once __DIR__ . '/../conexion.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$idPelicula = isset($input['id_pelicula']) ? (int)$input['id_pelicula'] : 0;

if ($idPelicula <= 0) {
    echo json_encode(['success' => false, 'message' => 'Identificador de película inválido.']);
    exit;
}

try {
    $stmt = $pdo->prepare('SELECT activa FROM tbl_pelicula WHERE id_pelicula = :id');
    $stmt->execute([':id' => $idPelicula]);
    $pelicula = $stmt->fetchColumn();

    if ($pelicula === false) {
        echo json_encode(['success' => false, 'message' => 'Película no encontrada.']);
        exit;
    }

    if ((int)$pelicula === 0) {
        echo json_encode(['success' => true, 'message' => 'La película ya estaba deshabilitada.']);
        exit;
    }

    $pdo->beginTransaction();

    $stmtDisableMovie = $pdo->prepare('UPDATE tbl_pelicula SET activa = 0 WHERE id_pelicula = :id');
    $stmtDisableMovie->execute([':id' => $idPelicula]);

    $stmtDisableFunctions = $pdo->prepare('UPDATE tbl_funcion SET activa = 0 WHERE id_pelicula = :id');
    $stmtDisableFunctions->execute([':id' => $idPelicula]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Película deshabilitada correctamente.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo deshabilitar la película.',
        'error' => $e->getMessage(),
    ]);
}
