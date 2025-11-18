import express from 'express';
import { validarLogin } from './cliente.js';

const router = express.Router();

// Ruta POST para login
router.post('/login', async (req, res) => {
    try {
        // Obtener datos del cuerpo de la petición
        const { correo, contraseña } = req.body;

        // Validar que se enviaron los datos
        if (!correo || !contraseña) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos (correo y contraseña)'
            });
        }

        // Llamar a la función de validación
        const resultado = await validarLogin(correo.trim(), contraseña);

        // Responder según el resultado
        if (resultado.success) {
            res.status(200).json(resultado);
        } else {
            res.status(401).json(resultado);
        }

    } catch (error) {
        console.error('Error en el endpoint de login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

export default router;