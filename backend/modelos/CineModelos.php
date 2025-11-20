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
                   f.id_funcion, CONCAT(f.fecha_funcion, ' ', f.hora) as fecha_funcion, f.precio, f.descuento,
                   s.id_sala, s.nombre as sala, s.capacidad
                    FROM " . $this->tabla . " p
                    INNER JOIN tbl_funcion f ON p.id_pelicula = f.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    WHERE f.activa = 1 AND p.activa = 1
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
                    AND activa = 1
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
                    WHERE (nombre LIKE :termino 
                       OR genero LIKE :termino 
                       OR reparto LIKE :termino 
                       OR director LIKE :termino)
                    AND activa = 1
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
                   f.id_funcion, CONCAT(f.fecha_funcion, ' ', f.hora) as fecha_funcion, f.precio, f.descuento,
                   s.id_sala, s.nombre as sala,
                           ROUND((f.descuento / f.precio) * 100, 0) as porcentaje_descuento
                    FROM " . $this->tabla . " p
                    INNER JOIN tbl_funcion f ON p.id_pelicula = f.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    WHERE f.descuento > 0 
                    AND f.activa = 1 
                    AND p.activa = 1
                    ORDER BY porcentaje_descuento DESC, p.nombre";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->execute();
        
        return $stmt;
    }
}

// ============================================
// MODELO: Funcion
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
        $consulta = "SELECT f.id_funcion, f.id_pelicula, f.id_sala, CONCAT(f.fecha_funcion, ' ', f.hora) as fecha_funcion, f.precio, f.descuento, f.activa,
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
        $consulta = "SELECT id_funcion, CONCAT(fecha_funcion, ' ', hora) as fecha_funcion, precio, descuento, id_sala
                 FROM tbl_funcion
                     WHERE id_pelicula = :id_pelicula
                     AND activa = 1
                 AND CONCAT(fecha_funcion, ' ', hora) >= CONCAT(CURDATE(), ' 00:00:00')
                 ORDER BY fecha_funcion";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_pelicula', $this->id_pelicula);
        $stmt->execute();

        return $stmt;
    }

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
        AND s.activa = 1
        ORDER BY s.fila, s.columna
        ";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_funcion', $this->id_funcion);
        $stmt->execute();

        return $stmt;
    }

    public function obtenerAsientosOcupados() {
        $consulta = "
        SELECT DISTINCT s.id_silla
        FROM tbl_sillas s
        LEFT JOIN detalles_reserva dr ON s.id_silla = dr.id_silla
        LEFT JOIN tbl_reservas r ON dr.id_reserva = r.id_reserva
        LEFT JOIN detalles_venta dv ON s.id_silla = dv.id_silla
        LEFT JOIN tbl_ventas v ON dv.id_venta = v.id_venta
        WHERE (r.id_funcion = :id_funcion AND r.estado = 'activa')
           OR (v.id_funcion = :id_funcion)
        ";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_funcion', $this->id_funcion);
        $stmt->execute();

        return $stmt;
    }

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

        // Verificar que la silla exista y esté activa
        $consulta3 = "SELECT activa FROM tbl_sillas WHERE id_silla = :id_silla LIMIT 1";
        $stmt3 = $this->conexion->prepare($consulta3);
        $stmt3->bindParam(':id_silla', $id_silla);
        $stmt3->execute();
        $fila = $stmt3->fetch(PDO::FETCH_ASSOC);
        if(!$fila || $fila['activa'] != 1) return false;

        return true;
    }

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
// MODELO: Reserva
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
                    (id_cliente, id_funcion, fecha_reserva, hora, fecha_expiracion, estado, cantidad_asientos)
                VALUES (:id_cliente, :id_funcion, CURDATE(), CURTIME(), :fecha_expiracion, 'activa', :cantidad_asientos)
            ");
            $stmt->bindParam(":id_cliente", $this->id_cliente);
            $stmt->bindParam(":id_funcion", $this->id_funcion);
            $stmt->bindParam(":fecha_expiracion", $fecha_expiracion);
            $stmt->bindParam(":cantidad_asientos", count($asientos));
            $stmt->execute();

            $this->id_reserva = $this->conexion->lastInsertId();

            // Insertar detalles de asientos
            $stmtDetalle = $this->conexion->prepare("
                INSERT INTO detalles_reserva (id_reserva, id_silla, id_funcion) 
                VALUES (:id_reserva, :id_silla, :id_funcion)
            ");
            
            foreach ($asientos as $id_silla) {
                $stmtDetalle->bindParam(":id_reserva", $this->id_reserva);
                $stmtDetalle->bindParam(":id_silla", $id_silla);
                $stmtDetalle->bindParam(":id_funcion", $this->id_funcion);
                $stmtDetalle->execute();
            }

            $this->registrarLog('Reserva creada', 'Reserva #' . $this->id_reserva . ' - ' . count($asientos) . ' asientos');

            $this->conexion->commit();

            return [
                'exito' => true, 
                'id_reserva' => $this->id_reserva, 
                'fecha_expiracion' => $fecha_expiracion,
                'cantidad_asientos' => count($asientos)
            ];

        } catch (Exception $e) {
            $this->conexion->rollBack();
            return ['exito' => false, 'mensaje' => $e->getMessage()];
        }
    }

    public function asientoDisponible($id_silla) {
        // Verificar en reservas activas
        $consulta = "SELECT 1 FROM detalles_reserva dr 
                    INNER JOIN tbl_reservas r ON dr.id_reserva = r.id_reserva 
                    WHERE dr.id_silla = :id_silla 
                    AND r.id_funcion = :id_funcion 
                    AND r.estado = 'activa' 
                    LIMIT 1";
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_silla', $id_silla);
        $stmt->bindParam(':id_funcion', $this->id_funcion);
        $stmt->execute();
        if($stmt->fetch()) return false;

        // Verificar en ventas
        $consulta2 = "SELECT 1 FROM detalles_venta dv 
                     INNER JOIN tbl_ventas v ON dv.id_venta = v.id_venta 
                     WHERE dv.id_silla = :id_silla 
                     AND v.id_funcion = :id_funcion 
                     LIMIT 1";
        $stmt2 = $this->conexion->prepare($consulta2);
        $stmt2->bindParam(':id_silla', $id_silla);
        $stmt2->bindParam(':id_funcion', $this->id_funcion);
        $stmt2->execute();
        if($stmt2->fetch()) return false;

        // Verificar que la silla exista y esté activa
        $consulta3 = "SELECT activa FROM tbl_sillas WHERE id_silla = :id_silla LIMIT 1";
        $stmt3 = $this->conexion->prepare($consulta3);
        $stmt3->bindParam(':id_silla', $id_silla);
        $stmt3->execute();
        $fila = $stmt3->fetch(PDO::FETCH_ASSOC);
        if(!$fila || $fila['activa'] != 1) return false;

        return true;
    }

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

    public function cancelar() {
        $consulta = "UPDATE {$this->tabla} SET estado = 'cancelada' WHERE id_reserva = :id_reserva AND id_cliente = :id_cliente AND estado = 'activa'";
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(':id_reserva', $this->id_reserva);
        $stmt->bindParam(':id_cliente', $this->id_cliente);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }
}
?>