<?php
/**
 * Controlador de Autenticación (Login, Registro, Logout)
 */

require_once __DIR__ . '/../configuracion/base_datos.php';
require_once __DIR__ . '/../modelos/UsuarioModelos.php';
require_once __DIR__ . '/../utilidades/Utilidades.php';

class AutenticacionControlador {
    private $conexion;

    public function __construct() {
        $bd = new BaseDatos();
        $this->conexion = $bd->obtenerConexion();
    }

    public function registrar($datos) {
        // Validar campos requeridos
        $validacion = Validador::camposRequeridos($datos, [
            'nombres', 'apellidos', 'correo', 'contraseña', 
            'telefono', 'tipo_documento', 'numero_documento', 'fecha_nacimiento'
        ]);
        
        if(!$validacion['valido']) {
            return ['exito' => false, 'mensaje' => $validacion['mensaje']];
        }

        // Validar correo
        $validacionCorreo = Validador::correo($datos['correo']);
        if(!$validacionCorreo['valido']) {
            return ['exito' => false, 'mensaje' => $validacionCorreo['mensaje']];
        }

        // Validar contraseña
        $validacionContraseña = Validador::contraseña($datos['contraseña']);
        if(!$validacionContraseña['valido']) {
            return ['exito' => false, 'mensaje' => $validacionContraseña['mensaje']];
        }

        // Verificar si el correo ya existe
        $usuario = new Usuario($this->conexion);
        $usuario->correo = $datos['correo'];

        if($usuario->existeCorreo()) {
            return ['exito' => false, 'mensaje' => 'El correo electrónico ya está registrado'];
        }

        // Asignar datos al usuario
        $usuario->nombres = $datos['nombres'];
        $usuario->apellidos = $datos['apellidos'];
        $usuario->contraseña = $datos['contraseña'];
        $usuario->telefono = $datos['telefono'];
        $usuario->tipo_documento = $datos['tipo_documento'];
        $usuario->numero_documento = $datos['numero_documento'];
        $usuario->fecha_nacimiento = $datos['fecha_nacimiento'];
        $usuario->tipo_usuario = 'cliente';

        // Iniciar transacción
        $this->conexion->beginTransaction();

        try {
            // Crear usuario
            if($usuario->crear()) {
                // Crear registro de cliente
                $cliente = new Cliente($this->conexion);
                if($cliente->crear($usuario->id_usuarios)) {
                    $this->conexion->commit();
                    
                    return [
                        'exito' => true,
                        'mensaje' => 'Registro exitoso. Ya puedes iniciar sesión',
                        'datos' => [
                            'id_usuario' => $usuario->id_usuarios
                        ]
                    ];
                }
            }
            
            $this->conexion->rollBack();
            return ['exito' => false, 'mensaje' => 'Error al registrar el usuario'];

        } catch(Exception $e) {
            $this->conexion->rollBack();
            return ['exito' => false, 'mensaje' => 'Error del servidor: ' . $e->getMessage()];
        }
    }

    public function iniciarSesion($correo, $contraseña) {
        // Validar campos
        if(empty($correo) || empty($contraseña)) {
            return ['exito' => false, 'mensaje' => 'Correo y contraseña son requeridos'];
        }

        // Buscar usuario
        $usuario = new Usuario($this->conexion);
        $usuario->correo = $correo;
        $stmt = $usuario->buscarPorCorreo();

        if($stmt->rowCount() > 0) {
            $fila = $stmt->fetch(PDO::FETCH_ASSOC);

            // Verificar contraseña
            if(password_verify($contraseña, $fila['contraseña'])) {
                
                // Verificar que sea cliente
                if($fila['tipo_usuario'] !== 'cliente') {
                    return [
                        'exito' => false, 
                        'mensaje' => 'Este usuario no tiene permisos de cliente'
                    ];
                }

                // Obtener información del cliente (VIP)
                $cliente = new Cliente($this->conexion);
                $cliente->id_cliente = $fila['id_usuarios'];
                $cliente->esVIP();

                // Establecer sesión
                Sesion::establecerDatos([
                    'id' => $fila['id_usuarios'],
                    'tipo' => $fila['tipo_usuario'],
                    'nombres' => $fila['nombres'],
                    'apellidos' => $fila['apellidos']
                ], $cliente->cliente_vip, $cliente->porcentaje_descuento);

                return [
                    'exito' => true,
                    'mensaje' => 'Inicio de sesión exitoso',
                    'datos' => [
                        'id_usuario' => $fila['id_usuarios'],
                        'nombres' => $fila['nombres'],
                        'apellidos' => $fila['apellidos'],
                        'correo' => $fila['correo'],
                        'telefono' => $fila['telefono'],
                        'tipo_usuario' => $fila['tipo_usuario'],
                        'cliente_vip' => $cliente->cliente_vip,
                        'porcentaje_descuento' => $cliente->porcentaje_descuento
                    ]
                ];
            } else {
                return ['exito' => false, 'mensaje' => 'Contraseña incorrecta'];
            }
        }

        return ['exito' => false, 'mensaje' => 'Usuario no encontrado'];
    }

    public function cerrarSesion() {
        Sesion::destruir();
        return ['exito' => true, 'mensaje' => 'Sesión cerrada correctamente'];
    }

    public function verificarSesion() {
        $usuario = Sesion::obtenerDatosUsuario();
        
        if($usuario && $usuario['tipo'] === 'cliente') {
            return ['exito' => true, 'datos' => $usuario];
        }

        return ['exito' => false, 'mensaje' => 'No hay sesión activa'];
    }
}
?>