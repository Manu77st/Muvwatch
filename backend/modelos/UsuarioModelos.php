<?php
/**
 * Modelos relacionados con Usuarios y Clientes
 */

// ============================================
// MODELO: Usuario
// ============================================
class Usuario {
    private $conexion;
    private $tabla = "tbl_usuarios";

    public $id_usuarios;
    public $nombres;
    public $apellidos;
    public $correo;
    public $contraseña;
    public $telefono;
    public $tipo_documento;
    public $numero_documento;
    public $fecha_nacimiento;
    public $tipo_usuario;
    public $activo;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    public function crear() {
        $consulta = "INSERT INTO " . $this->tabla . "
                    SET nombres = :nombres, 
                        apellidos = :apellidos, 
                        correo = :correo,
                        contraseña = :contrasena, 
                        telefono = :telefono,
                        tipo_documento = :tipo_documento, 
                        numero_documento = :numero_documento,
                        fecha_nacimiento = :fecha_nacimiento, 
                        tipo_usuario = :tipo_usuario, 
                        activo = 1";

        $stmt = $this->conexion->prepare($consulta);
        
        // Limpiar datos
        $this->nombres = Validador::limpiar($this->nombres);
        $this->apellidos = Validador::limpiar($this->apellidos);
        $this->correo = Validador::limpiar($this->correo);
        $this->telefono = Validador::limpiar($this->telefono);
        $this->tipo_documento = Validador::limpiar($this->tipo_documento);
        $this->numero_documento = Validador::limpiar($this->numero_documento);
        $this->fecha_nacimiento = Validador::limpiar($this->fecha_nacimiento);
        $this->tipo_usuario = Validador::limpiar($this->tipo_usuario);
        
        // Encriptar contraseña
        $contraseña_hash = password_hash($this->contraseña, PASSWORD_BCRYPT);

        // Bind parámetros
        $stmt->bindParam(":nombres", $this->nombres);
        $stmt->bindParam(":apellidos", $this->apellidos);
        $stmt->bindParam(":correo", $this->correo);
        $stmt->bindParam(":contrasena", $contraseña_hash);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":tipo_documento", $this->tipo_documento);
        $stmt->bindParam(":numero_documento", $this->numero_documento);
        $stmt->bindParam(":fecha_nacimiento", $this->fecha_nacimiento);
        $stmt->bindParam(":tipo_usuario", $this->tipo_usuario);

        if($stmt->execute()) {
            $this->id_usuarios = $this->conexion->lastInsertId();
            return true;
        }
        return false;
    }

    public function buscarPorCorreo() {
        $consulta = "SELECT id_usuarios, nombres, apellidos, correo, contraseña, 
                           tipo_usuario, activo, telefono
                    FROM " . $this->tabla . "
                    WHERE correo = :correo AND activo = 1 
                    LIMIT 1";

        $stmt = $this->conexion->prepare($consulta);
        $this->correo = Validador::limpiar($this->correo);
        $stmt->bindParam(":correo", $this->correo);
        $stmt->execute();
        
        return $stmt;
    }

    public function existeCorreo() {
        $consulta = "SELECT id_usuarios 
                    FROM " . $this->tabla . "
                    WHERE correo = :correo 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $this->correo = Validador::limpiar($this->correo);
        $stmt->bindParam(":correo", $this->correo);
        $stmt->execute();
        
        return $stmt->rowCount() > 0;
    }

    public function obtenerPorId() {
        $consulta = "SELECT id_usuarios, nombres, apellidos, correo, telefono,
                           tipo_documento, numero_documento, fecha_nacimiento,
                           tipo_usuario, activo, fecha_registro
                    FROM " . $this->tabla . "
                    WHERE id_usuarios = :id_usuarios AND activo = 1 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_usuarios", $this->id_usuarios);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function actualizar() {
        $consulta = "UPDATE " . $this->tabla . "
                    SET nombres = :nombres, 
                        apellidos = :apellidos, 
                        telefono = :telefono
                    WHERE id_usuarios = :id_usuarios";
        
        $stmt = $this->conexion->prepare($consulta);
        
        $this->nombres = Validador::limpiar($this->nombres);
        $this->apellidos = Validador::limpiar($this->apellidos);
        $this->telefono = Validador::limpiar($this->telefono);
        
        $stmt->bindParam(":nombres", $this->nombres);
        $stmt->bindParam(":apellidos", $this->apellidos);
        $stmt->bindParam(":telefono", $this->telefono);
        $stmt->bindParam(":id_usuarios", $this->id_usuarios);
        
        return $stmt->execute();
    }
}

// ============================================
// MODELO: Cliente (relacionado con Usuario)
// ============================================
class Cliente {
    private $conexion;
    private $tabla = "tbl_clientes";

    public $id_cliente;
    public $cliente_vip;
    public $porcentaje_descuento;

    public function __construct($bd) {
        $this->conexion = $bd;
    }

    public function crear($id_usuario) {
        $consulta = "INSERT INTO " . $this->tabla . "
                    SET id_cliente = :id_cliente, 
                        cliente_vip = 0, 
                        porcentaje_descuento = 0.00";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_cliente", $id_usuario);
        
        return $stmt->execute();
    }

    public function obtenerPorId() {
        $consulta = "SELECT c.id_cliente, c.cliente_vip, c.porcentaje_descuento,
                           u.nombres, u.apellidos, u.correo, u.telefono,
                           u.tipo_documento, u.numero_documento, u.fecha_nacimiento
                    FROM " . $this->tabla . " c
                    INNER JOIN tbl_usuarios u ON c.id_cliente = u.id_usuarios
                    WHERE c.id_cliente = :id_cliente AND u.activo = 1 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function esVIP() {
        $consulta = "SELECT cliente_vip, porcentaje_descuento
                    FROM " . $this->tabla . "
                    WHERE id_cliente = :id_cliente 
                    LIMIT 1";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        $stmt->execute();
        
        $fila = $stmt->fetch(PDO::FETCH_ASSOC);
        if($fila) {
            $this->cliente_vip = $fila['cliente_vip'];
            $this->porcentaje_descuento = $fila['porcentaje_descuento'];
            return true;
        }
        return false;
    }

    public function obtenerReservasActivas() {
        $consulta = "SELECT r.id_reserva, r.fecha_reserva, r.hora, 
                           r.fecha_expiracion, r.estado,
                           p.nombre as pelicula, p.clasificacion, p.duracion, p.genero,
                          s.nombre as sala, CONCAT(f.fecha_funcion, ' ', f.hora) as fecha_funcion, f.precio,
                           GROUP_CONCAT(CONCAT(si.fila, si.columna) 
                                ORDER BY si.fila, si.columna SEPARATOR ', ') as asientos,
                           COUNT(si.id_silla) as cantidad_asientos
                    FROM tbl_reservas r
                    INNER JOIN tbl_funcion f ON r.id_funcion = f.id_funcion
                    INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    LEFT JOIN detalles_reserva dr ON r.id_reserva = dr.id_reserva
                    LEFT JOIN tbl_sillas si ON dr.id_silla = si.id_silla
                    WHERE r.id_cliente = :id_cliente 
                    AND r.estado = 'activa' 
                    AND r.fecha_expiracion > NOW()
                    GROUP BY r.id_reserva
                    ORDER BY r.fecha_reserva DESC, r.hora DESC";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        $stmt->execute();
        
        return $stmt;
    }

    // Obtener todas las reservas del cliente (sin filtrar por estado/expiración)
    // Usa LEFT JOIN para no perder reservas si faltan filas relacionadas
    public function obtenerReservasPorUsuario() {
        $consulta = "SELECT r.id_reserva, r.fecha_reserva, r.hora, 
                           r.fecha_expiracion, r.estado,
                           p.nombre as pelicula, p.clasificacion, p.duracion, p.genero,
                          s.nombre as sala, CONCAT(f.fecha_funcion, ' ', f.hora) as fecha_funcion, f.precio,
                           GROUP_CONCAT(CONCAT(si.fila, si.columna) 
                                ORDER BY si.fila, si.columna SEPARATOR ', ') as asientos,
                           COUNT(si.id_silla) as cantidad_asientos
                    FROM tbl_reservas r
                    LEFT JOIN tbl_funcion f ON r.id_funcion = f.id_funcion
                    LEFT JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                    LEFT JOIN tbl_salas s ON f.id_sala = s.id_sala
                    LEFT JOIN detalles_reserva dr ON r.id_reserva = dr.id_reserva
                    LEFT JOIN tbl_sillas si ON dr.id_silla = si.id_silla
                    WHERE r.id_cliente = :id_cliente
                    GROUP BY r.id_reserva
                    ORDER BY r.fecha_reserva DESC, r.hora DESC";

        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        $stmt->execute();

        return $stmt;
    }

    public function obtenerHistorialCompras() {
        $consulta = "SELECT v.id_venta, v.fecha_venta, v.total, v.numero_ticket,
                           p.nombre as pelicula, s.nombre as sala,
                           f.fecha_funcion, f.precio,
                           COUNT(dv.id_silla) as cantidad_boletos
                    FROM tbl_ventas v
                    INNER JOIN tbl_funcion f ON v.id_funcion = f.id_funcion
                    INNER JOIN tbl_pelicula p ON f.id_pelicula = p.id_pelicula
                    INNER JOIN tbl_salas s ON f.id_sala = s.id_sala
                    LEFT JOIN detalles_venta dv ON v.id_venta = dv.id_venta
                    WHERE v.id_cliente = :id_cliente
                    GROUP BY v.id_venta
                    ORDER BY v.fecha_venta DESC";
        
        $stmt = $this->conexion->prepare($consulta);
        $stmt->bindParam(":id_cliente", $this->id_cliente);
        $stmt->execute();
        
        return $stmt;
    }
}
?>