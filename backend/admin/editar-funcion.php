<?php
require_once __DIR__ . '/../conexion.php';

function h($value)
{
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES, 'UTF-8');
}

$posterSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e3eef5"/><rect x="40" y="40" width="320" height="420" rx="24" fill="#3b7ba6"/><text x="50%" y="50%" font-size="48" fill="#ffffff" font-family="Arial, sans-serif" text-anchor="middle">Muvwatch</text></svg>';
$posterPlaceholder = 'data:image/svg+xml;charset=UTF-8,' . rawurlencode($posterSvg);
$posterUploadsDir = realpath(__DIR__ . '/../uploads/posters') ?: __DIR__ . '/../uploads/posters';
$posterUploadsUrl = '/proyecto/Muvwatch/uploads/posters/';

$idFuncion = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$funcion = null;
$errorCarga = '';

if ($idFuncion) {
    try {
        $sql = "SELECT f.id_funcion, f.id_pelicula, f.id_sala, f.fecha_funcion, f.precio, f.descuento,
                       p.nombre, p.sipnosis, p.clasificacion, p.genero, p.reparto, p.director,
                       p.duracion, p.fecha_estreno
                FROM tbl_funcion f
                INNER JOIN tbl_pelicula p ON p.id_pelicula = f.id_pelicula
                WHERE f.id_funcion = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $idFuncion]);
        $funcion = $stmt->fetch();
        if (!$funcion) {
            $errorCarga = 'No se encontró la función solicitada.';
        }
    } catch (PDOException $e) {
        $errorCarga = 'No se pudo cargar la función: ' . $e->getMessage();
    }
} else {
    $errorCarga = 'Identificador de función no válido.';
}

$posterActual = $posterPlaceholder;
$fechaFuncionValue = '';
$fechaEstrenoValue = '';

if ($funcion) {
    $idPelicula = (int)$funcion['id_pelicula'];
    if ($idPelicula > 0) {
        $pattern = rtrim($posterUploadsDir, '/\\') . '/pelicula_' . $idPelicula . '.*';
        $posterFiles = glob($pattern);
        if (!empty($posterFiles)) {
            $posterActual = $posterUploadsUrl . basename($posterFiles[0]);
        }
    }

    if (!empty($funcion['fecha_funcion'])) {
        try {
            $fechaFuncionValue = (new DateTime($funcion['fecha_funcion']))->format('Y-m-d');
        } catch (Exception $e) {
            $fechaFuncionValue = $funcion['fecha_funcion'];
        }
    }

    if (!empty($funcion['fecha_estreno'])) {
        try {
            $fechaEstrenoValue = (new DateTime($funcion['fecha_estreno']))->format('Y-m-d');
        } catch (Exception $e) {
            $fechaEstrenoValue = $funcion['fecha_estreno'];
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar función</title>
    <link rel="stylesheet" href="../../styles/styles-cliente.css">
    <link rel="stylesheet" href="../../styles/style-admin.css">
    <link rel="stylesheet" href="../../styles/styles.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
    <style>
        .image-upload img {
            width: 100%;
            border-radius: 12px;
            object-fit: cover;
        }

        .image-upload small {
            display: block;
            margin-top: 0.5rem;
            color: #555;
        }

        .alert {
            margin: 1rem auto;
            max-width: 900px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid transparent;
            font-weight: 600;
        }

        .alert.error {
            background: #fde8e8;
            border-color: #dc2626;
            color: #7f1d1d;
        }

        .form-funcion--edit {
            align-items: flex-start;
            gap: 40px;
        }

        .form-funcion--edit .form-izquierda {
            flex: 0 0 340px;
        }

        .image-upload--preview {
            flex-direction: column;
            align-items: stretch;
            height: auto;
            padding: 0;
            overflow: hidden;
            border-width: 1px;
        }

        .image-upload--preview img {
            width: 100%;
            max-height: 360px;
            border-radius: 10px 10px 0 0;
            object-fit: cover;
            display: block;
        }

        .image-upload--preview small {
            width: 100%;
            margin: 0;
            padding: 0.75rem 1rem;
            text-align: center;
            background: #f2f8ff;
            border-top: 1px solid #d6e6f5;
        }
    </style>
</head>

<body>
    <nav class="navbar">
        <div class="container-navbar">
            <div class="navbar-left">
                <a href="/proyecto/Muvwatch/backend/admin/lobby_admin.php" class="logo-link">
                    <img id="logo-nav" src="/proyecto/Muvwatch/images/Logo.svg" alt="Logo_muvwatch">
                </a>
            </div>
            <div class="navbar-center">
                <div class="container-search">
                    <div class="filtros">
                        <span class="material-symbols-outlined icon-inline" aria-hidden="true" onclick="filtro()">filter_alt</span>
                    </div>
                    <div class="caja-busqueda">
                        <input id="search-input" type="text" placeholder="Buscar función...">
                        <span class="material-symbols-outlined" onclick="busquedas()">search</span>
                    </div>
                </div>
            </div>
            <div class="navbar-right">
                <div class="cliente-box" id="clienteBox">
                    <span class="material-symbols-outlined icon-inline profile-icon" aria-hidden="true">account_circle</span>
                    Cliente A
                    <div class="menu-cliente" id="menuCliente">
                        <a href="#">Perfil</a>
                        <a href="/proyecto/Muvwatch/backend/logout.php">Cerrar sesión</a>
                    </div>
                </div>
            </div>
        </div>
    </nav>
    <div class="menu-secundario">
        <nav>
            <a href="/proyecto/Muvwatch/backend/admin/lobby_admin.php" class="enlace-a" style="border-bottom-color: #3b7ba6; background: #f5f5f5">Inicio</a>
            <a href="/proyecto/Muvwatch/src/Reportes-ventas.html">Reportes</a>
            <a href="/proyecto/Muvwatch/backend/admin/Consultar-clientes-VIP.php">Clientes VIP</a>
        </nav>
    </div>

    <?php if ($errorCarga !== ''): ?>
        <div class="alert error"><?= h($errorCarga); ?></div>
    <?php endif; ?>

    <?php if ($funcion): ?>
        <main class="contenedor-funcion">
            <h2 class="titulo-funcion">Editar función</h2>

            <form class="form-funcion form-funcion--edit" action="actualizar_funcion.php" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="id_funcion" value="<?= (int)$funcion['id_funcion']; ?>">
                <input type="hidden" name="id_pelicula" value="<?= (int)$funcion['id_pelicula']; ?>">

                <div class="form-izquierda">
                    <label class="image-upload image-upload--preview">
                        <img src="<?= h($posterActual); ?>" alt="Póster actual de <?= h($funcion['nombre']); ?>">
                        <input type="file" name="poster" accept="image/*">
                        <small>Selecciona una imagen para reemplazar el póster actual (JPG, PNG o WEBP, máx. 5MB).</small>
                    </label>

                    <input type="text" name="nombre" placeholder="Nombre de la película" value="<?= h($funcion['nombre']); ?>" required>
                    <textarea name="descripcion" placeholder="Descripción" required><?= h($funcion['sipnosis']); ?></textarea>
                </div>

                    <div class="form-derecha">
                        <div class="grupo">
                            <input type="text" name="clasificacion" placeholder="Clasificación" value="<?= h($funcion['clasificacion']); ?>" required>
                            <input type="text" name="genero" placeholder="Géneros" value="<?= h($funcion['genero']); ?>" required>
                        </div>

                        <div class="grupo">
                            <input type="text" name="reparto" placeholder="Reparto" value="<?= h($funcion['reparto']); ?>" required>
                            <input type="text" name="director" placeholder="Director" value="<?= h($funcion['director']); ?>" required>
                        </div>

                        <div class="grupo">
                            <input type="number" name="duracion" placeholder="Duración (minutos)" value="<?= (int)$funcion['duracion']; ?>" min="1">
                            <input type="date" name="fecha_estreno" placeholder="Publicación" value="<?= h($fechaEstrenoValue); ?>">
                        </div>

                        <div class="grupo">
                            <input type="number" name="precio" placeholder="Precio" step="0.01" min="0" value="<?= h($funcion['precio']); ?>" required>
                            <input type="number" name="descuento" placeholder="Descuento" step="0.01" min="0" value="<?= h($funcion['descuento']); ?>">
                        </div>

                        <div class="grupo">
                            <input type="date" name="fecha_funcion" placeholder="Horario" value="<?= h($fechaFuncionValue); ?>" required>
                            <input type="number" name="id_sala" placeholder="Sala" min="1" value="<?= h($funcion['id_sala']); ?>" required>
                        </div>
                    </div>

                <div class="botones-funcion">
                    <button type="button" class="btn-cancelar" onclick="window.location.href='/proyecto/Muvwatch/backend/admin/lobby_admin.php'">
                        Cancelar
                    </button>
                    <button type="submit" class="btn-agregar">
                        Actualizar
                    </button>
                </div>
            </form>
        </main>
    <?php endif; ?>
</body>
<script src="/proyecto/Muvwatch/scripts/menu-cliente.js"></script>
<script src="/proyecto/Muvwatch/scripts/admin-search.js"></script>
</html>
