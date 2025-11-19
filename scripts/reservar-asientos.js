/**
 * Script para Reservar Película - Selección de Asientos
 * Maneja: Carga de película, funciones, asientos y creación de reserva
 */

const API_URL = '../../backend/api/index.php';

// ========================================
// ESTADO GLOBAL
// ========================================
let estadoReserva = {
    idPelicula: null,
    idFuncion: null,
    asientosSeleccionados: [],
    datosFunc: {},
    datosAsientos: []
};

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    inicializarPagina();
});

async function inicializarPagina() {
    // Obtener ID de película del sessionStorage
    estadoReserva.idPelicula = sessionStorage.getItem('id_pelicula');
    
    if(!estadoReserva.idPelicula) {
        alert('No se especificó una película');
        window.location.href = 'lobby-cliente.html';
        return;
    }

    // Cargar datos
    await cargarDetallesPelicula();
    configurarEventos();
}

// ========================================
// CARGAR DATOS DEL SERVIDOR
// ========================================
async function cargarDetallesPelicula() {
    const panelSala = document.querySelector('.panel-sala');
    
    try {
        const respuesta = await fetch(`${API_URL}?accion=pelicula&id=${estadoReserva.idPelicula}`);
        const datos = await respuesta.json();

        if(!datos.exito) {
            mostrarError('No se pudo cargar la película');
            return;
        }

        const pelicula = datos.datos;
        
        // Mostrar opciones de funciones disponibles
        mostrarOpcionesFunciones(pelicula, panelSala);

    } catch(error) {
        console.error('Error al cargar película:', error);
        mostrarError('Error al cargar la película');
    }
}

async function cargarAsientosPorFuncion(idFuncion) {
    try {
        const respuesta = await fetch(`${API_URL}?accion=obtener_asientos&id_funcion=${idFuncion}`);
        const datos = await respuesta.json();

        if(!datos.exito) {
            mostrarError('No se pudieron cargar los asientos');
            return;
        }

        // Guardar datos en estado
        estadoReserva.idFuncion = idFuncion;
        estadoReserva.datosFunc = datos.datos.funcion;
        estadoReserva.datosAsientos = datos.datos.asientos;
        estadoReserva.asientosSeleccionados = [];

        // Actualizar UI
        actualizarInfoFuncion();
        renderizarAsientos();
        resetearSeleccion();

    } catch(error) {
        console.error('Error al cargar asientos:', error);
        mostrarError('Error al cargar los asientos');
    }
}

// ========================================
// RENDERIZAR INTERFAZ
// ========================================
function mostrarOpcionesFunciones(pelicula, contenedor) {
    // Crear contenedor temporal para funciones
    const htmlFunciones = `
        <div class="funciones-selector" style="padding: 20px;">
            <h2>${pelicula.nombre}</h2>
            <p style="color: #666; margin: 10px 0 20px 0;">${pelicula.sipnosis}</p>
            
            <h3 style="margin: 20px 0 10px 0;">Selecciona una función:</h3>
            <div class="funciones-disponibles" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                ${pelicula.funciones.map(funcion => {
                    const fecha = new Date(funcion.fecha_funcion);
                    const fechaFormato = fecha.toLocaleDateString('es-CO', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                    const horaFormato = fecha.toLocaleTimeString('es-CO', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    
                    return `
                        <div 
                            class="funcion-card" 
                            onclick="seleccionarFuncion(${funcion.id_funcion})"
                            style="border: 2px solid #ddd; padding: 15px; border-radius: 8px; cursor: pointer; transition: all 0.3s; text-align: center;"
                        >
                            <p style="font-weight: bold; margin: 0 0 10px 0;">${fechaFormato}</p>
                            <p style="font-size: 18px; color: #3b7ba6; margin: 10px 0; font-weight: bold;">${horaFormato}</p>
                            <p style="font-size: 12px; color: #999; margin: 10px 0 0 0;">${funcion.sala}</p>
                            <p style="font-size: 14px; color: #3b7ba6; font-weight: bold; margin: 10px 0 0 0;">
                                $${parseFloat(funcion.precio_final).toLocaleString('es-CO')}
                            </p>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    contenedor.innerHTML = htmlFunciones;
}

function renderizarAsientos() {
    const bloqueIzquierda = document.getElementById('bloqueAsientosIzquierda');
    const bloqueDerecha = document.getElementById('bloqueAsientosDerecha');

    if(!bloqueIzquierda || !bloqueDerecha) return;

    // Agrupar asientos por fila
    const filas = {};
    estadoReserva.datosAsientos.forEach(asiento => {
        if(!filas[asiento.fila]) {
            filas[asiento.fila] = [];
        }
        filas[asiento.fila].push(asiento);
    });

    const filasOrdenadas = Object.keys(filas).sort();
    const ptoMedio = Math.ceil(filasOrdenadas.length / 2);

    const filasIzq = filasOrdenadas.slice(0, ptoMedio);
    const filasDer = filasOrdenadas.slice(ptoMedio);

    bloqueIzquierda.innerHTML = generarHTML_Filas(filas, filasIzq);
    bloqueDerecha.innerHTML = generarHTML_Filas(filas, filasDer);
}

function generarHTML_Filas(filas, filasAMostrar) {
    return filasAMostrar.map(fila => `
        <div class="fila" style="margin-bottom: 10px; display: flex; align-items: center; gap: 10px;">
            <span class="etiqueta-fila" style="min-width: 30px; font-weight: bold; text-align: center;">${fila}</span>
            <div class="asientos" style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${filas[fila].map(asiento => generarHTML_Asiento(asiento)).join('')}
            </div>
        </div>
    `).join('');
}

function generarHTML_Asiento(asiento) {
    const claseEstado = asiento.disponible ? 'disponible' : 'ocupado';
    const claseDiscapacitado = asiento.tipo === 'Discapacitado' ? 'discapacitado' : '';
    const onclick = asiento.disponible ? `onclick="alternarAsiento(${asiento.id_silla})"` : '';
    const seleccionado = estadoReserva.asientosSeleccionados.includes(asiento.id_silla);
    const claseSeleccionado = seleccionado ? 'seleccionado' : '';

    return `
        <button 
            class="asiento ${claseEstado} ${claseDiscapacitado} ${claseSeleccionado}"
            data-id="${asiento.id_silla}"
            data-fila="${asiento.fila}"
            data-columna="${asiento.columna}"
            ${onclick}
            ${!asiento.disponible ? 'disabled' : ''}
            title="${asiento.fila}${asiento.columna} - ${asiento.tipo}"
            style="
                width: 35px;
                height: 35px;
                padding: 0;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid #ddd;
                border-radius: 4px;
                cursor: ${asiento.disponible ? 'pointer' : 'not-allowed'};
                background-color: ${asiento.disponible ? '#fff' : '#ddd'};
                color: #333;
                transition: all 0.2s;
            "
        >
            ${asiento.fila}${asiento.columna}
        </button>
    `;
}

function actualizarInfoFuncion() {
    const func = estadoReserva.datosFunc;
    
    document.getElementById('funcionNombre').textContent = func.pelicula || '—';
    
    const fecha = new Date(func.fecha_funcion);
    document.getElementById('funcionFecha').textContent = fecha.toLocaleDateString('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    document.getElementById('funcionHora').textContent = fecha.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ========================================
// INTERACCIÓN CON ASIENTOS
// ========================================
function seleccionarFuncion(idFuncion) {
    cargarAsientosPorFuncion(idFuncion);
}

function alternarAsiento(idSilla) {
    const index = estadoReserva.asientosSeleccionados.indexOf(idSilla);

    if(index > -1) {
        // Deseleccionar
        estadoReserva.asientosSeleccionados.splice(index, 1);
    } else {
        // Seleccionar
        estadoReserva.asientosSeleccionados.push(idSilla);
    }

    // Actualizar visualización
    actualizarVisualizacionAsientos();
    actualizarContador();
}

function actualizarVisualizacionAsientos() {
    document.querySelectorAll('.asiento').forEach(btn => {
        const idSilla = parseInt(btn.dataset.id);
        
        if(estadoReserva.asientosSeleccionados.includes(idSilla)) {
            btn.classList.add('seleccionado');
        } else {
            btn.classList.remove('seleccionado');
        }
    });
}

function actualizarContador() {
    document.getElementById('contadorSeleccionadas').textContent = estadoReserva.asientosSeleccionados.length;
}

function resetearSeleccion() {
    estadoReserva.asientosSeleccionados = [];
    actualizarContador();
    actualizarVisualizacionAsientos();
}

// ========================================
// CREAR RESERVA
// ========================================
async function confirmarReserva() {
    // Validaciones
    if(!estadoReserva.idFuncion) {
        alert('Por favor selecciona una función');
        return;
    }

    if(estadoReserva.asientosSeleccionados.length === 0) {
        alert('Por favor selecciona al menos un asiento');
        return;
    }

    // Mostrar confirmación
    const cantidadAsientos = estadoReserva.asientosSeleccionados.length;
    if(!confirm(`¿Deseas confirmar la reserva de ${cantidadAsientos} asiento(s)?`)) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}?accion=crear_reserva`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_funcion: estadoReserva.idFuncion,
                asientos: estadoReserva.asientosSeleccionados
            })
        });

        const datos = await respuesta.json();

        if(datos.exito) {
            // Guardar ID de reserva
            sessionStorage.setItem('id_reserva', datos.datos.id_reserva);
            
            alert('¡Reserva creada exitosamente!');
            window.location.href = 'carrito.html';
        } else {
            alert('Error: ' + datos.mensaje);
        }
    } catch(error) {
        console.error('Error al crear reserva:', error);
        alert('Error al crear la reserva. Intenta de nuevo.');
    }
}

// ========================================
// MÉTODOS DE PAGO
// ========================================
function seleccionarMetodoPago(elemento) {
    // Remover selección anterior
    document.querySelectorAll('.boton-pago').forEach(btn => {
        btn.classList.remove('activo');
    });
    
    // Agregar selección actual
    elemento.classList.add('activo');
    
    const metodo = elemento.dataset.metodo;
    console.log('Método de pago seleccionado:', metodo);
}

// ========================================
// CONFIGURAR EVENTOS
// ========================================
function configurarEventos() {
    // Botón confirmar
    const btnConfirmar = document.getElementById('botonConfirmar');
    if(btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarReserva);
    }

    // Botones de métodos de pago
    const botonesPago = document.querySelectorAll('.boton-pago');
    botonesPago.forEach(btn => {
        btn.addEventListener('click', () => seleccionarMetodoPago(btn));
    });

    // Búsqueda y filtros (compatibilidad con HTML)
    const inputBusqueda = document.getElementById('search-input');
    if(inputBusqueda) {
        inputBusqueda.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') {
                busquedas();
            }
        });
    }
}

// ========================================
// UTILIDADES
// ========================================
function mostrarError(mensaje) {
    const panelSala = document.querySelector('.panel-sala');
    if(panelSala) {
        panelSala.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #d32f2f;">
                <p>${mensaje}</p>
                <a href="lobby-cliente.html" style="color: #3b7ba6; text-decoration: underline;">
                    Volver a la cartelera
                </a>
            </div>
        `;
    }
}

// ========================================
// ALIAS DE COMPATIBILIDAD
// ========================================
const filtro = () => console.log('Filtros - No implementado');
const busquedas = () => console.log('Búsqueda - No implementado');
const openMovieModal = () => console.log('Modal - No aplicable en esta página');
const closeMovieModal = () => console.log('Modal - No aplicable en esta página');