<?php
/**
 * API: Reportes de ventas de boletería (pantalla del administrador)
 *
 * Este endpoint se consume desde la vista "REPORTES DE VENTAS DE BOLETERIA",
 * la cual tiene los filtros Buscar + Fecha inicial + Fecha final + Película
 * y la tabla con columnas Película, Fecha Inicial, Fecha Final, Vendidos, Ingresos.
 *
 * Su objetivo es consolidar y resumir las ventas por película dentro de un rango
 * de fechas, de modo que el administrador pueda ver el total de boletas vendidas
 * e ingresos generados por cada película.
 */

header('Content-Type: application/json');

require_once __DIR__ . '/conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

if (!in_array($method, ['GET', 'POST'])) {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido.',
    ]);
    exit;
}

$params = $method === 'GET' ? $_GET : $_POST;

$buscar = trim($params['buscar'] ?? '');
$fechaInicial = $params['fecha_inicial'] ?? '';
$fechaFinal = $params['fecha_final'] ?? '';
$idPelicula = isset($params['id_pelicula']) && $params['id_pelicula'] !== ''
    ? (int)$params['id_pelicula']
    : null;

if ($fechaInicial === '' || $fechaFinal === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Los filtros fecha_inicial y fecha_final son obligatorios.',
    ]);
    exit;
}

try {
    $sql = "
        SELECT
            p.nombre AS pelicula,
            :fecha_inicial AS fecha_inicial,
            :fecha_final AS fecha_final,
            SUM(dv.cantidad) AS vendidos,
            SUM(dv.total_linea) AS ingresos
        FROM tbl_ventas v
        INNER JOIN tbl_funcion f ON f.id_funcion = v.id_funcion
        INNER JOIN tbl_pelicula p ON p.id_pelicula = f.id_pelicula
        INNER JOIN detalles_venta dv ON dv.id_venta = v.id_venta
        WHERE
            v.estado = 'confirmada'
            AND DATE(v.fecha_venta) BETWEEN :fecha_inicial AND :fecha_final
    ";

    $paramsSql = [
        ':fecha_inicial' => $fechaInicial,
        ':fecha_final' => $fechaFinal,
    ];

    if ($idPelicula !== null) {
        $sql .= " AND p.id_pelicula = :id_pelicula";
        $paramsSql[':id_pelicula'] = $idPelicula;
    }

    if ($buscar !== '') {
        $sql .= " AND p.nombre LIKE :buscar";
        $paramsSql[':buscar'] = '%' . $buscar . '%';
    }

    $sql .= "
        GROUP BY p.id_pelicula, p.nombre
        ORDER BY p.nombre ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($paramsSql);
    $resultados = $stmt->fetchAll() ?: [];

    echo json_encode([
        'success' => true,
        'data' => array_map(static function ($row) {
            return [
                'pelicula' => $row['pelicula'],
                'fecha_inicial' => $row['fecha_inicial'],
                'fecha_final' => $row['fecha_final'],
                'vendidos' => (int)($row['vendidos'] ?? 0),
                'ingresos' => (float)($row['ingresos'] ?? 0),
            ];
        }, $resultados),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al generar el reporte.',
    ]);
}
