<?php
/**
 * Controlador de Cliente (Películas, Reservas, Perfil)
 */

require_once __DIR__ . '/../configuracion/base_datos.php';
require_once __DIR__ . '/../modelos/UsuarioModelos.php';
require_once __DIR__ . '/../modelos/CineModelos.php';
require_once __DIR__ . '/../utilidades/Utilidades.php';

class ClienteControlador {
    private $conexion;

    public function __construct() {
        $bd = new BaseDatos();
        $this->conexion = $bd->obtenerConexion();
    }

    // ===== PELÍCULAS =====
    
    public function obtenerCartelera() {
        $pelicula = new Pelicula($this->conexion);
        $stmt = $pelicula->obtenerCartelera();

        $peliculas = [];
        while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $id_pelicula = $fila['id_pelicula'];
            
            if(!isset($peliculas[$id_pelicula])) {
                $peliculas[$id_pelicula] = [
                    'id_pelicula' => $fila['id_pelicula'],
                    'nombre' => $fila['nombre'],
                    'sipnosis' => $fila['sipnosis'],
                    'clasificacion' => $fila['clasificacion'],
                    'genero' => $fila['genero'],
                    'reparto' => $fila['reparto'],
                    'director' => $fila['director'],
                    'duracion' => $fila['duracion'],
                    'fecha_estreno' => $fila['fecha_estreno'],
                    'funciones' => []
                ];
            }

            $peliculas[$id_pelicula]['funciones'][] = [
                'id_funcion' => $fila['id_funcion'],
                'fecha_funcion' => $fila['fecha_funcion'],
                'precio' => $fila['precio'],
                'descuento' => $fila['descuento'],
                'precio_final' => $fila['precio'] - $fila['descuento'],
                'id_sala' => $fila['id_sala'],
                'sala' => $fila['sala'],
                'capacidad' => $fila['capacidad']
            ];
        }

        return [
            'exito' => true,
            'datos' => array_values($peliculas)
        ];
    }

    public function obtenerPelicula($id_pelicula) {
        if(empty($id_pelicula)) {
            return ['exito' => false, 'mensaje' => 'ID de película requerido'];
        }

        $pelicula = new Pelicula($this->conexion);
        $pelicula->id_pelicula = $id_pelicula;
        
        $datosPelicula = $pelicula->obtenerPorId();

        if($datosPelicula) {
            // Obtener funciones de la película
            $funcion = new Funcion($this->conexion);
            $funcion->id_pelicula = $id_pelicula;
            $stmt = $funcion->obtenerPorPelicula();

            $funciones = [];
            while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $funciones[] = [
                    'id_funcion' => $fila['id_funcion'],
                    'fecha_funcion' => $fila['fecha_funcion'],
                    'precio' => $fila['precio'],
                    'descuento' => $fila['descuento'],
                    'precio_final' => $fila['precio'] - $fila['descuento'],
                    'id_sala' => $fila['id_sala'],
                    'sala' => $fila['sala'],
                    'capacidad' => $fila['capacidad']
                ];
            }

            $datosPelicula['funciones'] = $funciones;

            return ['exito' => true, 'datos' => $datosPelicula];
        }

        return ['exito' => false, 'mensaje' => 'Película no encontrada'];
    }

    public function buscarPeliculas($termino) {
        if(empty($termino)) {
            return $this->obtenerCartelera();
        }

        $pelicula = new Pelicula($this->conexion);
        $stmt = $pelicula->buscar($termino);

        $peliculas = [];
        while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $peliculas[] = $fila;
        }

        return ['exito' => true, 'datos' => $peliculas];
    }

    public function obtenerPromociones() {
        $pelicula = new Pelicula($this->conexion);
        $stmt = $pelicula->obtenerPromociones();

        $promociones = [];
        while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $id_pelicula = $fila['id_pelicula'];
            
            if(!isset($promociones[$id_pelicula])) {
                $promociones[$id_pelicula] = [
                    'id_pelicula' => $fila['id_pelicula'],
                    'nombre' => $fila['nombre'],
                    'sipnosis' => $fila['sipnosis'],
                    'clasificacion' => $fila['clasificacion'],
                    'genero' => $fila['genero'],
                    'reparto' => $fila['reparto'],
                    'director' => $fila['director'],
                    'duracion' => $fila['duracion'],
                    'fecha_estreno' => $fila['fecha_estreno'],
                    'funciones' => []
                ];
            }

            $promociones[$id_pelicula]['funciones'][] = [
                'id_funcion' => $fila['id_funcion'],
                'fecha_funcion' => $fila['fecha_funcion'],
                'precio' => $fila['precio'],
                'descuento' => $fila['descuento'],
                'precio_final' => $fila['precio'] - $fila['descuento'],
                'porcentaje_descuento' => $fila['porcentaje_descuento'],
                'id_sala' => $fila['id_sala'],
                'sala' => $fila['sala']
            ];
        }

        return ['exito' => true, 'datos' => array_values($promociones)];
    }

    // ===== FUNCIONES Y ASIENTOS =====

    public function obtenerFuncion($id_funcion) {
        if(empty($id_funcion)) {
            return ['exito' => false, 'mensaje' => 'ID de función requerido'];
        }

        $funcion = new Funcion($this->conexion);
        $funcion->id_funcion = $id_funcion;
        
        $datosFuncion = $funcion->obtenerPorId();

        if($datosFuncion) {
            return ['exito' => true, 'datos' => $datosFuncion];
        }

        return ['exito' => false, 'mensaje' => 'Función no encontrada'];
    }

    public function obtenerAsientosDisponibles($id_funcion) {
        if(empty($id_funcion)) {
            return ['exito' => false, 'mensaje' => 'ID de función requerido'];
        }

        $funcion = new Funcion($this->conexion);
        $funcion->id_funcion = $id_funcion;
        
        // Verificar que la función existe
        $datosFuncion = $funcion->obtenerPorId();
        if(!$datosFuncion) {
            return ['exito' => false, 'mensaje' => 'Función no encontrada'];
        }

        // Obtener asientos
        $stmt = $funcion->obtenerAsientosDisponibles();
        
        $asientos = [];
        while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $asientos[] = [
                'id_silla' => $fila['id_silla'],
                'fila' => $fila['fila'],
                'columna' => $fila['columna'],
                'tipo' => $fila['tipo'],
                'disponible' => $fila['disponible'] == 1,
                'activa' => $fila['activa'] == 1
            ];
        }

        return [
            'exito' => true,
            'datos' => [
                'funcion' => $datosFuncion,
                'asientos' => $asientos
            ]
        ];
    }

    public function calcularTotal($id_funcion, $cantidad_asientos) {
        if(empty($id_funcion) || empty($cantidad_asientos)) {
            return ['exito' => false, 'mensaje' => 'Datos incompletos'];
        }

        $funcion = new Funcion($this->conexion);
        $funcion->id_funcion = $id_funcion;
        
        $datosFuncion = $funcion->obtenerPorId();

        if(!$datosFuncion) {
            return ['exito' => false, 'mensaje' => 'Función no encontrada'];
        }

        $funcion->precio = $datosFuncion['precio'];
        $funcion->descuento = $datosFuncion['descuento'];

        // Obtener descuento VIP del usuario
        $usuario = Sesion::obtenerDatosUsuario();
        $porcentaje_vip = $usuario ? $usuario['descuento'] : 0;

        $total = $funcion->calcularTotal($cantidad_asientos, $porcentaje_vip);

        return ['exito' => true, 'datos' => $total];
    }

    // ===== RESERVAS =====

    public function crearReserva($datos) {
    // Verificar sesión
    $id_cliente = Sesion::verificarCliente();

    // Validar datos
    if (empty($datos['id_funcion']) || empty($datos['asientos']) || !is_array($datos['asientos'])) {
        return ['exito' => false, 'mensaje' => 'Datos de reserva incompletos'];
    }

    $reserva = new Reserva($this->conexion);
    $reserva->id_cliente = $id_cliente;
    $reserva->id_funcion = $datos['id_funcion'];

    $resultado = $reserva->crear($datos['asientos']);

    if ($resultado['exito']) {
        return [
            'exito' => true,
            'mensaje' => 'Reserva creada exitosamente',
            'datos' => [
                'id_reserva' => $resultado['id_reserva'],
                'fecha_expiracion' => $resultado['fecha_expiracion']
            ]
        ];
    }

    return $resultado;
}


    public function obtenerMisReservas() {
        // Verificar sesión
        $id_cliente = Sesion::verificarCliente();

        $cliente = new Cliente($this->conexion);
        $cliente->id_cliente = $id_cliente;

        // Obtener todas las reservas del usuario (incluye reservas creadas manualmente
        // o con referencias faltantes en tablas relacionadas)
        $stmt = $cliente->obtenerReservasPorUsuario();
        
        $reservas = [];
        while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $precio = isset($fila['precio']) ? floatval($fila['precio']) : 0;
            $cantidad = isset($fila['cantidad_asientos']) ? intval($fila['cantidad_asientos']) : 0;

            $reservas[] = [
                'id_reserva' => $fila['id_reserva'],
                'fecha_reserva' => $fila['fecha_reserva'],
                'hora' => $fila['hora'],
                'fecha_expiracion' => $fila['fecha_expiracion'],
                'estado' => $fila['estado'],
                'pelicula' => $fila['pelicula'],
                'clasificacion' => $fila['clasificacion'],
                'duracion' => $fila['duracion'],
                'genero' => $fila['genero'],
                'sala' => $fila['sala'],
                'fecha_funcion' => $fila['fecha_funcion'],
                'precio' => $precio,
                'asientos' => $fila['asientos'],
                'cantidad_asientos' => $cantidad,
                'total' => $precio * $cantidad
            ];
        }

        return ['exito' => true, 'datos' => $reservas];
    }

    public function cancelarReserva($id_reserva) {
        // Verificar sesión
        $id_cliente = Sesion::verificarCliente();

        if(empty($id_reserva)) {
            return ['exito' => false, 'mensaje' => 'ID de reserva requerido'];
        }

        $reserva = new Reserva($this->conexion);
        $reserva->id_reserva = $id_reserva;
        $reserva->id_cliente = $id_cliente;

        if($reserva->cancelar()) {
            return ['exito' => true, 'mensaje' => 'Reserva cancelada exitosamente'];
        }

        return [
            'exito' => false, 
            'mensaje' => 'No se pudo cancelar la reserva. Verifique que sea su reserva y esté activa'
        ];
    }

    public function obtenerDetalleReserva($id_reserva) {
        // Verificar sesión
        $id_cliente = Sesion::verificarCliente();

        if(empty($id_reserva)) {
            return ['exito' => false, 'mensaje' => 'ID de reserva requerido'];
        }

        $reserva = new Reserva($this->conexion);
        $reserva->id_reserva = $id_reserva;

        $detalles = $reserva->obtenerPorId();

        if($detalles && $detalles['id_cliente'] == $id_cliente) {
            return ['exito' => true, 'datos' => $detalles];
        }

        return ['exito' => false, 'mensaje' => 'Reserva no encontrada'];
    }

    // ===== PERFIL =====

    public function obtenerPerfil() {
        // Verificar sesión
        $id_cliente = Sesion::verificarCliente();

        $cliente = new Cliente($this->conexion);
        $cliente->id_cliente = $id_cliente;
        
        $perfil = $cliente->obtenerPorId();

        if($perfil) {
            return ['exito' => true, 'datos' => $perfil];
        }

        return ['exito' => false, 'mensaje' => 'Perfil no encontrado'];
    }

    public function actualizarPerfil($datos) {
        // Verificar sesión
        $id_cliente = Sesion::verificarCliente();

        // Validar datos
        $validacion = Validador::camposRequeridos($datos, ['nombres', 'apellidos', 'telefono']);
        if(!$validacion['valido']) {
            return ['exito' => false, 'mensaje' => $validacion['mensaje']];
        }

        $usuario = new Usuario($this->conexion);
        $usuario->id_usuarios = $id_cliente;
        $usuario->nombres = $datos['nombres'];
        $usuario->apellidos = $datos['apellidos'];
        $usuario->telefono = $datos['telefono'];

        if($usuario->actualizar()) {
            // Actualizar sesión
            $datosUsuario = Sesion::obtenerDatosUsuario();
            Sesion::establecerDatos([
                'id' => $id_cliente,
                'tipo' => 'cliente',
                'nombres' => $datos['nombres'],
                'apellidos' => $datos['apellidos']
            ], $datosUsuario['vip'], $datosUsuario['descuento']);

            return ['exito' => true, 'mensaje' => 'Perfil actualizado correctamente'];
        }

        return ['exito' => false, 'mensaje' => 'Error al actualizar el perfil'];
    }

    public function obtenerHistorialCompras() {
        // Verificar sesión
        $id_cliente = Sesion::verificarCliente();

        $cliente = new Cliente($this->conexion);
        $cliente->id_cliente = $id_cliente;

        $stmt = $cliente->obtenerHistorialCompras();
        
        $compras = [];
        while($fila = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $compras[] = $fila;
        }

        return ['exito' => true, 'datos' => $compras];
    }

    // ===== PROCESAR PAGO / VENTA =====
    public function procesarPago($datos) {
        // Verificar sesión (debe ser un cliente)
        $id_cliente = Sesion::verificarCliente();

        // Validar datos
        if (empty($datos['id_funcion']) || empty($datos['asientos_seleccionados']) || !is_array($datos['asientos_seleccionados'])) {
            return ['exito' => false, 'mensaje' => 'Datos de pago incompletos'];
        }

        $id_funcion = $datos['id_funcion'];
        $asientos = $datos['asientos_seleccionados'];
        $metodo_pago = $datos['metodo_pago'] ?? 'tarjeta';

        $this->conexion->beginTransaction();
        try {
            // Validar disponibilidad de asientos
            $funcion = new Funcion($this->conexion);
            $funcion->id_funcion = $id_funcion;

            foreach ($asientos as $a) {
                $id_silla = $a['id_silla'] ?? null;
                if (!$id_silla) throw new Exception('Asiento inválido');
                if (!$funcion->asientoDisponible($id_silla)) {
                    throw new Exception('El asiento ' . $id_silla . ' no está disponible');
                }
            }

            // Calcular subtotal
            $subtotal = 0.0;
            foreach ($asientos as $a) {
                $precio = isset($a['precio']) ? floatval($a['precio']) : 0.0;
                $subtotal += $precio;
            }

            // Aplicar descuento VIP si corresponde
            $usuario = Sesion::obtenerDatosUsuario();
            $porcentaje_vip = $usuario['descuento'] ?? 0;
            $descuento_vip = round($subtotal * (floatval($porcentaje_vip) / 100.0), 2);

            $total = round($subtotal - $descuento_vip, 2);

            // Si el cliente envió un total y difiere, no continuar
            if (isset($datos['total'])) {
                $total_enviado = floatval($datos['total']);
                if (abs($total_enviado - $total) > 0.5) {
                    throw new Exception('Total enviado no coincide con cálculo del servidor');
                }
            }

            // Determinar id_cajero por defecto (si no hay cajero en sesión, usar uno del sistema)
            $id_cajero = 2; // id por defecto existente en la BD (EMP001)
            $usuarioSesion = Sesion::obtenerDatosUsuario();
            if ($usuarioSesion && isset($usuarioSesion['tipo']) && $usuarioSesion['tipo'] === 'cajero') {
                $id_cajero = $usuarioSesion['id'];
            }

            $numero_ticket = 'TICKET' . strtoupper(uniqid());

            // Insertar venta
            $stmt = $this->conexion->prepare("INSERT INTO tbl_ventas (id_cliente, id_cajero, id_funcion, fecha_venta, subtotal, descuento_vip, total, metodo_pago, numero_ticket) VALUES (:id_cliente, :id_cajero, :id_funcion, NOW(), :subtotal, :descuento_vip, :total, :metodo_pago, :numero_ticket)");
            $stmt->bindParam(':id_cliente', $id_cliente);
            $stmt->bindParam(':id_cajero', $id_cajero);
            $stmt->bindParam(':id_funcion', $id_funcion);
            $stmt->bindParam(':subtotal', $subtotal);
            $stmt->bindParam(':descuento_vip', $descuento_vip);
            $stmt->bindParam(':total', $total);
            $stmt->bindParam(':metodo_pago', $metodo_pago);
            $stmt->bindParam(':numero_ticket', $numero_ticket);
            $stmt->execute();

            $id_venta = $this->conexion->lastInsertId();

            // Insertar detalles_venta
            $stmtDet = $this->conexion->prepare("INSERT INTO detalles_venta (id_venta, id_silla, precio_silla) VALUES (:id_venta, :id_silla, :precio_silla)");
            foreach ($asientos as $a) {
                $id_silla = $a['id_silla'];
                $precio_silla = isset($a['precio']) ? floatval($a['precio']) : 0.0;
                $stmtDet->bindParam(':id_venta', $id_venta);
                $stmtDet->bindParam(':id_silla', $id_silla);
                $stmtDet->bindParam(':precio_silla', $precio_silla);
                $stmtDet->execute();
            }

            // Si existe una reserva activa del mismo cliente para esta función que contiene exactamente
            // los mismos asientos, marcarla como convertida (no se borran los detalles para registro)
            try {
                $ids = array_map(function($x){ return intval($x['id_silla']); }, $asientos);
                if (count($ids) > 0) {
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $sqlReserva = "SELECT dr.id_reserva, COUNT(*) as matched 
                                   FROM detalles_reserva dr 
                                   INNER JOIN tbl_reservas r ON dr.id_reserva = r.id_reserva 
                                   WHERE r.id_cliente = ? AND r.id_funcion = ? AND r.estado = 'activa' 
                                    AND dr.id_silla IN ($placeholders) 
                                   GROUP BY dr.id_reserva 
                                   HAVING COUNT(*) = ? 
                                   LIMIT 1";

                    $stmtRes = $this->conexion->prepare($sqlReserva);
                    // bind: first cliente, funcion, then each id_silla, then count
                    $bindIndex = 1;
                    $stmtRes->bindValue($bindIndex++, $id_cliente);
                    $stmtRes->bindValue($bindIndex++, $id_funcion);
                    foreach ($ids as $idv) {
                        $stmtRes->bindValue($bindIndex++, $idv);
                    }
                    $stmtRes->bindValue($bindIndex++, count($ids));
                    $stmtRes->execute();
                    $filaReserva = $stmtRes->fetch(PDO::FETCH_ASSOC);
                    if ($filaReserva && isset($filaReserva['id_reserva'])) {
                        $id_reserva_convertir = $filaReserva['id_reserva'];
                        $upd = $this->conexion->prepare("UPDATE tbl_reservas SET estado = 'convertida' WHERE id_reserva = :id_reserva LIMIT 1");
                        $upd->bindParam(':id_reserva', $id_reserva_convertir);
                        $upd->execute();
                    }
                }
            } catch (Exception $e) {
                // No bloquear la venta por un problema menor al buscar la reserva
                error_log('Error buscando reserva para convertir: ' . $e->getMessage());
            }

            // Registrar actividad
            $logStmt = $this->conexion->prepare("INSERT INTO logs_actividad (id_usuario, accion, descripcion) VALUES (:id_usuario, :accion, :descripcion)");
            $accion = 'Venta creada';
            $descripcion = 'Venta #' . $id_venta . ' - Funcion ' . $id_funcion . ' - Asientos: ' . count($asientos);
            $logStmt->bindParam(':id_usuario', $id_cliente);
            $logStmt->bindParam(':accion', $accion);
            $logStmt->bindParam(':descripcion', $descripcion);
            $logStmt->execute();

            $this->conexion->commit();

            return ['exito' => true, 'mensaje' => 'Pago procesado', 'id_venta' => $id_venta, 'numero_ticket' => $numero_ticket, 'total' => $total];

        } catch (Exception $e) {
            $this->conexion->rollBack();
            return ['exito' => false, 'mensaje' => $e->getMessage()];
        }
    }
}
?>