<?php
// Incluir el archivo de conexión
require_once 'conexion.php';

// Configurar headers para JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    // Obtener datos del POST
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validar que se envíen los datos necesarios
    if (!isset($input['correo']) || !isset($input['contraseña'])) {
        echo json_encode([
            'success' => false, 
            'message' => 'Faltan datos requeridos (correo y contraseña)'
        ]);
        exit;
    }
    
    $correo = trim($input['correo']);
    $contraseña = trim($input['contraseña']);
    
    // Validar que no estén vacíos
    if (empty($correo) || empty($contraseña)) {
        echo json_encode([
            'success' => false, 
            'message' => 'Correo y contraseña son obligatorios'
        ]);
        exit;
    }
    
    // Consultar en la base de datos
    $sql = "SELECT u.id_usuarios, u.nombres, u.apellidos, u.correo, u.contraseña, u.tipo_usuario, u.activo
            FROM tbl_usuarios u 
            WHERE u.correo = :correo AND u.activo = 1";
    
    $stmt = $pdo->prepare($sql);
    $stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
    $stmt->execute();
    
    $usuario = $stmt->fetch();
    
    if ($usuario) {
        // Verificar la contraseña (en este caso está en texto plano, pero deberías usar password_hash)
        if ($contraseña === $usuario['contraseña']) {
            // Login exitoso
            echo json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'usuario' => [
                    'id' => $usuario['id_usuarios'],
                    'nombres' => $usuario['nombres'],
                    'apellidos' => $usuario['apellidos'],
                    'correo' => $usuario['correo'],
                    'tipo_usuario' => $usuario['tipo_usuario']
                ]
            ]);
        } else {
            // Contraseña incorrecta
            echo json_encode([
                'success' => false,
                'message' => 'Correo o contraseña incorrectos'
            ]);
        }
    } else {
        // Usuario no encontrado
        echo json_encode([
            'success' => false,
            'message' => 'Correo o contraseña incorrectos'
        ]);
    }
    
} catch (PDOException $e) {
    // Error de base de datos
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
    
    // En desarrollo, puedes mostrar el error específico:
    // echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
