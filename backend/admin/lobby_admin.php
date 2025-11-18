<?php
require_once __DIR__ . '/../conexion.php';

function h($value)
{
    return htmlspecialchars((string)($value ?? ''), ENT_QUOTES, 'UTF-8');
}

function formatDateEs(?string $value): string
{
    if (!$value) {
        return '';
    }

    try {
        $dt = new DateTime($value);
        return $dt->format('d/m/Y');
    } catch (Exception $e) {
        return $value;
    }
}

function formatMoney($value): string
{
    return number_format((float)$value, 2, '.', ',');
}

function resumenTexto(?string $texto, int $limit = 140): string
{
    $texto = trim(strip_tags((string)$texto));

    if ($texto === '') {
        return 'Sin sinopsis.';
    }

    if (function_exists('mb_strlen')) {
        if (mb_strlen($texto) <= $limit) {
            return $texto;
        }
        return mb_substr($texto, 0, $limit) . '...';
    }

    if (strlen($texto) <= $limit) {
        return $texto;
    }
    return substr($texto, 0, $limit) . '...';
}

$posterSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#e3eef5"/><rect x="40" y="40" width="320" height="420" rx="24" fill="#3b7ba6"/><text x="50%" y="50%" font-size="48" fill="#ffffff" font-family="Arial, sans-serif" text-anchor="middle">Muvwatch</text></svg>';
$posterPlaceholder = 'data:image/svg+xml;charset=UTF-8,' . rawurlencode($posterSvg);
$posterUploadsDir = realpath(__DIR__ . '/../uploads/posters') ?: __DIR__ . '/../uploads/posters';
$posterUploadsUrl = '/proyecto/Muvwatch/uploads/posters/';

$mensaje = '';
$mensajesDisponibles = [
    'funcion_creada'      => 'La función se registró correctamente.',
    'funcion_actualizada' => 'La función se actualizó correctamente.',
    'funcion_eliminada'   => 'La función se eliminó correctamente.',
    'pelicula_habilitada' => 'La película se habilitó correctamente.',
];
if (isset($_GET['msg'], $mensajesDisponibles[$_GET['msg']])) {
    $mensaje = $mensajesDisponibles[$_GET['msg']];
}

$funciones = [];
$peliculasDeshabilitadas = [];
$errorCarga = '';

try {
$sql = "SELECT f.id_funcion, f.id_sala, f.fecha_funcion, f.precio, f.descuento,
                   p.id_pelicula, p.nombre, p.sipnosis, p.genero, p.reparto, p.director, p.clasificacion
            FROM tbl_funcion f
            INNER JOIN tbl_pelicula p ON p.id_pelicula = f.id_pelicula
            WHERE f.activa = 1 AND p.activa = 1
            ORDER BY f.fecha_funcion ASC, f.id_funcion DESC";

    $stmt = $pdo->query($sql);
    $funciones = $stmt->fetchAll();

    $sqlPeliculasDeshabilitadas = "SELECT id_pelicula, nombre, sipnosis FROM tbl_pelicula WHERE activa = 0 ORDER BY nombre ASC";
    $stmtDeshabilitadas = $pdo->query($sqlPeliculasDeshabilitadas);
    $peliculasDeshabilitadas = $stmtDeshabilitadas->fetchAll();
} catch (PDOException $e) {
    $errorCarga = 'No se pudieron cargar las funciones: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lobby Admin</title>
    <link rel="stylesheet" href="../../styles/styles-cliente.css">
    <link rel="stylesheet" href="../../styles/style-admin.css">
    <link rel="stylesheet" href="../../styles/styles.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
    <style>
        .alert {
            margin: 1rem auto;
            max-width: 1100px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 1px solid transparent;
            font-weight: 600;
        }

        .alert.success {
            background: #e7f6ed;
            border-color: #42b883;
            color: #25603f;
        }

        .alert.error {
            background: #fde8e8;
            border-color: #dc2626;
            color: #7f1d1d;
        }

        .movie-card__meta {
            font-size: 0.9rem;
            color: #5f5f5f;
            margin: 0.25rem 0 0.5rem 0;
        }

        .empty-state {
            text-align: center;
            padding: 2rem;
            border: 2px dashed #d0d7de;
            border-radius: 12px;
            background: #f9fbfd;
            color: #555;
            margin-top: 1rem;
        }
        .disabled-section {
            margin-top: 2rem;
            background: #fff;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        .disabled-section h2 {
            margin-bottom: 1rem;
            color: #1b629e;
        }

        .disabled-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 1rem;
        }

        .disabled-card {
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 1rem;
            background: #fdf0ed;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .disabled-card h3 {
            margin: 0;
            font-size: 1.1rem;
        }

        .disabled-card p {
            font-size: 0.9rem;
            color: #555;
            flex-grow: 1;
        }

        .btn-enable {
            padding: 10px;
            border: none;
            border-radius: 6px;
            background: #2f855a;
            color: #fff;
            font-weight: bold;
            cursor: pointer;
        }

        .btn-enable:hover {
            background: #276749;
        }

        .movie-actions {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            gap: 0.4rem;
        }

        .movie-actions > * {
            width: 100%;
        }

        .movie-actions button {
            width: 100%;
            flex: none;
        }

        .movie-actions form {
            width: 100%;
            margin: 0;
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

    <div id="resultados"></div>

    <?php if ($mensaje !== ''): ?>
        <div class="alert success"><?= h($mensaje); ?></div>
    <?php endif; ?>

    <?php if ($errorCarga !== ''): ?>
        <div class="alert error"><?= h($errorCarga); ?></div>
    <?php endif; ?>

    <main class="main-content">
        <div class="movies-grid">
            <div class="movie-card add-card" onclick="window.location.href='/proyecto/Muvwatch/src/añadir-funcion.html'">
                <h3>Añadir función</h3>
            </div>

            <div class="movie-card add-card" onclick="window.location.href='añadir-cliente-vip.php'">
                <h3>Añadir cliente VIP</h3>
            </div>

            <?php if (count($funciones) === 0): ?>
                <div class="empty-state">
                    No hay funciones activas almacenadas. Registra una nueva para verla aquí.
                </div>
            <?php else: ?>
                <?php foreach ($funciones as $funcion): ?>
                    <?php
                    $idPelicula = (int)($funcion['id_pelicula'] ?? 0);
                    $titulo = h($funcion['nombre']);
                    $sinopsis = h($funcion['sipnosis'] ?: 'Sin sinopsis disponible.');
                    $clasificacion = h($funcion['clasificacion']);
                    $reparto = h($funcion['reparto']);
                    $director = h($funcion['director']);
                    $genero = h($funcion['genero']);
                    $fechaFormateada = formatDateEs($funcion['fecha_funcion']);
                    $precioFormatted = formatMoney($funcion['precio']);
                    $descuentoFormatted = formatMoney($funcion['descuento']);
                    $originalName = $titulo;
                    $poster = $posterPlaceholder;

                    if ($idPelicula > 0) {
                        $pattern = rtrim($posterUploadsDir, '/\\') . '/pelicula_' . $idPelicula . '.*';
                        $posterCandidates = glob($pattern);

                        if (!empty($posterCandidates)) {
                            $poster = $posterUploadsUrl . basename($posterCandidates[0]);
                        }
                    }
                    ?>
                    <div class="movie-card"
                        data-title="<?= $titulo; ?>"
                        data-original="<?= $originalName; ?>"
                        data-synopsis="<?= $sinopsis; ?>"
                        data-classification="<?= $clasificacion; ?>"
                        data-cast="<?= $reparto; ?>"
                        data-director="<?= $director; ?>"
                        data-poster="<?= h($poster); ?>"
                        data-date="<?= h($fechaFormateada); ?>"
                        data-room="<?= h($funcion['id_sala']); ?>"
                        data-price="<?= h($precioFormatted); ?>"
                        data-discount="<?= h($descuentoFormatted); ?>"
                        data-pelicula-id="<?= (int)$idPelicula; ?>"
                        data-edit-url="editar-funcion.php?id=<?= (int)$funcion['id_funcion']; ?>">
                        <img src="<?= h($poster); ?>" alt="Poster de <?= $titulo; ?>">
                        <h3><?= $titulo; ?></h3>
                        <p class="movie-card__meta"><?= $genero; ?> | Sala <?= h($funcion['id_sala']); ?></p>
                        <p class="movie-card__meta">Fecha: <?= h($fechaFormateada); ?></p>
                        <p class="movie-card__meta">Precio: $<?= $precioFormatted; ?><?= ($funcion['descuento'] > 0) ? ' · Descuento: $' . $descuentoFormatted : ''; ?></p>
                        <div class="movie-actions">
                            <button class="btn-view" type="button" data-action="view-movie">
                                <span class="material-symbols-outlined">visibility</span>
                                Ver detalles
                            </button>

                            <button class="btn-edit" type="button" onclick="window.location.href='editar-funcion.php?id=<?= (int)$funcion['id_funcion']; ?>'">
                                <span class="material-symbols-outlined">edit</span>
                                Editar
                            </button>

                            <form class="delete-form" action="../backend/admin/eliminar_funcion.php" method="POST" onsubmit="return confirm('¿Estás seguro de eliminar la función <?= $titulo; ?>?');">
                                <input type="hidden" name="id_funcion" value="<?= (int)$funcion['id_funcion']; ?>">
                                <button class="btn-delete" type="submit">
                                    <span class="material-symbols-outlined">delete</span>
                                    Eliminar
                                </button>
                            </form>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>

        <?php if (!empty($peliculasDeshabilitadas)): ?>
            <section class="disabled-section">
                <h2>Películas deshabilitadas</h2>
                <div class="disabled-grid">
                    <?php foreach ($peliculasDeshabilitadas as $pelicula): ?>
                        <div class="disabled-card" data-pelicula-id="<?= (int)$pelicula['id_pelicula']; ?>">
                            <h3><?= h($pelicula['nombre']); ?></h3>
                            <p><?= h(resumenTexto($pelicula['sipnosis'] ?? '')); ?></p>
                            <button class="btn-enable" type="button" data-enable="<?= (int)$pelicula['id_pelicula']; ?>">
                                Volver a habilitar
                            </button>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>
    </main>

    <div id="movieModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeMovieModal()">&times;</span>
            <div class="modal-body">
                <div class="modal-left">
                    <img id="modalMovieImage" src="" alt="Movie Poster">
                    <h2 id="modalMovieTitle"></h2>
                    <div class="modal-actions">
                        <button class="btn-edit-modal" id="modalEditButton" type="button">
                            Editar
                        </button>
                        <button class="btn-disable-modal" id="modalDisableButton" type="button">
                            Deshabilitar
                        </button>
                    </div>
                </div>
                <div class="modal-right">
                    <div class="synopsis-section">
                        <h3>Sinopsis</h3>
                        <p id="modalSynopsis"></p>
                    </div>
                    <div class="movie-details">
                        <p><strong>Nombre original:</strong> <span id="modalOriginalName"></span></p>
                        <p><strong>Clasificación:</strong> <span id="modalClassification"></span></p>
                        <p><strong>Reparto:</strong> <span id="modalCast"></span></p>
                        <p><strong>Director:</strong> <span id="modalDirector"></span></p>
                        <p><strong>Fecha:</strong> <span id="modalDate"></span></p>
                        <p><strong>Sala:</strong> <span id="modalRoom"></span></p>
                        <p><strong>Precio:</strong> $<span id="modalPrice"></span></p>
                        <p><strong>Descuento:</strong> $<span id="modalDiscount"></span></p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        const modal = document.getElementById('movieModal');
        const modalEditButton = document.getElementById('modalEditButton');
        const modalDisableButton = document.getElementById('modalDisableButton');
        let currentMovieCard = null;

        function openMovieModal(card) {
            currentMovieCard = card;
            document.getElementById('modalMovieImage').src = card.dataset.poster || '';
            document.getElementById('modalMovieTitle').textContent = card.dataset.title || 'Sin título';
            document.getElementById('modalOriginalName').textContent = card.dataset.original || card.dataset.title || 'N/D';
            document.getElementById('modalClassification').textContent = card.dataset.classification || 'N/D';
            document.getElementById('modalCast').textContent = card.dataset.cast || 'N/D';
            document.getElementById('modalDirector').textContent = card.dataset.director || 'N/D';
            document.getElementById('modalSynopsis').textContent = card.dataset.synopsis || 'Sin sinopsis disponible.';
            document.getElementById('modalDate').textContent = card.dataset.date || 'Sin fecha';
            document.getElementById('modalRoom').textContent = card.dataset.room || '1';
            document.getElementById('modalPrice').textContent = card.dataset.price || '0.00';
            document.getElementById('modalDiscount').textContent = card.dataset.discount || '0.00';

            if (modalEditButton) {
                const editUrl = card.dataset.editUrl || 'editar-funcion.php';
                modalEditButton.onclick = () => {
                    window.location.href = editUrl;
                };
            }

            if (modalDisableButton) {
                const peliculaId = card.dataset.peliculaId || '';
                modalDisableButton.dataset.peliculaId = peliculaId;
                modalDisableButton.disabled = peliculaId === '';
            }

            modal.style.display = 'block';
        }

        function closeMovieModal() {
            modal.style.display = 'none';
        }

        document.querySelectorAll('[data-action="view-movie"]').forEach((button) => {
            button.addEventListener('click', (event) => {
                const card = event.currentTarget.closest('.movie-card');
                if (card) {
                    openMovieModal(card);
                }
            });
        });

        window.onclick = function(event) {
            if (event.target === modal) {
                closeMovieModal();
            }
        };

        if (modalDisableButton) {
            modalDisableButton.addEventListener('click', async () => {
                const peliculaId = modalDisableButton.dataset.peliculaId;
                if (!peliculaId) {
                    return;
                }

                if (!confirm('¿Deseas deshabilitar esta película?')) {
                    return;
                }

                try {
                    const response = await fetch('/proyecto/Muvwatch/backend/admin/deshabilitar_pelicula.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id_pelicula: parseInt(peliculaId, 10) }),
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        alert(data.message || 'No se pudo deshabilitar la película.');
                        return;
                    }

                    alert('Película deshabilitada correctamente.');
                    if (currentMovieCard) {
                        currentMovieCard.remove();
                    }
                    closeMovieModal();
                } catch (error) {
                    alert('Error de conexión al deshabilitar la película.');
                }
            });
        }

        document.querySelectorAll('.btn-enable').forEach((button) => {
            button.addEventListener('click', async () => {
                const peliculaId = button.dataset.enable;
                if (!peliculaId) {
                    return;
                }

                if (!confirm('¿Quieres volver a habilitar esta película?')) {
                    return;
                }

                try {
                    const response = await fetch('/proyecto/Muvwatch/backend/admin/habilitar_pelicula.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ id_pelicula: parseInt(peliculaId, 10) }),
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        alert(data.message || 'No se pudo habilitar la película.');
                        return;
                    }

                    alert('Película habilitada. Se recargará el listado.');
                    window.location.href = '/proyecto/Muvwatch/backend/admin/lobby_admin.php?msg=pelicula_habilitada';
                } catch (error) {
                    alert('Error al habilitar la película.');
                }
            });
        });
    </script>

    <script src="/proyecto/Muvwatch/scripts/menu-cliente.js"></script>
<script src="/proyecto/Muvwatch/scripts/admin-search.js"></script>
</body>

</html>


