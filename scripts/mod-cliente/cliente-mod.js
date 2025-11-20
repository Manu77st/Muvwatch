/**
 * Script principal para todas las páginas del módulo cliente
 * Maneja: Sesión, navegación, chatbot, eventos globales
 */

const API_URL = '../../backend/api/index.php';
// Compatibilidad: algunos scripts anteriores usan `API_BASE`
const API_BASE = API_URL;

// Compatibilidad con otra versión del archivo (alias a normalizarNombreImagen)
function filenameFromTitle(title) {
    return normalizarNombreImagen(title);
}

// Cache de películas para modal
let peliculasCache = {};

// ========================================
// FILTRAR FUNCIONES FUTURAS
// ========================================
function filtrarFuncionesFuturas(funcionesArray) {
    const ahora = new Date();
    return funcionesArray.filter(funcion => 
        new Date(funcion.fecha_funcion) > ahora
    ).sort((a, b) => new Date(a.fecha_funcion) - new Date(b.fecha_funcion));
}

// ========================================
// INICIALIZACIÓN GLOBAL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    verificarSesionGlobal();
    configurarChatbot();
    configurarMenu();
    cargarContenidoPrincipal();
    configurarEventosGlobales();
    configurarPreseleccionReserva();
});

// ========================================
// CONFIGURAR PRESELECCIÓN DE RESERVA
// ========================================
function configurarPreseleccionReserva() {
    document.addEventListener(
        "click",
        (e) => {
            try {
                const target = e.target.closest && e.target.closest(".btn-reservar");
                if (!target) return;

                const card = target.closest(".movie-card");
                if (!card) return;

                const peliculaId = card.getAttribute("data-pelicula-id");
                if (!peliculaId) return;

                const pelicula = peliculasCache[peliculaId];
                if (!pelicula) return;

                // FILTRAR solo funciones futuras
                const funcionesFuturas = filtrarFuncionesFuturas(pelicula.funciones || []);

                if (funcionesFuturas.length === 0) {
                    alert("No hay funciones disponibles para esta película");
                    e.preventDefault();
                    return;
                }

                // Elegir función preseleccionada: la primera (más cercana)
                const seleccion = funcionesFuturas[0];
                if (seleccion && seleccion.id_funcion) {
                    const id_funcion_preseleccionada = String(seleccion.id_funcion);
                    sessionStorage.setItem(
                        "id_funcion_preseleccionada",
                        id_funcion_preseleccionada
                    );
                }

                // Guardar id_pelicula
                sessionStorage.setItem("id_pelicula", String(peliculaId));
                
                // Guardar funciones futuras en cache para la página de reserva
                if (funcionesFuturas.length > 0) {
                    try {
                        sessionStorage.setItem("funciones_cache", JSON.stringify(funcionesFuturas));
                    } catch (err) {
                        console.debug("No se pudo guardar funciones en cache:", err);
                    }
                }
            } catch (err) {
                console.error("Error preseleccionando función:", err);
            }
        },
        true
    );
}

// ========================================
// SESIÓN Y AUTENTICACIÓN
// ========================================
async function verificarSesionGlobal() {
    try {
        const respuesta = await fetch(`${API_URL}?accion=verificar_sesion`);
        const datos = await respuesta.json();

        if(datos.exito && datos.datos) {
            actualizarMenuUsuario(datos.datos);
        } else {
            // Permitir acceso a páginas públicas
            const paginasPublicas = ['login.html', 'registro.html'];
            const paginaActual = window.location.pathname.split('/').pop();
            
            if(!paginasPublicas.includes(paginaActual)) {
                if(!window.location.href.includes('login') && !window.location.href.includes('registro')) {
                    // redirigirAlLogin();
                }
            }
        }
    } catch(error) {
        console.error('Error al verificar sesión:', error);
    }
}

function actualizarMenuUsuario(usuario) {
    const clienteBox = document.querySelector('.cliente-box');
    
    if(clienteBox) {
        const nombreCompleto = `${usuario.nombres} ${usuario.apellidos}`;
        
        clienteBox.innerHTML = `
            <span class="material-symbols-outlined icon-inline profile-icon" aria-hidden="true">
                account_circle
            </span>
            ${nombreCompleto}
            <div class="menu-cliente" id="menuCliente">
                <a href="#" onclick="abrirPerfil(event)">Perfil</a>
                <a href="#" onclick="cerrarSesionGlobal(event)">Cerrar sesión</a>
            </div>
        `;
    }
}

async function cerrarSesionGlobal(e) {
    e.preventDefault();
    
    if(!confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}?accion=logout`, { method: 'POST' });
        const datos = await respuesta.json();

        if(datos.exito) {
            sessionStorage.clear();
            window.location.href = '../../src/login.html';
        }
    } catch(error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

// ========================================
// CARGAR CONTENIDO SEGÚN PÁGINA
// ========================================
function cargarContenidoPrincipal() {
    const paginaActual = window.location.pathname;

    if (paginaActual.includes("lobby-cliente")) {
        cargarCartelera();
    } else if (paginaActual.includes("promociones")) {
        cargarPromociones();
    } else if (paginaActual.includes("mis-reservas") || paginaActual.includes("carrito")) {
        cargarReservas();
    }
}

// ========================================
// CARGAR CARTELERA
// ========================================
async function cargarCartelera() {
    try {
        const respuesta = await fetch(`${API_URL}?accion=cartelera`);
        const datos = await respuesta.json();

        if(datos.exito && datos.datos) {
            renderizarCartelera(datos.datos);
        } else {
            console.warn('No se pudieron cargar las películas');
        }
    } catch(error) {
        console.error('Error cargando cartelera:', error);
    }
}

// ========================================
// CARGAR PROMOCIONES
// ========================================
async function cargarPromociones() {
    try {
        const respuesta = await fetch(`${API_URL}?accion=promociones`);
        const datos = await respuesta.json();

        if(datos.exito && datos.datos) {
            renderizarPromociones(datos.datos);
        } else {
            console.warn('No hay promociones disponibles');
        }
    } catch(error) {
        console.error('Error cargando promociones:', error);
    }
}

// ========================================
// CARGAR RESERVAS (CARRITO)
// ========================================
async function cargarReservas() {
    const contenedor = document.querySelector('.reservas-container');
    const noReservas = contenedor ? contenedor.querySelector('.no-reservas') : null;

    try {
        // 1) Traer reservas activas
        const res = await fetch(`${API_BASE}?accion=mis_reservas`, { credentials: 'include' });
        const j = await res.json();
        if (!j.exito) {
            console.warn('No se pudo obtener reservas:', j.mensaje);
        }

        const reservas = Array.isArray(j.datos) ? j.datos : [];

        // 2) Intentar traer ventas asociadas al usuario (varios posibles endpoints de backend)
            const ventas = await fetchVentasForUser(); // Se incluye 'historial_compras' en los endpoints

        // Mapear ventas a un formato similar al de reservas para mostrar en la UI
        const ventasMapeadas = ventas.map(v => ({
            id_reserva: v.id_venta || v.id || v.idVenta,
            pelicula: v.pelicula || v.nombre_pelicula || `Venta #${v.id_venta || v.id || ''}`,
            fecha_funcion: v.fecha_venta || v.fecha || '',
            hora: v.hora || '',
            asientos: v.asientos || v.detalles || '',
            sala: v.sala || '',
            total: v.total || v.monto || 0,
            estado: 'confirmada',
            poster: v.poster || null
        }));

        // Combinar reservas y ventas (ventas al final)
        const datos = reservas.concat(ventasMapeadas);

        const contador = document.querySelector('.reservas-count .count-number');
        if (contador) contador.textContent = datos.length;

        if (!contenedor) return;

        if (datos.length === 0) {
            if (noReservas) noReservas.style.display = 'block';
            return;
        }

        if (noReservas) noReservas.style.display = 'none';
        contenedor.innerHTML = '';

        datos.forEach(r => {
            const card = document.createElement('div');
            card.className = 'reserva-card';

            const status = document.createElement('div');
            // ventas mapeadas vienen con estado 'confirmada'
            status.className = 'reserva-status ' + (r.estado === 'activa' || r.estado === 'confirmada' ? 'activa' : r.estado);
            status.innerHTML = `<span class="material-symbols-outlined">${r.estado === 'activa' || r.estado === 'confirmada' ? 'check_circle' : 'calendar_today'}</span> ${r.estado === 'activa' || r.estado === 'confirmada' ? 'Confirmada' : r.estado}`;

            const content = document.createElement('div');
            content.className = 'reserva-content';

            const left = document.createElement('div');
            left.className = 'reserva-left';
            const img = document.createElement('img');
            let posterPath = '';
            if (r.poster) {
                posterPath = r.poster.startsWith('http') ? r.poster : `../../images/Peliculas_Cartelera/${r.poster}`;
            } else if (r.pelicula) {
                const fn = filenameFromTitle(r.pelicula);
                posterPath = `../../images/Peliculas_Cartelera/${fn}.jpg`;
            } else {
                posterPath = '../../images/Logo.svg';
            }
            img.src = posterPath;
            img.alt = r.pelicula || 'Póster';
            img.onerror = function() { this.src = '../../images/Logo.svg'; };
            left.appendChild(img);

            const info = document.createElement('div');
            info.className = 'reserva-info';

            const title = document.createElement('h3');
            title.textContent = r.pelicula || 'Sin título';

            const filaFecha = document.createElement('div');
            filaFecha.className = 'info-row';
            filaFecha.innerHTML = `<span class="material-symbols-outlined">calendar_today</span> <span>Fecha: ${ (r.fecha_funcion || r.fecha_reserva) || '' }</span>`;

            const filaHora = document.createElement('div');
            filaHora.className = 'info-row';
            filaHora.innerHTML = `<span class="material-symbols-outlined">schedule</span> <span>Hora: ${ r.hora || '' }</span>`;

            const filaAsientos = document.createElement('div');
            filaAsientos.className = 'info-row';
            // Obtener los asientos de manera más robusta
            let asientosTexto = '';
            if (r.asientos && r.asientos !== '' && r.asientos !== null) {
                asientosTexto = r.asientos;
            } else if (r.detalles_asientos) {
                asientosTexto = r.detalles_asientos;
            } else if (r.cantidad_boletos) {
                asientosTexto = `${r.cantidad_boletos} asiento(s)`;
            } else if (r.cantidad_asientos) {
                asientosTexto = `${r.cantidad_asientos} asiento(s)`;
            } else {
                asientosTexto = 'Información no disponible';
            }
            filaAsientos.innerHTML = `<span class="material-symbols-outlined">event_seat</span> <span>Asientos: ${asientosTexto}</span>`;

            const filaSala = document.createElement('div');
            filaSala.className = 'info-row';
            filaSala.innerHTML = `<span class="material-symbols-outlined">location_on</span> <span>Sala: ${r.sala || ''}</span>`;

            const filaPrecio = document.createElement('div');
            filaPrecio.className = 'info-row precio';
            const total = r.total || (r.precio && r.cantidad_asientos ? (Number(r.precio) * Number(r.cantidad_asientos)) : 0);
            filaPrecio.innerHTML = `<span class="material-symbols-outlined">payments</span> <span>Total: <strong>$${Number(total).toLocaleString('es-CO')}</strong></span>`;

            info.appendChild(title);
            info.appendChild(filaFecha);
            info.appendChild(filaHora);
            info.appendChild(filaAsientos);
            info.appendChild(filaSala);
            info.appendChild(filaPrecio);

            const actions = document.createElement('div');
            actions.className = 'reserva-actions';

            const btnDownload = document.createElement('button');
            btnDownload.className = 'btn-descargar';
            btnDownload.innerHTML = `<span class="material-symbols-outlined">download</span> ${r.id_reserva && String(r.id_reserva).toString().startsWith('RES-') ? 'Descargar ticket' : 'Ver ticket'}`;
            btnDownload.addEventListener('click', () => {
                alert('Funcionalidad de ticket no implementada en esta versión.');
            });

            const btnCancel = document.createElement('button');
            btnCancel.className = 'btn-cancelar';
            btnCancel.innerHTML = `<span class="material-symbols-outlined">cancel</span> Cancelar reserva`;
            // Solo permitir cancelar si el objeto tiene id_reserva (reserva real) y estado activa
            if (r.id_reserva && (r.estado === 'activa' || r.estado === 'pendiente')) {
                btnCancel.addEventListener('click', () => cancelarReserva(r.id_reserva));
            } else {
                btnCancel.disabled = true;
                btnCancel.title = 'No se puede cancelar una venta confirmada desde aquí';
            }

            actions.appendChild(btnDownload);
            actions.appendChild(btnCancel);

            content.appendChild(left);
            content.appendChild(info);
            content.appendChild(actions);

            card.appendChild(status);
            card.appendChild(content);

            contenedor.appendChild(card);
        });

    } catch (err) {
        console.error('Error cargando reservas/ventas:', err);
        if (noReservas) noReservas.style.display = 'block';
    }
}

// Helper: intenta varios endpoints para obtener ventas/ventas del usuario
async function fetchVentasForUser() {
    const endpoints = ['mis_ventas', 'ventas', 'misventas', 'ventas_cliente', 'historial_compras']; // Se agrega 'historial_compras'
    for (const ep of endpoints) {
        try {
            const resp = await fetch(`${API_BASE}?accion=${ep}`, { credentials: 'include' });
            if (!resp.ok) continue;
            const json = await resp.json();
            if (json.exito && Array.isArray(json.datos)) {
                return json.datos;
            }
        } catch (e) {
            // seguir al siguiente
        }
    }
    return [];
}

// ========================================
// RENDERIZAR CARTELERA 
// ========================================
function renderizarCartelera(peliculas) {
    const grid = document.querySelector('.movies-grid');
    if(!grid) return;

    // FILTRAR solo películas con funciones futuras
    const peliculasConFuncionesFuturas = peliculas.filter(pelicula => {
        if (!pelicula.funciones || pelicula.funciones.length === 0) return false;
        
        const funcionesFuturas = filtrarFuncionesFuturas(pelicula.funciones);
        pelicula.funciones = funcionesFuturas; // Actualizar con solo funciones futuras
        return funcionesFuturas.length > 0;
    });

    if (peliculasConFuncionesFuturas.length === 0) {
        grid.innerHTML = '<p class="no-movies">No hay funciones disponibles en este momento</p>';
        return;
    }

    grid.innerHTML = peliculasConFuncionesFuturas.map(pelicula => {
        const id = pelicula.id_pelicula;
        peliculasCache[id] = pelicula;

        const primeraFuncion = pelicula.funciones[0]; // Ya está filtrada
        const imagenNombre = normalizarNombreImagen(pelicula.nombre);

        return `
            <div class="movie-card" data-pelicula-id="${id}" onclick="abrirDetallesPelicula(${id})">
                <img 
                    src="../../images/Peliculas_Cartelera/${imagenNombre}.jpg" 
                    alt="${pelicula.nombre}"
                    onerror="this.src='../../images/Logo.svg'"
                />
                <h3 class="data-titulo">${pelicula.nombre}</h3>
                <div class="movie-actions">
                    <button 
                        class="btn-view" 
                        onclick="event.stopPropagation(); abrirDetallesPelicula(${id})"
                    >
                        <span class="material-symbols-outlined">visibility</span>
                        Ver detalles
                    </button>
                    <button 
                        class="btn-reservar" 
                        onclick="event.stopPropagation(); irAReservar(${id})"
                    >
                        Reservar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}


// RENDERIZAR PROMOCIONES 

function renderizarPromociones(peliculas) {
    const grid = document.querySelector('.movies-grid');
    if(!grid) return;

    // FILTRAR solo películas con funciones futuras
    const peliculasConFuncionesFuturas = peliculas.filter(pelicula => {
        if (!pelicula.funciones || pelicula.funciones.length === 0) return false;
        const funcionesFuturas = filtrarFuncionesFuturas(pelicula.funciones);
        pelicula.funciones = funcionesFuturas;
        return funcionesFuturas.length > 0;
    });

    if (peliculasConFuncionesFuturas.length === 0) {
        grid.innerHTML = '<p class="no-movies">No hay promociones disponibles en este momento</p>';
        return;
    }

    grid.innerHTML = peliculasConFuncionesFuturas.map(pelicula => {
        const id = pelicula.id_pelicula;
        peliculasCache[id] = pelicula;

        const primeraFuncion = pelicula.funciones[0]; // Ya está filtrada
        const porcentajeDescuento = primeraFuncion.porcentaje_descuento || 0;
        const imagenNombre = normalizarNombreImagen(pelicula.nombre);

        return `
            <div class="movie-card promo-card" data-pelicula-id="${id}" onclick="abrirDetallesPelicula(${id})">
                <div class="promo-badge">Hoy en descuento del ${porcentajeDescuento}%</div>
                <img 
                    src="../../images/Peliculas_Cartelera/${imagenNombre}.jpg" 
                    alt="${pelicula.nombre}"
                    onerror="this.src='../../images/Logo.svg'"
                />
                <h3 class="data-titulo">${pelicula.nombre}</h3>
                <div class="precio-section">
                    <span class="precio-antes">$${parseFloat(primeraFuncion.precio || 0).toLocaleString('es-CO')}</span>
                    <span class="precio-ahora">$${parseFloat(primeraFuncion.precio_final || 0).toLocaleString('es-CO')}</span>
                </div>
                <div class="movie-actions">
                    <button 
                        class="btn-view" 
                        onclick="event.stopPropagation(); abrirDetallesPelicula(${id})"
                    >
                        <span class="material-symbols-outlined">visibility</span>
                        Ver detalles
                    </button>
                    <button 
                        class="btn-reservar" 
                        onclick="event.stopPropagation(); irAReservar(${id})"
                    >
                        Reservar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// MODAL DE DETALLES DE PELÍCULA
// ========================================
function abrirDetallesPelicula(idPelicula) {
    const pelicula = peliculasCache[idPelicula];
    if (!pelicula) return;

    const modal = document.getElementById("movieModal");
    if (!modal) return;

    // Llenar datos del modal
    document.getElementById("modalMovieTitle").textContent = pelicula.nombre;
    document.getElementById("modalSynopsis").textContent = pelicula.sipnosis || "Sin sinopsis disponible";
    document.getElementById("modalGenero").textContent = pelicula.genero || "N/A";
    document.getElementById("modalClassification").textContent = pelicula.clasificacion || "N/A";
    document.getElementById("modalCast").textContent = pelicula.reparto || "N/A";
    document.getElementById("modalDirector").textContent = pelicula.director || "N/A";
    document.getElementById("modalDuracion").textContent = pelicula.duracion || "N/A";
    document.getElementById("modalEstreno").textContent = pelicula.fecha_estreno || "N/A";

    // Configurar imagen
    const imagenNombre = normalizarNombreImagen(pelicula.nombre);
    const imgElement = document.getElementById("modalMovieImage");
    imgElement.src = `../../images/Peliculas_Cartelera/${imagenNombre}.jpg`;
    imgElement.alt = pelicula.nombre;
    imgElement.onerror = function() { this.src = '../../images/Logo.svg'; };

    modal.style.display = "block";
}

function cerrarDetallesPelicula() {
    const modal = document.getElementById('movieModal');
    if(modal) {
        modal.style.display = 'none';
    }
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const modal = document.getElementById('movieModal');
    if(event.target === modal) {
        cerrarDetallesPelicula();
    }
};

// ========================================
// RESERVAS - CANCELAR RESERVA
// ========================================
async function cancelarReserva(id_reserva) {
    if(!confirm('¿Deseas cancelar esta reserva?')) return;

    try {
        const respuesta = await fetch(`${API_URL}?accion=cancelar_reserva`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_reserva })
        });

        const datos = await respuesta.json();

        if (datos.exito) {
            alert("Reserva cancelada exitosamente");
            cargarReservas();
        } else {
            alert("Error: " + datos.mensaje);
        }
    } catch (error) {
        console.error("Error al cancelar reserva:", error);
        alert("Error al cancelar la reserva");
    }
}

function descargarTicket(id_reserva) {
    alert('Descargando ticket #' + id_reserva);
}

// ========================================
// NAVEGACIÓN
// ========================================
function abrirPerfil(e) {
    if(e) e.preventDefault();
    // usar el nombre de archivo real `perfil.html` (está en el mismo directorio `src/mod-cliente`)
    window.location.href = 'perfil.html';
}

function irACartelera() {
    window.location.href = 'lobby-cliente.html';
}

function irAPromociones() {
    window.location.href = 'promociones.html';
}

function irAReservas() {
    window.location.href = 'mis-reservas.html';
}

function irACarrito() {
    window.location.href = 'carrito.html';
}

function irAContacto() {
    window.location.href = 'contactanos.html';
}

function irAReservar(id_pelicula) {
    sessionStorage.setItem('id_pelicula', id_pelicula);
    
    // Guardar el nombre de la película inmediatamente si está en cache
    const pelicula = peliculasCache[id_pelicula];
    if (pelicula && pelicula.nombre) {
        sessionStorage.setItem("pelicula_nombre", pelicula.nombre);
        console.log("💾 Nombre guardado en sessionStorage:", pelicula.nombre);
    }
    
    // Guardar funciones futuras en cache para la página de reserva
    if (pelicula && pelicula.funciones) {
        const funcionesFuturas = filtrarFuncionesFuturas(pelicula.funciones);
        if (funcionesFuturas.length > 0) {
            sessionStorage.setItem("funciones_cache", JSON.stringify(funcionesFuturas));
        }
    }
    
    window.location.href = 'reservar-pelicula.html';
}

function redirigirAlLogin() {
    window.location.href = '../../src/login.html';
}

// ========================================
// MENÚ DESPLEGABLE
// ========================================
function configurarMenu() {
    const clienteBox = document.querySelector('.cliente-box');
    
    if(clienteBox) {
        clienteBox.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = clienteBox.querySelector('.menu-cliente');
            if(menu) {
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        });

        document.addEventListener('click', () => {
            const menu = clienteBox.querySelector('.menu-cliente');
            if(menu) {
                menu.style.display = 'none';
            }
        });
    }
}

// ========================================
// CHATBOT
// ========================================
function configurarChatbot() {
    const chatbotBtn = document.getElementById('chatbotBtn');
    const chatbotClose = document.getElementById('chatbotClose');
    const chatbotWindow = document.getElementById('chatbotWindow');

    if(chatbotBtn && chatbotWindow) {
        chatbotBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const display = chatbotWindow.style.display;
            const opening = display === 'none' || display === '';
            chatbotWindow.style.display = opening ? 'flex' : 'none';

            if(opening) {
                renderChatbotActions();
            }
        });
    }

    if(chatbotClose && chatbotWindow) {
        chatbotClose.addEventListener('click', () => {
            chatbotWindow.style.display = 'none';
        });
    }

    document.addEventListener('click', (e) => {
        if(chatbotWindow && !chatbotWindow.contains(e.target) && !chatbotBtn?.contains(e.target)) {
            chatbotWindow.style.display = 'none';
        }
    });
}

// Resto del código del chatbot permanece igual...
function renderChatbotActions() {
    const chatbotBody = document.querySelector('#chatbotWindow .chatbot-body');
    if(!chatbotBody) return;

    chatbotBody.innerHTML = `
        <div class="chat-actions">
            <button class="chat-action" data-action="recomendar">Recomiéndame películas</button>
            <button class="chat-action" data-action="promociones">Promociones</button>
            <button class="chat-action" data-action="mis_reservas">Mis reservas</button>
            <button class="chat-action" data-action="contacto">Contacto</button>
        </div>
        <div class="chat-response" aria-live="polite"></div>
    `;

    chatbotBody.querySelectorAll('.chat-action').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const action = btn.getAttribute('data-action');
            showChatMessage(btn.textContent, 'user');
            await handleChatAction(action);
        });
    });
}

async function handleChatAction(action) {
    const responseContainer = document.querySelector('#chatbotWindow .chat-response');
    if(!responseContainer) return;
    responseContainer.innerHTML = '';

    try {
        if(action === 'promociones') {
            showChatMessage('Buscando promociones...', 'bot');
            const res = await fetch(`${API_URL}?accion=promociones`, { credentials: 'include' });
            const datos = await res.json();
            if(datos.exito && datos.datos) {
                showChatMessage('Estas son las promociones actuales:', 'bot');
                renderMovieList(datos.datos, responseContainer);
            } else {
                showChatMessage(datos.mensaje || 'No se encontraron promociones', 'bot');
            }
        } else if(action === 'mis_reservas') {
            showChatMessage('Cargando tus reservas...', 'bot');
            const res = await fetch(`${API_URL}?accion=mis_reservas`, { credentials: 'include' });
            const datos = await res.json();
            if(datos.exito && datos.datos) {
                if(datos.datos.length === 0) {
                    showChatMessage('No tienes reservas registradas.', 'bot');
                } else {
                    showChatMessage('Estas son tus reservas:', 'bot');
                    renderReservasList(datos.datos, responseContainer);
                }
            } else {
                showChatMessage(datos.mensaje || 'Error al obtener reservas', 'bot');
            }
        } else if(action === 'recomendar') {
            showChatMessage('Buscando recomendaciones basadas en tu historial...', 'bot');
            const r1 = await fetch(`${API_URL}?accion=mis_reservas`, { credentials: 'include' });
            const reservasJson = await r1.json();
            const reservadoNombres = (reservasJson.exito && reservasJson.datos) ? reservasJson.datos.map(r => r.pelicula).filter(Boolean) : [];

            const r2 = await fetch(`${API_URL}?accion=cartelera`, { credentials: 'include' });
            const carteleraJson = await r2.json();
            if(carteleraJson.exito && carteleraJson.datos) {
                const recomendaciones = carteleraJson.datos.filter(p => !reservadoNombres.includes(p.nombre)).slice(0,5);
                if(recomendaciones.length === 0) {
                    showChatMessage('Ya viste la mayoría de títulos; aquí hay algunas en cartelera:', 'bot');
                    renderMovieList(carteleraJson.datos.slice(0,5), responseContainer);
                } else {
                    showChatMessage('Te recomiendo estas películas:', 'bot');
                    renderMovieList(recomendaciones, responseContainer);
                }
            } else {
                showChatMessage('No pude obtener la cartelera para recomendar.', 'bot');
            }
        } else if(action === 'contacto') {
            showChatMessage('Puedes escribirnos desde la página de contacto o llamarnos al 01-800-0000.', 'bot');
            responseContainer.innerHTML += `<p><a href="contactanos.html">Ir a Contacto</a></p>`;
        }
    } catch(err) {
        console.error(err);
        showChatMessage('Ocurrió un error. Intenta de nuevo más tarde.', 'bot');
    }
}

function showChatMessage(text, who = 'bot') {
    const chatBody = document.querySelector('#chatbotWindow .chatbot-body');
    if(!chatBody) return;

    const wrapper = document.createElement('div');
    wrapper.className = who === 'user' ? 'chat-msg user' : 'chat-msg bot';
    wrapper.textContent = text;
    const responseContainer = chatBody.querySelector('.chat-response');
    if(responseContainer) responseContainer.appendChild(wrapper);
    else chatBody.appendChild(wrapper);
}

function renderMovieList(peliculas, container) {
    if(!container) return;
    const list = document.createElement('div');
    list.className = 'chat-movie-list';
    peliculas.forEach(p => {
        const item = document.createElement('div');
        item.className = 'chat-movie-item';
        item.innerHTML = `
            <strong>${p.nombre}</strong><br/>
            <small>${p.sipnosis ? p.sipnosis.substring(0,100) + '...' : ''}</small>
        `;
        list.appendChild(item);
    });
    container.appendChild(list);
}

function renderReservasList(reservas, container) {
    if(!container) return;
    const list = document.createElement('div');
    list.className = 'chat-reserva-list';
    reservas.forEach(r => {
        const item = document.createElement('div');
        item.className = 'chat-reserva-item';
        item.innerHTML = `
            <strong>${r.pelicula || '—'}</strong> — ${r.fecha_funcion || '—' } - ${r.hora || '-'}<br/>
            <small>Asientos: ${r.asientos || '—'} — Estado: ${r.estado || '—'}</small>
        `;
        list.appendChild(item);
    });
    container.appendChild(list);
}


// ========================================
// EVENTOS GLOBALES
// ========================================
function configurarEventosGlobales() {
    document.querySelectorAll('.boton-pago').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.boton-pago').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
        });
    });

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
function normalizarNombreImagen(nombre) {
    if(!nombre) return 'placeholder';
    return nombre.replace(/[:%\*|\"<>]/g, '').trim();
}

function mostrarMensajeVacio(mensaje) {
    const contenedor = document.querySelector('.reservas-container') || 
                      document.querySelector('.movies-grid');
    if(contenedor) {
        contenedor.innerHTML = `<p style="text-align: center; padding: 20px;">${mensaje}</p>`;
    }
}

function formatearPrecio(precio) {
    return parseFloat(precio).toLocaleString('es-CO');
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatearHora(fecha) {
    return new Date(fecha).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ========================================
// ALIAS DE COMPATIBILIDAD
// ========================================
const filtro = () => console.log('Filtros - Por implementar');
const busquedas = () => console.log('Búsqueda - Por implementar');
const openMovieModal = abrirDetallesPelicula;
const closeMovieModal = cerrarDetallesPelicula;

// ========================================
// DEBUG
// ========================================
function mostrarEstado() {
    console.log("Estado Global:", {
        url_api: API_URL,
        peliculas_cache: Object.keys(peliculasCache).length,
        session_storage: sessionStorage,
    });
}

function calcularTotal() {
    let total = 0;
    asientosSeleccionados.forEach((id) => {
        if (asientosDiscapacidad.includes(id)) {
            total += 10000;
        } else {
            total += 15000;
        }
    });
    return total;
}

// Exportar funciones globalmente para HTML
window.cargarReservas = cargarReservas;
window.cancelarReserva = cancelarReserva;
window.irACarrito = irACarrito;
window.abrirDetallesPelicula = abrirDetallesPelicula;
window.cerrarDetallesPelicula = cerrarDetallesPelicula;
window.irAReservar = irAReservar;