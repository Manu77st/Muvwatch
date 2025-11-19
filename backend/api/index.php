<?php
/**
 * API Router - Punto de entrada único
 * Maneja todas las peticiones del módulo cliente
 */

// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar dependencias
require_once __DIR__ . '/../controladores/AutenticacionControlador.php';
require_once __DIR__ . '/../controladores/ClienteControlador.php';
require_once __DIR__ . '/../utilidades/Utilidades.php';

// Obtener la acción de la URL
$accion = $_GET['accion'] ?? '';
$metodo = $_SERVER['REQUEST_METHOD'];

// Obtener datos del body para POST/PUT
$datos = [];
if(in_array($metodo, ['POST', 'PUT', 'DELETE'])) {
    $datos = json_decode(file_get_contents("php://input"), true) ?? [];
}

// Router principal
try {
    switch($accion) {
        
        // ========== AUTENTICACIÓN ==========
        case 'registro':
            if($metodo !== 'POST') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new AutenticacionControlador();
            $resultado = $controlador->registrar($datos);
            Respuesta::json($resultado, $resultado['exito'] ? 201 : 400);
            break;

        case 'login':
            if($metodo !== 'POST') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new AutenticacionControlador();
            $resultado = $controlador->iniciarSesion($datos['correo'] ?? '', $datos['contraseña'] ?? '');
            Respuesta::json($resultado, $resultado['exito'] ? 200 : 401);
            break;

        case 'logout':
            if($metodo !== 'POST') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new AutenticacionControlador();
            $resultado = $controlador->cerrarSesion();
            Respuesta::json($resultado);
            break;

        case 'verificar_sesion':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new AutenticacionControlador();
            $resultado = $controlador->verificarSesion();
            Respuesta::json($resultado, $resultado['exito'] ? 200 : 401);
            break;

        // ========== PELÍCULAS ==========
        case 'cartelera':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->obtenerCartelera();
            Respuesta::json($resultado);
            break;

        case 'pelicula':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->obtenerPelicula($_GET['id'] ?? '');
            Respuesta::json($resultado, $resultado['exito'] ? 200 : 404);
            break;

        case 'buscar_peliculas':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->buscarPeliculas($_GET['q'] ?? '');
            Respuesta::json($resultado);
            break;

        case 'promociones':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->obtenerPromociones();
            Respuesta::json($resultado);
            break;

        // ========== FUNCIONES Y ASIENTOS ==========
        case 'funcion':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->obtenerFuncion($_GET['id'] ?? '');
            Respuesta::json($resultado, $resultado['exito'] ? 200 : 404);
            break;
        case 'asientos_funcion':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            // Llamar al método que devuelve los asientos disponibles
            // El controlador define obtenerAsientosDisponibles
            $resultado = $controlador->obtenerAsientosDisponibles($_GET['id'] ?? '');
            Respuesta::json($resultado, $resultado['exito'] ? 200 : 404);
            break;
        // ========== RESERVAS Y COMPRAS ==========
        case 'crear_reserva':
            if($metodo !== 'POST') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->crearReserva($datos);
            Respuesta::json($resultado, $resultado['exito'] ? 201 : 400);
            break;
        case 'mis_reservas':
            if($metodo !== 'GET') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->obtenerMisReservas();
            Respuesta::json($resultado);
            break;
        case 'cancelar_reserva':
            if($metodo !== 'DELETE') {
                Respuesta::error('Método no permitido', 405);
            }
            $controlador = new ClienteControlador();
            $resultado = $controlador->cancelarReserva($_GET['id'] ?? '');
            Respuesta::json($resultado, $resultado['exito'] ? 200 : 400);
            break;
        default:
            Respuesta::error('Acción no encontrada', 404);
            break;
    }
} catch(Exception $e) {
    Respuesta::error('Error interno del servidor', 500);
}
            Respuesta::json([
                'exito' => false,
                'mensaje' => $mensaje
            ], $codigo);
?>