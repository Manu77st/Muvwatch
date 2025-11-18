<?php

require_once __DIR__ . '/../conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo 'Método no permitido';
    exit;
}

$errores = [];

$posterFile    = $_FILES['poster'] ?? null;
$posterTmpPath = null;
$posterExt     = null;


// Película
$nombre        = trim($_POST['nombre']        ?? '');
$descripcion   = trim($_POST['descripcion']   ?? '');
$clasificacion = trim($_POST['clasificacion'] ?? '');
$genero        = trim($_POST['genero']        ?? '');
$reparto       = trim($_POST['reparto']       ?? '');
$director      = trim($_POST['director']      ?? '');
$duracion      = (int)($_POST['duracion']     ?? 120);   
$fechaEstreno  = $_POST['fecha_estreno']      ?? null;  

// Función
$precio        = (float)($_POST['precio']        ?? 0);
$descuento     = (float)($_POST['descuento']     ?? 0);
$fechaFuncion  = $_POST['fecha_funcion']         ?? '';

$idSala        = 1;

$trailer       = trim($_POST['trailer'] ?? '');


if ($posterFile && ($posterFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    if ($posterFile['error'] !== UPLOAD_ERR_OK) {
        $errores[] = 'Error al subir la imagen del póster.';
    } else {
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
        $posterExt = strtolower(pathinfo($posterFile['name'], PATHINFO_EXTENSION));

        if (!in_array($posterExt, $allowedExtensions, true)) {
            $errores[] = 'Formato de imagen no permitido. Usa JPG, PNG o WEBP.';
        } elseif ($posterFile['size'] > 5 * 1024 * 1024) {
            $errores[] = 'El póster no debe superar los 5MB.';
        } else {
            $posterTmpPath = $posterFile['tmp_name'];
        }
    }
}


if ($nombre === '')        $errores[] = 'El nombre de la película es obligatorio.';
if ($descripcion === '')   $errores[] = 'La descripción es obligatoria.';
if ($clasificacion === '') $errores[] = 'La clasificación es obligatoria.';
if ($genero === '')        $errores[] = 'El género es obligatorio.';
if ($fechaFuncion === '')  $errores[] = 'La fecha de la función es obligatoria.';
if ($precio <= 0)          $errores[] = 'El precio debe ser mayor que 0.';


if ($fechaFuncion !== '' && strlen($fechaFuncion) > 10 && strpos($fechaFuncion, 'T') !== false) {
    $partes = explode('T', $fechaFuncion);
    $fechaFuncion = $partes[0];
}

if (!empty($errores)) {
    foreach ($errores as $e) {
        echo "<p style='color:red;'>" . htmlspecialchars($e) . "</p>";
    }
    echo "<p><a href='/proyecto/Muvwatch/src/a�adir-funcion.html'>Volver al formulario</a></p>";
    exit;
}



try {
    $pdo->beginTransaction();

    // 5.1 Insertar película
    $sqlPelicula = "
        INSERT INTO tbl_pelicula
            (nombre, sipnosis, clasificacion, genero, reparto, director, duracion, fecha_estreno, activa)
        VALUES
            (:nombre, :sipnosis, :clasificacion, :genero, :reparto, :director, :duracion, :fecha_estreno, 1)
    ";

    $stmtP = $pdo->prepare($sqlPelicula);
    $stmtP->execute([
        ':nombre'        => $nombre,
        ':sipnosis'      => $descripcion,
        ':clasificacion' => $clasificacion,
        ':genero'        => $genero,
        ':reparto'       => $reparto,
        ':director'      => $director,
        ':duracion'      => $duracion,
        ':fecha_estreno' => ($fechaEstreno !== '') ? $fechaEstreno : null,
    ]);

    $idPelicula = (int)$pdo->lastInsertId();

    // 5.2 Insertar función
    $sqlFuncion = "
        INSERT INTO tbl_funcion
            (id_pelicula, id_sala, fecha_funcion, precio, descuento, activa)
        VALUES
            (:id_pelicula, :id_sala, :fecha_funcion, :precio, :descuento, 1)
    ";

    $stmtF = $pdo->prepare($sqlFuncion);
    $stmtF->execute([
        ':id_pelicula'   => $idPelicula,
        ':id_sala'       => $idSala,          // siempre 1
        ':fecha_funcion' => $fechaFuncion,    // YYYY-MM-DD
        ':precio'        => $precio,
        ':descuento'     => $descuento,
    ]);

    if ($posterTmpPath && is_uploaded_file($posterTmpPath)) {
        $posterDir = __DIR__ . '/../../uploads/posters';

        if (!is_dir($posterDir) && !mkdir($posterDir, 0775, true) && !is_dir($posterDir)) {
            throw new RuntimeException('No se pudo crear el directorio para guardar pósters.');
        }

        foreach (glob($posterDir . '/pelicula_' . $idPelicula . '.*') ?: [] as $archivoExistente) {
            @unlink($archivoExistente);
        }

        $posterFilename = 'pelicula_' . $idPelicula . '.' . $posterExt;
        $posterDestino  = $posterDir . '/' . $posterFilename;

        if (!move_uploaded_file($posterTmpPath, $posterDestino)) {
            throw new RuntimeException('No se pudo guardar la imagen del póster.');
        }
    }

    $pdo->commit();

    header('Location: /proyecto/Muvwatch/backend/admin/lobby_admin.php?msg=funcion_creada');
    exit;

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    echo '<h2>Error al guardar en la base de datos</h2>';
    echo '<p>' . htmlspecialchars($e->getMessage()) . '</p>';
    echo '<p><a href="/proyecto/Muvwatch/src/a�adir-funcion.html">Volver al formulario</a></p>';
}
?>

