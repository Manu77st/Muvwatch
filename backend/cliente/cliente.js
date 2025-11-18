import cors from 'cors';
import express from 'express';
import mysql from 'mysql2';
import dotenv from 'dotenv';

// Inicialización de Express
const app=express();
// Cargar variables de entorno desde .env
dotenv.config();
// Habilitar CORS para permitir peticiones externas
app.use(cors());
// Habilitar recepción de JSON en los requests
app.use(express.json());

// Crear un pool de conexiones MySQL.
// Esto permite manejar múltiples conexiones sin crearlas manualmente cada vez.
const db=mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME ||'muvwatch',
    port: process.env.DB_PORT || '3306'
});

// Puerto donde correrá el servidor
const PORT = process.env.PORT || 5000;

// Endpoint para reservar asiento
app.post('/api/reservarAsiento', async (req,res)=>{
       const {id_funcion, id_cliente, sillas}=req.body;

       // Validación básica de datos requeridos
       if(!id_funcion || !Array.isArray(sillas) || !id_cliente){
        return res.status(400).json({message: 'Faltan datos obligatorios'});
       }

       // Solicitar una conexión específica del pool (necesaria para transacciones)
       db.getConnection(async (err, conexion)=>{
        if(err){
            return res.status(500).json({message: 'Error en la conexión a la base de datos'});
        }
        try{
            // Iniciar transacción
            await conexion.beginTransaction();

            // Consultar datos de la función (película)
            const qFuncion = 'SELECT fecha_funcion, hora, id_sala FROM tbl_funcion WHERE id_funcion = ?';
            const [Funcion] = await conexion.promise().query(qFuncion, [id_funcion]);

            // Verificar si la función existe
            if(Funcion.length == 0){
                await conexion.rollback();
                conexion.release();
                return res.status(404).json({message: 'Función no encontrada'});
            }

            // Obtener id de sala para validar asientos
            const id_sala = Funcion[0].id_sala;

            // Registrar la reserva principal
            const qReserva = 'INSERT INTO tbl_reservas(id_cliente, id_funcion) VALUES (?,?)';
            const [Reserva]= await conexion.promise().query(qReserva, [id_cliente, id_funcion]);
            const id_reserva = Reserva.insertId;

            // Convertir sillas tipo "A5" en fila y columna
            const sillasConvertidas = sillas.map(s =>({
                fila: s.charAt(0),
                columna: parseInt(s.slice(1))
            }));

            const ids = [];

            // Validar cada silla individualmente
            for(let silla of sillasConvertidas){ 
                // Bloqueo SELECT ... FOR UPDATE para evitar condiciones de carrera
                const[Asiento] = await conexion.promise().query(
                    'SELECT id, estado FROM tbl_sillas WHERE id_sala = ? AND fila =? AND columna = ? FOR UPDATE',
                    [id_sala, silla.fila, silla.columna]
                );

                // Verificar si el asiento existe
                if(Asiento.length ===0){
                    await conexion.rollback();
                    conexion.release();
                    return res.status(404).json({message: `Asiento ${silla.fila}${silla.columna} no encontrado`});
                }

                // Verificar si está ocupado
                if(Asiento[0].estado === 1){
                    conexion.release();
                    await conexion.rollback();
                    return res.status(409).json({message: `Asiento ${silla.fila}${silla.columna} ocupado`});
                }

                // Guardar id del asiento para luego actualizarlo
                ids.push(Asiento[0].id);
            }

            // Marcar cada asiento como ocupado y registrar detalle de reserva
            for(let id_asiento of ids){
                await conexion.promise().query('UPDATE tbl_sillas SET estado = ? WHERE id = ?', [1, id_asiento]);

                const qDetalle_reserva = 'INSERT INTO detalles_reserva (id_reserva, id_silla) VALUES (?, ?)';
                const [Detalle_reserva] = await conexion.promise().query(qDetalle_reserva,[id_reserva, id_asiento]);
            }

            // Confirmar todos los cambios de la transacción
            await conexion.commit();
            conexion.release();
            return res.status(200).json({message: 'Reserva registrada con éxito'});

        }catch(err){
            // En caso de error revertir cambios
            await conexion.rollback();
            conexion.release();
            return res.status(500).json({message: 'Error al reservar asientos', error: err.message});
        }
         });
    });

// Iniciar servidor
app.listen(PORT,()=>{
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});