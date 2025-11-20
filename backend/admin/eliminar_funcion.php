<?php
require_once __DIR__ . '/../conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Método no permitido';
    exit;
}

$idFuncion = (int)($_POST['id_funcion'] ?? 0);

if ($idFuncion <= 0) {
    echo 'Identificador de función inválido.';
    exit;
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT id_pelicula FROM tbl_funcion WHERE id_funcion = :id_funcion LIMIT 1');
    $stmt->execute([':id_funcion' => $idFuncion]);
    $funcion = $stmt->fetch();

    if (!$funcion) {
        $pdo->rollBack();
        echo 'La función no existe.';
        exit;
    }

    $idPelicula = (int)$funcion['id_pelicula'];

    $stmtDeleteFuncion = $pdo->prepare('DELETE FROM tbl_funcion WHERE id_funcion = :id_funcion');
    $stmtDeleteFuncion->execute([':id_funcion' => $idFuncion]);

    $stmtCheck = $pdo->prepare('SELECT COUNT(*) FROM tbl_funcion WHERE id_pelicula = :id_pelicula');
    $stmtCheck->execute([':id_pelicula' => $idPelicula]);
    $funcionesRestantes = (int)$stmtCheck->fetchColumn();

    if ($funcionesRestantes === 0) {
        $stmtDeleteMovie = $pdo->prepare('DELETE FROM tbl_pelicula WHERE id_pelicula = :id_pelicula');
        $stmtDeleteMovie->execute([':id_pelicula' => $idPelicula]);
    }

    $pdo->commit();

    $posterDir = realpath(__DIR__ . '/../../uploads/posters') ?: __DIR__ . '/../../uploads/posters';
    foreach (glob(rtrim($posterDir, '/\\') . '/pelicula_' . $idPelicula . '.*') ?: [] as $file) {
        @unlink($file);
    }

    header('Location: /Muvwatch/backend/admin/lobby_admin.php?msg=funcion_eliminada');
    exit;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo '<h2>Error al eliminar la función</h2>';
    echo '<p>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
    echo '<p><a href="/Muvwatch/backend/admin/lobby_admin.php">Volver al inicio</a></p>';
}

