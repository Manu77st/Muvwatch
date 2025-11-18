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
                    WHERE p.activa = 1 
                    AND f.activa = 1 
                    AND s.activa = 1
                    AND f.fecha_funcion >= CURDATE()
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
                    WHERE activa = 1 
                    AND (nombre LIKE :termino 
                         OR genero LIKE :termino 
                         OR reparto LIKE :termino 
                         OR director LIKE :termino)
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
                    WHERE p.activa = 1 
                    AND f.activa = 1 
                    AND s.activa = 1
                    AND f.descuento > 0 
                    AND f.fecha_funcion >= CURDATE()
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
    private $tabla = "tbl_funcion";

    public $id_funcion;
    public $id_pelicula;
    public $precio;
    public $descuento;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    public function obtenerPorPelicula() {
        $consulta = "SELECT f.id_funcion, f.fecha_funcion, f.precio, f.descuento,
                           s.id_sala, s.nombre as sala, s.capacidad
                    FROM " . $this->tabla . " f
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    WHERE f.id_pelicula = :id_pelicula 
                    AND f.activa = 1 
                    AND s.activa = 1
                    AND f.fecha_funcion >= CURDATE()
                    ORDER BY f.fecha_funcion";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_pelicula", $this->id_pelicula);
        $stmt->execute();
        
        return $stmt;
    }

    public function obtenerPorId() {
        $consulta = "SELECT f.id_funcion, f.id_pelicula, f.id_sala, 
                           f.fecha_funcion, f.precio, f.descuento,
                           p.nombre as pelicula, p.sipnosis, p.clasificacion,
                           p.genero, p.reparto, p.director, p.duracion,
                           s.nombre as sala, s.capacidad
                    FROM " . $this->tabla . " f
                    INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    WHERE f.id_funcion = :id_funcion 
                    AND f.activa = 1 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_funcion", $this->id_funcion);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function obtenerAsientosDisponibles() {
        $consulta = "SELECT s.id_silla, s.fila, s.columna, s.tipo, s.activa,
                           CASE 
                              WHEN dr.id_silla IS NOT NULL OR dv.id_silla IS NOT NULL THEN 0
                              ELSE 1
                           END as disponible
                    FROM tbl_sillas s
                    LEFT JOIN detalles_reserva dr ON s.id_silla = dr.id_silla
                        AND dr.id_reserva IN (
                            SELECT id_reserva FROM tbl_reservas 
                            WHERE id_funcion = :id_funcion 
                            AND estado = 'activa'
                            AND fecha_expiracion > NOW()
                        )
                    LEFT JOIN detalles_venta dv ON s.id_silla = dv.id_silla
                        AND dv.id_venta IN (
                            SELECT id_venta FROM tbl_ventas 
                            WHERE id_funcion = :id_funcion
                        )
                    WHERE s.id_sala = (
                        SELECT id_sala FROM " . $this->tabla . " 
                        WHERE id_funcion = :id_funcion
                    )
                    AND s.activa = 1
                    ORDER BY s.fila, s.columna";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_funcion", $this->id_funcion);
        $stmt->execute();
        
        return $stmt;
    }

    public function calcularTotal($cantidad_asientos, $porcentaje_descuento_vip = 0) {
        $subtotal = $this->precio * $cantidad_asientos;
        $descuento_funcion = $this->descuento * $cantidad_asientos;
        
        // Aplicar descuento VIP si corresponde
        $descuento_vip = 0;
        if($porcentaje_descuento_vip > 0) {
            $descuento_vip = ($subtotal - $descuento_funcion) * ($porcentaje_descuento_vip / 100);
        }

        $total = $subtotal - $descuento_funcion - $descuento_vip;

        return [
            'subtotal' => number_format($subtotal, 2, '.', ''),
            'descuento_funcion' => number_format($descuento_funcion, 2, '.', ''),
            'descuento_vip' => number_format($descuento_vip, 2, '.', ''),
            'total' => number_format($total, 2, '.', ''),
            'cantidad_asientos' => $cantidad_asientos,
            'precio_unitario' => number_format($this->precio, 2, '.', '')
        ];
    }
}

// ============================================
// MODELO: Reserva (relacionado con Funcion)
// ============================================
class Reserva {
    private $conexion;
    private $tabla = "tbl_reservas";

    public $id_reserva;
    public $id_cliente;
    public $id_funcion;
    public $estado;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    public function crear($asientos) {
        $this->conexion->beginTransaction();
        
        try {
            // Verificar disponibilidad de todos los asientos
            foreach($asientos as $id_silla) {
                if(!$this->verificarDisponibilidad($id_silla)) {
                    throw new Exception("El asiento {$id_silla} no está disponible");
                }
            }

            // Crear reserva
            $fecha_expiracion = date('Y-m-d H:i:s', strtotime('+2 hours'));
            
            $consulta = "INSERT INTO " . $this->tabla . "
                        SET id_cliente = :id_cliente, 
                            id_funcion = :id_funcion,
                            fecha_reserva = CURDATE(), 
                            hora = CURTIME(),
                            fecha_expiracion = :fecha_expiracion, 
                            estado = 'activa'";

            $stmt = $this->conexion->prepare($consulta);
            $stmt->bindParam(":id_cliente", $this->id_cliente);
            $stmt->bindParam(":id_funcion", $this->id_funcion);
            $stmt->bindParam(":fecha_expiracion", $fecha_expiracion);
            $stmt->execute();

            $this->id_reserva = $this->conexion->lastInsertId();

            // Insertar detalles de reserva (asientos)
            $consultaDetalle = "INSERT INTO detalles_reserva (id_reserva, id_silla) 
                               VALUES (:id_reserva, :id_silla)";
            $stmtDetalle = $this->conexion->prepare($consultaDetalle);

            foreach($asientos as $id_silla) {
                $stmtDetalle->bindParam(":id_reserva", $this->id_reserva);
                $stmtDetalle->bindParam(":id_silla", $id_silla);
                $stmtDetalle->execute();
            }

            // Registrar en log
            $this->registrarLog(
                'Reserva creada', 
                'Reserva #' . $this->id_reserva . ' - ' . count($asientos) . ' asientos'
            );

            $this->conexion->commit();
            
            return [
                'exito' => true,
                'id_reserva' => $this->id_reserva,
                'fecha_expiracion' => $fecha_expiracion
            ];

        } catch(Exception $e) {
            $this->conexion->rollBack();
            return [
                'exito' => false, 
                'mensaje' => $e->getMessage()
            ];
        }
    }

    private function verificarDisponibilidad($id_silla) {
        $consulta = "SELECT id_silla FROM tbl_sillas
                    WHERE id_silla = :id_silla 
                    AND activa = 1
                    AND id_silla NOT IN (
                        SELECT id_silla FROM detalles_reserva
                        WHERE id_reserva IN (
                            SELECT id_reserva FROM tbl_reservas
                            WHERE id_funcion = :id_funcion 
                            AND estado = 'activa'
                            AND fecha_expiracion > NOW()
                        )
                    )
                    AND id_silla NOT IN (
                        SELECT id_silla FROM detalles_venta
                        WHERE id_venta IN (
                            SELECT id_venta FROM tbl_ventas 
                            WHERE id_funcion = :id_funcion
                        )
                    )";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_silla", $id_silla);
        $stmt->bindParam(":id_funcion", $this->id_funcion);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    public function cancelar() {
        $consulta = "UPDATE " . $this->tabla . "
                    SET estado = 'cancelada'
                    WHERE id_reserva = :id_reserva 
                    AND id_cliente = :id_cliente
                    AND estado = 'activa'";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_reserva", $this->id_reserva);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        
        if($stmt->execute() && $stmt->rowCount() > 0) {
            $this->registrarLog(
                'Reserva cancelada', 
                'Reserva #' . $this->id_reserva . ' cancelada por el cliente'
            );
            return true;
        }
        return false;
    }

    public function obtenerPorId() {
        $consulta = "SELECT r.id_reserva, r.id_cliente, r.id_funcion,
                           r.fecha_reserva, r.hora, r.fecha_expiracion, r.estado,
                           p.nombre as pelicula, p.clasificacion, p.duracion,
                           s.nombre as sala, f.fecha_funcion, f.precio,
                           GROUP_CONCAT(CONCAT(si.fila, si.columna) 
                                ORDER BY si.fila, si.columna SEPARATOR ', ') as asientos,
                           COUNT(si.id_silla) as cantidad_asientos
                    FROM " . $this->tabla . " r
                    INNER JOIN tbl_funcion f ON r.id_funcion = f.id_funcion
                    INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    LEFT JOIN detalles_reserva dr ON r.id_reserva = dr.id_reserva
                    LEFT JOIN tbl_sillas si ON dr.id_silla = si.id_silla
                    WHERE r.id_reserva = :id_reserva
                    GROUP BY r.id_reserva 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_reserva", $this->id_reserva);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    private function registrarLog($accion, $descripcion) {
        $consulta = "INSERT INTO logs_actividad (id_usuario, accion, descripcion)
                    VALUES (:id_usuario, :accion, :descripcion)";
        
        $stmt = $this->conexion->prepare($consulta);
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