<?php
require_once __DIR__ . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['id_funcion']) || !is_numeric($_GET['id_funcion'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'id_funcion inválido',
    ]);
    exit;
}

$idFuncion = (int) $_GET['id_funcion'];

try {
    $sql = "SELECT f.id_funcion,
                   p.id_pelicula,
                   p.nombre,
                   p.sipnosis,
                   p.clasificacion,
                   p.genero,
                   p.reparto,
                   p.director,
                   f.fecha_funcion,
                   f.precio,
                   f.descuento
            FROM tbl_funcion f
            INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
            WHERE f.id_funcion = :id_funcion AND f.activa = 1 AND p.activa = 1
            LIMIT 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id_funcion' => $idFuncion]);
    $funcion = $stmt->fetch();

    if (!$funcion) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error' => 'Función no encontrada',
        ]);
        exit;
    }

    echo json_encode([
        'success' => true,
        'data' => $funcion,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener la función',
    ]);
}
