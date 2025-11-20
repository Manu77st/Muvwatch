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
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT activa FROM tbl_pelicula WHERE id_pelicula = :id FOR UPDATE');
    $stmt->execute([':id' => $idPelicula]);
    $estado = $stmt->fetchColumn();

    if ($estado === false) {
        $pdo->rollBack();
        echo json_encode(['success' => false, 'message' => 'Película no encontrada.']);
        exit;
    }

    if ((int)$estado === 1) {
        $pdo->rollBack();
        echo json_encode(['success' => true, 'message' => 'La película ya estaba habilitada.']);
        exit;
    }

    $updateMovie = $pdo->prepare('UPDATE tbl_pelicula SET activa = 1 WHERE id_pelicula = :id');
    $updateMovie->execute([':id' => $idPelicula]);

    $updateFunctions = $pdo->prepare('UPDATE tbl_funcion SET activa = 1 WHERE id_pelicula = :id');
    $updateFunctions->execute([':id' => $idPelicula]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Película habilitada correctamente.']);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo habilitar la película.',
        'error' => $e->getMessage(),
    ]);
}
