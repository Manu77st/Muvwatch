<?php
require_once __DIR__ . '/../conexion.php';
require_once __DIR__ . '/../admin/vip/schema.php';

ensureVipSchema($pdo);

function h($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function vipFetch(PDO $pdo, int $id): ?array
{
    $sql = "SELECT 
                u.id_usuarios AS id_usuario,
                u.nombres,
                u.apellidos,
                u.correo,
                u.telefono,
                u.tipo_documento,
                u.numero_documento,
                c.codigo_membresia,
                c.estado_membresia
            FROM tbl_clientes c
            INNER JOIN tbl_usuarios u ON u.id_usuarios = c.id_cliente
            WHERE c.id_cliente = :id AND c.cliente_vip = 1";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $row = $stmt->fetch();

    return $row ?: null;
}

$idCliente = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$errores = [];
$mensaje = '';
$cliente = null;

if ($idCliente) {
    $cliente = vipFetch($pdo, $idCliente);
    if (!$cliente) {
        $errores[] = 'Cliente VIP no encontrado.';
    }
} else {
    $errores[] = 'Identificador de cliente no válido.';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && empty($errores)) {
    $nombre = trim($_POST['nombre'] ?? '');
    $apellido = trim($_POST['apellido'] ?? '');
    $correo = trim($_POST['correo'] ?? '');
    $telefono = trim($_POST['telefono'] ?? '');
    $tipoDocumento = trim($_POST['tipo_documento'] ?? '');
    $numeroDocumento = trim($_POST['numero_documento'] ?? '');
    $membresia = trim($_POST['membresia'] ?? '');
    $estado = trim($_POST['estado'] ?? 'activo');

    if ($nombre === '' || $apellido === '') {
        $errores[] = 'Nombre y apellido son obligatorios.';
    }

    if ($correo === '' || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'Correo inválido.';
    }

    if ($tipoDocumento === '' || $numeroDocumento === '') {
        $errores[] = 'Documento inválido.';
    }

    if (empty($errores)) {
        try {
            $pdo->beginTransaction();

            $sqlUsuario = "UPDATE tbl_usuarios SET
                nombres = :nombres,
                apellidos = :apellidos,
                correo = :correo,
                telefono = :telefono,
                tipo_documento = :tipo_documento,
                numero_documento = :numero_documento
            WHERE id_usuarios = :id";

            $stmtUsuario = $pdo->prepare($sqlUsuario);
            $stmtUsuario->execute([
                ':nombres' => $nombre,
                ':apellidos' => $apellido,
                ':correo' => strtolower($correo),
                ':telefono' => $telefono,
                ':tipo_documento' => $tipoDocumento,
                ':numero_documento' => $numeroDocumento,
                ':id' => $idCliente,
            ]);

            $sqlCliente = "UPDATE tbl_clientes SET
                codigo_membresia = :codigo,
                estado_membresia = :estado
            WHERE id_cliente = :id";

            $stmtCliente = $pdo->prepare($sqlCliente);
            $stmtCliente->execute([
                ':codigo' => $membresia !== '' ? $membresia : null,
                ':estado' => $estado,
                ':id' => $idCliente,
            ]);

            $pdo->commit();

            header('Location: Consultar-clientes-VIP.php?msg=vip_actualizado');
            exit;
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $errores[] = 'No se pudo actualizar el cliente VIP: ' . $e->getMessage();
        }
    }
}

if ($cliente) {
    $datos = [
        'nombre' => $_POST['nombre'] ?? $cliente['nombres'],
        'apellido' => $_POST['apellido'] ?? $cliente['apellidos'],
        'tipo_documento' => $_POST['tipo_documento'] ?? $cliente['tipo_documento'],
        'numero_documento' => $_POST['numero_documento'] ?? $cliente['numero_documento'],
        'correo' => $_POST['correo'] ?? $cliente['correo'],
        'telefono' => $_POST['telefono'] ?? $cliente['telefono'],
        'membresia' => $_POST['membresia'] ?? ($cliente['codigo_membresia'] ?? ''),
        'estado' => $_POST['estado'] ?? ($cliente['estado_membresia'] ?? 'activo'),
    ];
} else {
    $datos = [
        'nombre' => '',
        'apellido' => '',
        'tipo_documento' => '',
        'numero_documento' => '',
        'correo' => '',
        'telefono' => '',
        'membresia' => '',
        'estado' => 'activo',
    ];
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Cliente VIP</title>
    <link rel="stylesheet" href="../../styles/styles-cliente.css">
    <link rel="stylesheet" href="../../styles/style-admin.css">
    <link rel="stylesheet" href="../../styles/styles.css">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
    <style>
        .alert {
            margin: 1rem auto;
            max-width: 900px;
            padding: 1rem 1.25rem;
            border-radius: 10px;
            background: #fdecec;
            border: 1px solid #f87171;
            color: #7f1d1d;
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

    <?php if (!empty($errores)): ?>
        <div class="alert">
            <?php foreach ($errores as $err): ?>
                <p><?= h($err); ?></p>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <main class="container-vip">
        <h2 class="titulo-vip">EDITAR CLIENTE VIP</h2>

        <?php if ($cliente): ?>
            <form class="form-vip" method="POST">
                <div class="campo">
                    <input type="text" name="nombre" placeholder="Nombre" value="<?= h($datos['nombre']); ?>" required>
                    <input type="text" name="apellido" placeholder="Apellido" value="<?= h($datos['apellido']); ?>" required>
                </div>

                <div class="campo">
                    <input type="text" name="tipo_documento" placeholder="Tipo de documento" value="<?= h($datos['tipo_documento']); ?>" required>
                    <input type="text" name="numero_documento" placeholder="N. de documento" value="<?= h($datos['numero_documento']); ?>" required>
                </div>

                <div class="campo">
                    <input type="email" name="correo" placeholder="Correo electrónico" value="<?= h($datos['correo']); ?>" required>
                    <input type="tel" name="telefono" placeholder="Teléfono" value="<?= h($datos['telefono']); ?>" required>
                </div>

                <div class="campo">
                    <input type="text" name="membresia" placeholder="Membresía" value="<?= h($datos['membresia']); ?>">
                    <input type="text" name="estado" placeholder="Estado" value="<?= h($datos['estado']); ?>">
                </div>

                <div class="botones">
                    <button type="button" class="btn-cancelar" onclick="window.location.href='Consultar-clientes-VIP.php'">Cancelar</button>
                    <button type="submit" class="btn-guardar">Actualizar</button>
                </div>
            </form>
        <?php endif; ?>
    </main>
</body>
<script src="/proyecto/Muvwatch/scripts/menu-cliente.js"></script>
<script src="/proyecto/Muvwatch/scripts/admin-search.js"></script>
</html>

