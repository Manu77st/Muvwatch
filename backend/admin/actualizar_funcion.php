<?php
require_once __DIR__ . '/../conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Método no permitido';
    exit;
}

$idFuncion  = (int)($_POST['id_funcion'] ?? 0);
$idPelicula = (int)($_POST['id_pelicula'] ?? 0);

if ($idFuncion <= 0 || $idPelicula <= 0) {
    echo 'Identificadores inválidos.';
    exit;
}

$nombre        = trim($_POST['nombre']        ?? '');
$descripcion   = trim($_POST['descripcion']   ?? '');
$clasificacion = trim($_POST['clasificacion'] ?? '');
$genero        = trim($_POST['genero']        ?? '');
$reparto       = trim($_POST['reparto']       ?? '');
$director      = trim($_POST['director']      ?? '');
$duracion      = (int)($_POST['duracion']     ?? 120);
$fechaEstreno  = $_POST['fecha_estreno']      ?? null;
$precio        = (float)($_POST['precio']     ?? 0);
$descuento     = (float)($_POST['descuento']  ?? 0);
$fechaFuncion  = $_POST['fecha_funcion']      ?? '';
$idSala        = (int)($_POST['id_sala']      ?? 1);

$errores = [];

if ($nombre === '')        $errores[] = 'El nombre de la película es obligatorio.';
if ($descripcion === '')   $errores[] = 'La descripción es obligatoria.';
if ($clasificacion === '') $errores[] = 'La clasificación es obligatoria.';
if ($genero === '')        $errores[] = 'El género es obligatorio.';
if ($fechaFuncion === '')  $errores[] = 'La fecha de la función es obligatoria.';
if ($precio <= 0)          $errores[] = 'El precio debe ser mayor que 0.';

if ($fechaFuncion !== '' && strlen($fechaFuncion) > 10 && strpos($fechaFuncion, 'T') !== false) {
    $fechaFuncion = explode('T', $fechaFuncion)[0];
}

$posterFile = $_FILES['poster'] ?? null;
$posterTmp  = null;
$posterExt  = null;

if ($posterFile && ($posterFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if ($posterFile['error'] !== UPLOAD_ERR_OK) {
        $errores[] = 'Error al subir la imagen.';
    } else {
        $posterExt = strtolower(pathinfo($posterFile['name'], PATHINFO_EXTENSION));
        $permitidos = ['jpg', 'jpeg', 'png', 'webp'];

        if (!in_array($posterExt, $permitidos, true)) {
            $errores[] = 'El póster debe ser JPG, PNG o WEBP.';
        } elseif ($posterFile['size'] > 5 * 1024 * 1024) {
            $errores[] = 'El póster no debe superar los 5MB.';
        } else {
            $posterTmp = $posterFile['tmp_name'];
        }
    }
}

if (!empty($errores)) {
    foreach ($errores as $error) {
        echo '<p style="color:red;">' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</p>';
    }
    echo '<p><a href="/Muvwatch/backend/admin/editar-funcion.php?id=' . $idFuncion . '">Volver al formulario</a></p>';
    exit;
}

try {
    $pdo->beginTransaction();

    $sqlPelicula = "
        UPDATE tbl_pelicula
        SET nombre = :nombre,
            sipnosis = :descripcion,
            clasificacion = :clasificacion,
            genero = :genero,
            reparto = :reparto,
            director = :director,
            duracion = :duracion,
            fecha_estreno = :fecha_estreno
        WHERE id_pelicula = :id_pelicula
    ";

    $stmtP = $pdo->prepare($sqlPelicula);
    $stmtP->execute([
        ':nombre'       => $nombre,
        ':descripcion'  => $descripcion,
        ':clasificacion'=> $clasificacion,
        ':genero'       => $genero,
        ':reparto'      => $reparto,
        ':director'     => $director,
        ':duracion'     => $duracion,
        ':fecha_estreno'=> ($fechaEstreno !== '') ? $fechaEstreno : null,
        ':id_pelicula'  => $idPelicula,
    ]);

    $sqlFuncion = "
        UPDATE tbl_funcion
        SET id_sala = :id_sala,
            fecha_funcion = :fecha_funcion,
            precio = :precio,
            descuento = :descuento
        WHERE id_funcion = :id_funcion
    ";

    $stmtF = $pdo->prepare($sqlFuncion);
    $stmtF->execute([
        ':id_sala'       => $idSala,
        ':fecha_funcion' => $fechaFuncion,
        ':precio'        => $precio,
        ':descuento'     => $descuento,
        ':id_funcion'    => $idFuncion,
    ]);

    if ($posterTmp && is_uploaded_file($posterTmp)) {
        $posterDir = __DIR__ . '/../../uploads/posters';

        if (!is_dir($posterDir) && !mkdir($posterDir, 0775, true) && !is_dir($posterDir)) {
            throw new RuntimeException('No se pudo preparar la carpeta de pósters.');
        }

        foreach (glob($posterDir . '/pelicula_' . $idPelicula . '.*') ?: [] as $archivo) {
            @unlink($archivo);
        }

        $posterDestino = $posterDir . '/pelicula_' . $idPelicula . '.' . $posterExt;
        if (!move_uploaded_file($posterTmp, $posterDestino)) {
            throw new RuntimeException('No se pudo guardar la nueva imagen.');
        }
    }

    $pdo->commit();

    header('Location: /proyecto/Muvwatch/backend/admin/lobby_admin.php?msg=funcion_actualizada');
    exit;
} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo '<h2>Error al actualizar la función</h2>';
    echo '<p>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
    echo '<p><a href="/proyecto/Muvwatch/backend/admin/editar-funcion.php?id=' . $idFuncion . '">Volver al formulario</a></p>';
}

