<?php
// Adapter para la configuración centralizada de la DB
require_once __DIR__ . '/../config/db.php';

class BaseDatos {
    public function obtenerConexion() {
        return db_get_pdo();
    }
}

?>