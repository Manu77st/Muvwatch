<?php
require_once __DIR__ . '/../conexion.php';
require_once __DIR__ . '/../admin/vip/schema.php';

ensureVipSchema($pdo);

function h($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

$mensaje = '';
$mensajesDisponibles = [
    'vip_creado' => 'Cliente VIP registrado correctamente.',
    'vip_actualizado' => 'Cliente VIP actualizado correctamente.',
    'vip_eliminado' => 'Cliente VIP eliminado.',
];

if (isset($_GET['msg'], $mensajesDisponibles[$_GET['msg']])) {
    $mensaje = $mensajesDisponibles[$_GET['msg']];
}

$busqueda = trim($_GET['buscar'] ?? '');
$membresia = trim($_GET['membresia'] ?? '');
$estado = trim($_GET['estado'] ?? '');

$clientes = [];
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'eliminar') {
    $idEliminar = (int)($_POST['id_cliente'] ?? 0);
    if ($idEliminar <= 0) {
        $error = 'Cliente inválido para eliminar.';
    } else {
        try {
            $pdo->beginTransaction();

            $stmtExiste = $pdo->prepare('SELECT cliente_vip FROM tbl_clientes WHERE id_cliente = :id');
            $stmtExiste->execute([':id' => $idEliminar]);
            if (!$stmtExiste->fetchColumn()) {
                $pdo->rollBack();
                $error = 'El cliente no existe o ya fue eliminado.';
            } else {
                $stmtDeleteCliente = $pdo->prepare('DELETE FROM tbl_clientes WHERE id_cliente = :id');
                $stmtDeleteCliente->execute([':id' => $idEliminar]);

                $stmtDeleteUsuario = $pdo->prepare('DELETE FROM tbl_usuarios WHERE id_usuarios = :id');
                $stmtDeleteUsuario->execute([':id' => $idEliminar]);

                $pdo->commit();
                header('Location: Consultar-clientes-VIP.php?msg=vip_eliminado');
                exit;
            }
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $error = 'No se pudo eliminar el cliente VIP: ' . $e->getMessage();
        }
    }
}

$condiciones = ['c.cliente_vip = 1'];
$params = [];

if ($busqueda !== '') {
    $condiciones[] = '(u.nombres LIKE :term OR u.apellidos LIKE :term OR u.numero_documento LIKE :term OR u.correo LIKE :term)';
    $params[':term'] = '%' . $busqueda . '%';
}

if ($membresia !== '') {
    $condiciones[] = 'c.codigo_membresia LIKE :membresia';
    $params[':membresia'] = '%' . $membresia . '%';
}

if ($estado !== '') {
    $condiciones[] = 'c.estado_membresia = :estado';
    $params[':estado'] = $estado;
}

$where = implode(' AND ', $condiciones);

$sql = "SELECT 
            u.id_usuarios AS id_usuario,
            u.nombres,
            u.apellidos,
            u.correo,
            u.numero_documento,
            u.telefono,
            c.codigo_membresia,
            c.estado_membresia,
            c.porcentaje_descuento,
            c.fecha_inicio_vip,
            c.fecha_fin_vip
        FROM tbl_clientes c
        INNER JOIN tbl_usuarios u ON u.id_usuarios = c.id_cliente
        WHERE {$where}
        ORDER BY u.nombres ASC";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $clientes = $stmt->fetchAll() ?: [];
} catch (PDOException $e) {
    $error = 'No se pudieron cargar los clientes VIP: ' . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consultar Clientes VIP</title>
    <link rel="stylesheet" href="../../styles/styles-cliente.css">
    <link rel="stylesheet" href="../../styles/style-admin.css">
    <link rel="stylesheet" href="../../styles/styles.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
    <style>
        .alert {
            margin: 1rem auto;
            max-width: 1100px;
            padding: 1rem 1.25rem;
            border-radius: 10px;
            border: 1px solid transparent;
            font-weight: 600;
        }

        .alert.success {
            background: #e6f4ff;
            border-color: #2b6cb0;
            color: #1c3d5a;
        }

        .alert.error {
            background: #fdecea;
            border-color: #f44336;
            color: #a5271a;
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

    <?php if ($mensaje !== ''): ?>
        <div class="alert success"><?= h($mensaje); ?></div>
    <?php endif; ?>

    <?php if ($error !== ''): ?>
        <div class="alert error"><?= h($error); ?></div>
    <?php endif; ?>

    <main class="main-container">
        <h2>Consultar clientes VIP</h2>

        <form class="filtros" method="GET">
            <div class="campo-buscar">
                <input type="text" name="buscar" placeholder="Buscar por nombre, correo o documento" value="<?= h($busqueda); ?>">
                <span class="material-symbols-outlined">search</span>
            </div>

            <input type="text" name="membresia" placeholder="Código de membresía" value="<?= h($membresia); ?>">

            <select name="estado">
                <option value="">Estado</option>
                <option value="activo" <?= $estado === 'activo' ? 'selected' : ''; ?>>Activo</option>
                <option value="inactivo" <?= $estado === 'inactivo' ? 'selected' : ''; ?>>Inactivo</option>
                <option value="suspendido" <?= $estado === 'suspendido' ? 'selected' : ''; ?>>Suspendido</option>
            </select>

            <button type="submit" class="btn-guardar" style="margin-left: auto;">Filtrar</button>
        </form>

        <table class="tabla-clientes">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Correo</th>
                    <th>Membresía</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($clientes)): ?>
                    <tr>
                        <td colspan="6" style="text-align:center;">No hay clientes VIP registrados.</td>
                    </tr>
                <?php else: ?>
                    <?php foreach ($clientes as $cliente): ?>
                        <tr>
                            <td><?= h($cliente['nombres'] . ' ' . $cliente['apellidos']); ?></td>
                            <td><?= h($cliente['numero_documento']); ?></td>
                            <td><?= h($cliente['correo']); ?></td>
                            <td><?= h($cliente['codigo_membresia'] ?? '—'); ?></td>
                            <td><?= h(ucfirst($cliente['estado_membresia'] ?? '')); ?></td>
                            <td>
                                <div style="display:flex; gap:0.5rem; justify-content:center;">
                                    <button class="btn-editar" type="button" onclick="window.location.href='editar-cliente-vip.php?id=<?= (int)$cliente['id_usuario']; ?>'">✏️</button>
                                    <form method="POST" onsubmit="return confirm('¿Eliminar a <?= h($cliente['nombres']); ?>?');">
                                        <input type="hidden" name="accion" value="eliminar">
                                        <input type="hidden" name="id_cliente" value="<?= (int)$cliente['id_usuario']; ?>">
                                        <button class="btn-eliminar" type="submit">🗑️</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                <?php endif; ?>
            </tbody>
        </table>
    </main>
</body>
<script src="/proyecto/Muvwatch/scripts/menu-cliente.js"></script>
<script src="/proyecto/Muvwatch/scripts/admin-search.js"></script>
</html>

