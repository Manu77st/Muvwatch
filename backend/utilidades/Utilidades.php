<?php
/**
 * Utilidades del sistema
 */

// ============================================
// CLASE: Sesion
// ============================================
class Sesion {
    public static function iniciar() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function verificarCliente() {
        self::iniciar();
        
        if(!isset($_SESSION['usuario_id']) || $_SESSION['usuario_tipo'] !== 'cliente') {
            Respuesta::error('Acceso no autorizado. Debe iniciar sesión como cliente', 401);
        }
        
        return $_SESSION['usuario_id'];
    }

    public static function obtenerDatosUsuario() {
        self::iniciar();
        
        if(isset($_SESSION['usuario_id'])) {
            return [
                'id' => $_SESSION['usuario_id'],
                'nombres' => $_SESSION['usuario_nombres'] ?? '',
                'apellidos' => $_SESSION['usuario_apellidos'] ?? '',
                'tipo' => $_SESSION['usuario_tipo'] ?? '',
                'vip' => $_SESSION['cliente_vip'] ?? 0,
                'descuento' => $_SESSION['porcentaje_descuento'] ?? 0
            ];
        }
        
        return null;
    }

    public static function establecerDatos($usuario, $vip = 0, $descuento = 0) {
        self::iniciar();
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_tipo'] = $usuario['tipo'];
        $_SESSION['usuario_nombres'] = $usuario['nombres'];
        $_SESSION['usuario_apellidos'] = $usuario['apellidos'];
        $_SESSION['cliente_vip'] = $vip;
        $_SESSION['porcentaje_descuento'] = $descuento;
    }

    public static function destruir() {
        self::iniciar();
        session_unset();
        session_destroy();
    }
}

// ============================================
// CLASE: Respuesta
// ============================================
class Respuesta {
    public static function json($datos, $codigo = 200) {
        http_response_code($codigo);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode($datos, JSON_UNESCAPED_UNICODE);
        exit();
    }

    public static function exito($datos = null, $mensaje = 'Operación exitosa', $codigo = 200) {
        self::json([
            'exito' => true,
            'mensaje' => $mensaje,
            'datos' => $datos
        ], $codigo);
    }

    public static function error($mensaje = 'Error en la operación', $codigo = 400) {
        self::json([
            'exito' => false,
            'mensaje' => $mensaje
        ], $codigo);
    }
}

// ============================================
// CLASE: Validador
// ============================================
class Validador {
    public static function camposRequeridos($datos, $campos) {
        $faltantes = [];
        foreach($campos as $campo) {
            if(empty($datos[$campo])) {
                $faltantes[] = $campo;
            }
        }
        
        if(!empty($faltantes)) {
            return [
                'valido' => false, 
                'mensaje' => 'Campos requeridos faltantes: ' . implode(', ', $faltantes)
            ];
        }
        return ['valido' => true];
    }

    public static function correo($correo) {
        if(!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            return ['valido' => false, 'mensaje' => 'Formato de correo inválido'];
        }
        return ['valido' => true];
    }

    public static function contraseña($contraseña, $longitud_minima = 6) {
        if(strlen($contraseña) < $longitud_minima) {
            return [
                'valido' => false, 
                'mensaje' => "La contraseña debe tener al menos {$longitud_minima} caracteres"
            ];
        }
        return ['valido' => true];
    }

    public static function limpiar($texto) {
        return htmlspecialchars(strip_tags(trim($texto)));
    }
}
?>