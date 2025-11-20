<?php
require_once __DIR__ . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

try {
    // Solo funciones activas y películas activas, ordenadas por fecha más cercana
    $sql = "SELECT f.id_funcion,
                   p.id_pelicula,
                   p.nombre,
                   p.sipnosis,
                   p.clasificacion,
                   p.reparto,
                   p.director,
                   f.fecha_funcion,
                   f.precio,
                   f.descuento
            FROM tbl_funcion f
            INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
            WHERE f.activa = 1 AND p.activa = 1
            ORDER BY f.fecha_funcion ASC, p.nombre ASC";

    $stmt = $pdo->query($sql);
    $funciones = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data' => $funciones,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener las funciones',
    ]);
}
