<?php
/**
 * Modelos relacionados con Cine (Películas, Funciones, Reservas)
 */

// ============================================
// MODELO: Pelicula
// ============================================
class Pelicula {
    private $conexion;
    private $tabla = "tbl_pelicula";

    public $id_pelicula;
    public $nombre;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    public function obtenerCartelera() {
        $consulta = "SELECT p.id_pelicula, p.nombre, p.sipnosis, p.clasificacion,
                           p.genero, p.reparto, p.director, p.duracion, p.fecha_estreno,
                           f.id_funcion, f.fecha_funcion, f.precio, f.descuento,
                           s.id_sala, s.nombre as sala, s.capacidad
                    FROM " . $this->tabla . " p
                    INNER JOIN tbl_funcion f ON p.id_pelicula = f.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    ORDER BY p.nombre, f.fecha_funcion";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->execute();
        
        return $stmt;
    }

    public function obtenerPorId() {
        $consulta = "SELECT id_pelicula, nombre, sipnosis, clasificacion, 
                           genero, reparto, director, duracion, fecha_estreno
                    FROM " . $this->tabla . "
                    WHERE id_pelicula = :id_pelicula 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_pelicula", $this->id_pelicula);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function buscar($termino) {
        $consulta = "SELECT id_pelicula, nombre, sipnosis, clasificacion, 
                           genero, reparto, director, duracion, fecha_estreno
                    FROM " . $this->tabla . "
                    WHERE nombre LIKE :termino 
                       OR genero LIKE :termino 
                       OR reparto LIKE :termino 
                       OR director LIKE :termino
                    ORDER BY nombre";
        
        $stmt = $this->conexion->prepare($consulta);
        $busqueda = "%" . Validador::limpiar($termino) . "%";
        $stmt->bindParam(":termino", $busqueda);
        $stmt->execute();
        
        return $stmt;
    }

    public function obtenerPromociones() {
        $consulta = "SELECT p.id_pelicula, p.nombre, p.sipnosis, p.clasificacion,
                           p.genero, p.reparto, p.director, p.duracion, p.fecha_estreno,
                           f.id_funcion, f.fecha_funcion, f.precio, f.descuento,
                           s.id_sala, s.nombre as sala,
                           ROUND((f.descuento / f.precio) * 100, 0) as porcentaje_descuento
                    FROM " . $this->tabla . " p
                    INNER JOIN tbl_funcion f ON p.id_pelicula = f.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    WHERE f.descuento > 0
                    ORDER BY porcentaje_descuento DESC, p.nombre";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->execute();
        
        return $stmt;
    }
}

// ============================================
// MODELO: Funcion (relacionado con Pelicula)
// ============================================
class Funcion {
    private $conexion;
    private $tabla = 'tbl_funcion';

    public $id_funcion;
    public $id_pelicula;
    public $id_sala;
    public $fecha_funcion;
    public $precio;
    public $descuento;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    public function obtenerPorId() {
        $consulta = "SELECT f.id_funcion, f.id_pelicula, f.id_sala, f.fecha_funcion, f.precio, f.descuento, f.activa,
                            p.nombre as pelicula, s.nombre as sala, s.capacidad
                     FROM tbl_funcion f
                     INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                     INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                     WHERE f.id_funcion = :id_funcion
                     LIMIT 1";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_funcion', $this->id_funcion);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function obtenerPorPelicula() {
        $consulta = "SELECT id_funcion, fecha_funcion, precio, descuento, id_sala
                     FROM tbl_funcion
                     WHERE id_pelicula = :id_pelicula
                     AND activa = 1
                     ORDER BY fecha_funcion";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_pelicula', $this->id_pelicula);
        $stmt->execute();

        return $stmt;
    }

    // Retorna un PDOStatement con el listado de asientos y su disponibilidad
    public function obtenerAsientosDisponibles() {
        $consulta = "
        SELECT 
            s.id_silla, 
            s.fila, 
            s.columna, 
            s.tipo, 
            s.activa,
            CASE 
                WHEN dr.id_silla IS NOT NULL OR dv.id_silla IS NOT NULL THEN 0
                ELSE 1
            END AS disponible
        FROM tbl_sillas s
        LEFT JOIN (
            SELECT dr.id_silla
            FROM detalles_reserva dr
            INNER JOIN tbl_reservas r ON dr.id_reserva = r.id_reserva
            WHERE r.id_funcion = :id_funcion
            AND r.estado = 'activa'
        ) dr ON s.id_silla = dr.id_silla
        LEFT JOIN (
            SELECT dv.id_silla
            FROM detalles_venta dv
            INNER JOIN tbl_ventas v ON dv.id_venta = v.id_venta
            WHERE v.id_funcion = :id_funcion
        ) dv ON s.id_silla = dv.id_silla
        WHERE s.id_sala = (SELECT id_sala FROM tbl_funcion WHERE id_funcion = :id_funcion)
        ORDER BY s.fila, s.columna
        ";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_funcion', $this->id_funcion);
        $stmt->execute();

        return $stmt;
    }

    // Calcular total considerando descuento de función y porcentaje VIP
    public function calcularTotal($cantidad_asientos, $porcentaje_vip = 0) {
        $cantidad = max(0, (int)$cantidad_asientos);
        $precio = isset($this->precio) ? floatval($this->precio) : 0.0;
        $descuento = isset($this->descuento) ? floatval($this->descuento) : 0.0;

        // Precio después del descuento de la función
        $precioDespuesDescuento = max(0, $precio - $descuento);

        // Descuento VIP en porcentaje (por ejemplo 10 => 10%)
        $porcentaje_vip = floatval($porcentaje_vip);
        $montoVip = $precioDespuesDescuento * ($porcentaje_vip / 100.0);

        $precioFinalUnitario = max(0, $precioDespuesDescuento - $montoVip);
        $total = $precioFinalUnitario * $cantidad;

        return [
            'precio_unitario' => round($precio, 2),
            'descuento_funcion' => round($descuento, 2),
            'porcentaje_vip' => $porcentaje_vip,
            'precio_unitario_final' => round($precioFinalUnitario, 2),
            'cantidad' => $cantidad,
            'total' => round($total, 2)
        ];
    }
}

// ============================================
// MODELO: Reserva (relacionado con Funciones y Asientos)
// ============================================
class Reserva {
    private $conexion;
    private $tabla = "tbl_reservas";

    public $id_reserva;
    public $id_cliente;
    public $id_funcion;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    // Crear reserva segura con múltiples asientos
    public function crear(array $asientos) {
        if (empty($asientos)) {
            return ['exito' => false, 'mensaje' => 'No se han seleccionado asientos'];
        }

        $this->conexion->beginTransaction();
        try {
            // Verificar disponibilidad de todos los asientos
            foreach ($asientos as $id_silla) {
                if (!$this->asientoDisponible($id_silla)) {
                    throw new Exception("El asiento {$id_silla} no está disponible");
                }
            }

            $fecha_expiracion = date('Y-m-d H:i:s', strtotime('+2 hours'));

            // Insertar reserva
            $stmt = $this->conexion->prepare("
                INSERT INTO {$this->tabla} 
                    (id_cliente, id_funcion, fecha_reserva, hora, fecha_expiracion, estado)
                VALUES (:id_cliente, :id_funcion, CURDATE(), CURTIME(), :fecha_expiracion, 'activa')
            ");
            $stmt->bindParam(":id_cliente", $this->id_cliente);
            $stmt->bindParam(":id_funcion", $this->id_funcion);
            $stmt->bindParam(":fecha_expiracion", $fecha_expiracion);
            $stmt->execute();

            $this->id_reserva = $this->conexion->lastInsertId();

            // Insertar detalles de asientos
            $stmtDetalle = $this->conexion->prepare("
                INSERT INTO detalles_reserva (id_reserva, id_silla) 
                VALUES (:id_reserva, :id_silla)
            ");
            foreach ($asientos as $id_silla) {
                $stmtDetalle->bindParam(":id_reserva", $this->id_reserva);
                $stmtDetalle->bindParam(":id_silla", $id_silla);
                $stmtDetalle->execute();
            }

            $this->registrarLog('Reserva creada', 'Reserva #' . $this->id_reserva . ' - ' . count($asientos) . ' asientos');

            $this->conexion->commit();

            return ['exito' => true, 'id_reserva' => $this->id_reserva, 'fecha_expiracion' => $fecha_expiracion];

        } catch (Exception $e) {
            $this->conexion->rollBack();
            return ['exito' => false, 'mensaje' => $e->getMessage()];
        }
    }

    // Comprueba si un asiento específico está libre para la función actual
    public function asientoDisponible($id_silla) {
        // Revisar en reservas activas
        $consulta = "SELECT dr.id_silla
                     FROM detalles_reserva dr
                     INNER JOIN tbl_reservas r ON dr.id_reserva = r.id_reserva
                     WHERE r.id_funcion = :id_funcion
                       AND r.estado = 'activa'
                       AND dr.id_silla = :id_silla
                     LIMIT 1";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_funcion', $this->id_funcion);
        $stmt->bindParam(':id_silla', $id_silla);
        $stmt->execute();
        if ($stmt->fetch(PDO::FETCH_ASSOC)) {
            return false;
        }

        // Revisar ventas/compras ya pagadas
        $consulta2 = "SELECT dv.id_silla
                      FROM detalles_venta dv
                      INNER JOIN tbl_ventas v ON dv.id_venta = v.id_venta
                      WHERE v.id_funcion = :id_funcion
                        AND dv.id_silla = :id_silla
                      LIMIT 1";

        $stmt2 = $this->conexion->prepare($consulta2);
        $stmt2->bindParam(':id_funcion', $this->id_funcion);
        $stmt2->bindParam(':id_silla', $id_silla);
        $stmt2->execute();
        if ($stmt2->fetch(PDO::FETCH_ASSOC)) {
            return false;
        }

        return true;
    }

    // Cancelar reserva (solo el cliente dueño y si está activa)
    public function cancelar() {
        $consulta = "UPDATE {$this->tabla} SET estado = 'cancelada' WHERE id_reserva = :id_reserva AND id_cliente = :id_cliente AND estado = 'activa'";
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_reserva', $this->id_reserva);
        $stmt->bindParam(':id_cliente', $this->id_cliente);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    // Obtener detalles de una reserva por id
    public function obtenerPorId() {
        $consulta = "SELECT r.*, p.nombre as pelicula, f.fecha_funcion, s.nombre as sala
                     FROM {$this->tabla} r
                     INNER JOIN tbl_funcion f ON r.id_funcion = f.id_funcion
                     INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                     INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                     WHERE r.id_reserva = :id_reserva
                     LIMIT 1";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_reserva', $this->id_reserva);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Registrar log de actividad
    private function registrarLog($accion, $descripcion) {
        $stmt = $this->conexion->prepare("
            INSERT INTO logs_actividad (id_usuario, accion, descripcion)
            VALUES (:id_usuario, :accion, :descripcion)
        ");
        $stmt->bindParam(":id_usuario", $this->id_cliente);
        $stmt->bindParam(":accion", $accion);
        $stmt->bindParam(":descripcion", $descripcion);
        $stmt->execute();
    }

    public static function expirarReservas($conexion) {
        $consulta = "UPDATE tbl_reservas 
                    SET estado = 'expirada'
                    WHERE estado = 'activa' 
                    AND fecha_expiracion < NOW()";
        
        $stmt = $conexion->prepare($consulta);
        return $stmt->execute();
    }
}
?>