<?php
// filepath: test_conexion.php
include 'base_datos.php';

$bd = new BaseDatos();
$conn = $bd->obtenerConexion();

if ($conn) {
    echo "✓ Conexión exitosa a la base de datos 'muvwatch'<br>";

    // Prueba una consulta simple con PDO
    $sql = "SELECT * FROM tbl_usuarios LIMIT 4";
    $stmt = $conn->query($sql);

    if ($stmt && $stmt->rowCount() > 0) {
        echo "✓ Base de datos con datos<br>";
        foreach ($stmt as $row) {
            echo "Usuario: " . $row["nombres"] . "<br>";
        }
    } else {
        echo "No hay usuarios registrados";
    }
} else {
    echo "Error de conexión con el servidor. Por favor intenta de nuevo.";
}
?>
