<?php
/**
 * Configuración de conexión a base de datos
 */
class BaseDatos {
    private $servidor = "127.0.0.1";
    private $nombre_bd = "muvwatch";
    private $usuario = "root";
    private $clave = "";
    private $conexion;

    public function obtenerConexion() {
        $this->conexion = null;
        
        try {
            $this->conexion = new PDO(
                "mysql:host=" . $this->servidor . ";dbname=" . $this->nombre_bd,
                $this->usuario,
                $this->clave
            );
            $this->conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conexion->exec("set names utf8mb4");
        } catch(PDOException $e) {
            echo json_encode([
                'exito' => false,
                'mensaje' => 'Error de conexión a la base de datos'
            ]);
            exit();
        }
        
        return $this->conexion;
    }
}
?>