<?php
require_once __DIR__ . '/conexion.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_GET['id_funcion']) || !is_numeric($_GET['id_funcion'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'id_funcion inválido']);
    exit;
}

$idFuncion = (int) $_GET['id_funcion'];

try {
    $sql = "SELECT s.id_silla, s.fila, s.numero, s.tipo_silla, s.disponible
            FROM tbl_sillas s
            INNER JOIN tbl_bloquesillas b ON s.id_bloque = b.id_bloque
            INNER JOIN tbl_salas sa ON b.id_sala = sa.id_sala
            INNER JOIN tbl_funcion f ON f.id_sala = sa.id_sala
            WHERE f.id_funcion = :id_funcion AND s.disponible = 0";

    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id_funcion' => $idFuncion]);
    $sillas = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $sillas]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al obtener sillas reservadas']);
}
