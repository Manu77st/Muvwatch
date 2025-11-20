<?php
require_once __DIR__ . '/../conexion.php';
require_once __DIR__ . '/../admin/vip/schema.php';

ensureVipSchema($pdo);

function h($value)
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

$errores = [];
$passwordGenerada = null;
$mensajeExito = '';

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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($datos as $campo => $valor) {
        $datos[$campo] = trim($_POST[$campo] ?? '');
    }

    if ($datos['nombre'] === '') {
        $errores[] = 'El nombre es obligatorio.';
    }

    if ($datos['apellido'] === '') {
        $errores[] = 'El apellido es obligatorio.';
    }

    if ($datos['tipo_documento'] === '') {
        $errores[] = 'El tipo de documento es obligatorio.';
    }

    if ($datos['numero_documento'] === '') {
        $errores[] = 'El número de documento es obligatorio.';
    }

    if ($datos['correo'] === '' || !filter_var($datos['correo'], FILTER_VALIDATE_EMAIL)) {
        $errores[] = 'El correo electrónico es obligatorio y debe ser válido.';
    }

    if ($datos['telefono'] === '') {
        $errores[] = 'El teléfono es obligatorio.';
    }

    if ($datos['membresia'] === '') {
        $errores[] = 'El código de membresía es obligatorio.';
    }

    if ($datos['estado'] === '') {
        $datos['estado'] = 'activo';
    }

    if (empty($errores)) {
        try {
            $pdo->beginTransaction();

            $sqlDuplicado = "SELECT COUNT(*) FROM tbl_usuarios WHERE correo = :correo OR numero_documento = :documento";
            $stmtDup = $pdo->prepare($sqlDuplicado);
            $stmtDup->execute([
                ':correo' => strtolower($datos['correo']),
                ':documento' => $datos['numero_documento'],
            ]);

            if ((int)$stmtDup->fetchColumn() > 0) {
                $pdo->rollBack();
                $errores[] = 'Ya existe un cliente con el mismo correo o documento.';
            } else {
                $passwordGenerada = substr(bin2hex(random_bytes(4)), 0, 8);

                $sqlUsuario = "INSERT INTO tbl_usuarios
                    (nombres, apellidos, correo, `contraseña`, telefono, tipo_documento, numero_documento, fecha_nacimiento, tipo_usuario, activo)
                    VALUES
                    (:nombres, :apellidos, :correo, :contrasena, :telefono, :tipo_documento, :numero_documento, :fecha_nacimiento, 'cliente', 1)";

                $stmtUsuario = $pdo->prepare($sqlUsuario);
                $stmtUsuario->execute([
                    ':nombres' => $datos['nombre'],
                    ':apellidos' => $datos['apellido'],
                    ':correo' => strtolower($datos['correo']),
                    ':contrasena' => $passwordGenerada,
                    ':telefono' => $datos['telefono'],
                    ':tipo_documento' => $datos['tipo_documento'],
                    ':numero_documento' => $datos['numero_documento'],
                    ':fecha_nacimiento' => $_POST['fecha_nacimiento'] ?? '2000-01-01',
                ]);

                $idUsuario = (int)$pdo->lastInsertId();

                $sqlCliente = "INSERT INTO tbl_clientes
                    (id_cliente, cliente_vip, porcentaje_descuento, codigo_membresia, estado_membresia, fecha_inicio_vip, fecha_fin_vip, notas)
                    VALUES
                    (:id_cliente, 1, :descuento, :codigo, :estado, :fecha_inicio, :fecha_fin, :notas)";

                $stmtCliente = $pdo->prepare($sqlCliente);
                $stmtCliente->execute([
                    ':id_cliente' => $idUsuario,
                    ':descuento' => 0,
                    ':codigo' => $datos['membresia'],
                    ':estado' => $datos['estado'],
                    ':fecha_inicio' => $_POST['fecha_inicio'] ?? date('Y-m-d'),
                    ':fecha_fin' => $_POST['fecha_fin'] ?? null,
                    ':notas' => $_POST['notas'] ?? null,
                ]);

                $pdo->commit();

                $mensajeExito = 'Cliente VIP registrado correctamente. Contraseña temporal: ' . $passwordGenerada;
                foreach ($datos as $campo => $valor) {
                    $datos[$campo] = ($campo === 'estado') ? 'activo' : '';
                }
            }
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            $errores[] = 'Ocurrió un error al guardar el cliente VIP. ' . $e->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Añadir Cliente VIP</title>
  <link rel="stylesheet" href="../../styles/styles-cliente.css">
  <link rel="stylesheet" href="../../styles/style-admin.css">
  <link rel="stylesheet" href="../../styles/styles.css">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined">
  <style>
    .alert {
      margin: 1rem auto;
      max-width: 900px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
    }

    .alert.success {
      background-color: #e6f4ff;
      border: 1px solid #2b6cb0;
      color: #1c3d5a;
    }

    .alert.error {
      background-color: #fde8e8;
      border: 1px solid #dc2626;
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

  <?php if ($mensajeExito !== ''): ?>
    <div class="alert success"><?= h($mensajeExito); ?></div>
  <?php endif; ?>

  <?php if (!empty($errores)): ?>
    <div class="alert error">
      <?php foreach ($errores as $error): ?>
        <p><?= h($error); ?></p>
      <?php endforeach; ?>
    </div>
  <?php endif; ?>

  <main class="container-vip">
    <h2 class="titulo-vip">AÑADIR CLIENTE VIP</h2>

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
        <input type="text" name="membresia" placeholder="Membresía" value="<?= h($datos['membresia']); ?>" required>
        <input type="text" name="estado" placeholder="Estado" value="<?= h($datos['estado']); ?>" required>
      </div>

      <div class="botones">
        <button type="button" class="btn-cancelar" onclick="window.location.href='Consultar-clientes-VIP.php'">Cancelar</button>
        <button type="submit" class="btn-guardar">Guardar</button>
      </div>
    </form>
  </main>
</body>
<script src="/proyecto/Muvwatch/scripts/menu-cliente.js"></script>
<script src="/proyecto/Muvwatch/scripts/admin-search.js"></script>
</html>

