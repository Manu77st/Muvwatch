import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mysql from 'mysql2';
import clienteRoutes from './API-cliente.js'; // Importar las rutas

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost', //Aquí se corrige el doble .env
    user: process.env.DB_USER || 'root', //Aquí se corrige el doble .env
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'muvwatch',
    port: process.env.DB_PORT || 3306
});


export { db };

//Ruta de prueba para evitar el Cannot Get /
app.get('/', (req, res)=>{
    res.json({
        message: 'El servidor está funcionando correctamente',
        endpoints: {
            login: 'POST /api/login'
        }
    });
});

// Usar las rutas de cliente
app.use('/api', clienteRoutes);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log(`Well done mai friend, el servidor está corriendo en http://localhost:${port}`);
});


// Función para validar login
export async function validarLogin(correo, contraseña) {
    return new Promise((resolve, reject) => {
        if (!correo || !contraseña) {
            return resolve({
                success: false,
                message: 'El correo y la contraseña son necesarios'
            });
        }

        const sql = `SELECT id_usuarios, nombres, apellidos, correo, contraseña, tipo_usuario, activo
        FROM tbl_usuarios WHERE correo = ? AND activo = 1`

        db.query(sql, [correo], (error, results) => {
            if (error) {
                console.error('Error en la consulta:', error);
                return reject({
                    success: false,
                    message: 'Error al consultar la base de datos'
                });
            }

            if (results.length === 0) {
                return resolve({
                    success: false,
                    message: 'Correo o contraseña incorrectos'
                });
            }

            const usuario = results[0];

            if (contraseña === usuario.contraseña) {
                resolve({
                    success: true,
                    message: 'Inicio de sesión exitoso :)',
                    usuario: {
                        id: usuario.id_usuarios,
                        nombres: usuario.nombres,
                        apellidos: usuario.apellidos,
                        correo: usuario.correo,
                        tipo_usuario: usuario.tipo_usuario
                    }
                });
            } else {
                resolve({
                    success: false,
                    message: 'Correo o contraseña incorrectos'
                });
            }
        });
    });
}