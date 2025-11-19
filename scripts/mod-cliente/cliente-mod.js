/**
 * Script principal para todas las páginas del módulo cliente
 * Maneja: Sesión, navegación, chatbot, eventos globales
 */

const API_URL = '../../backend/api/index.php';

// ========================================
// INICIALIZACIÓN GLOBAL
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    verificarSesionGlobal();
    configurarChatbot();
    configurarMenu();
});

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
            // No hay sesión activa, redirigir al login si no estamos en páginas públicas
            const paginasPublicas = ['login.html', 'registro.html'];
            const paginaActual = window.location.pathname.split('/').pop();
            
            if(!paginasPublicas.includes(paginaActual)) {
                // Permitir solo si es login o registro
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
            // Limpiar sessionStorage
            sessionStorage.clear();
            
            // Redirigir al login
            window.location.href = '../../src/login.html';
        }
    } catch(error) {
        console.error('Error al cerrar sesión:', error);
        alert('Error al cerrar sesión');
    }
}

function redirigirAlLogin() {
    window.location.href = '../../src/login.html';
}

// ========================================
// NAVEGACIÓN
// ========================================
function abrirPerfil(e) {
    if(e) e.preventDefault();
    window.location.href = 'perfil-cliente.html';
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

        // Cerrar menú al hacer click en el documento
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
            chatbotWindow.style.display = display === 'none' || display === '' ? 'flex' : 'none';
        });
    }

    if(chatbotClose && chatbotWindow) {
        chatbotClose.addEventListener('click', () => {
            chatbotWindow.style.display = 'none';
        });
    }

    // Cerrar chatbot al hacer click fuera
    document.addEventListener('click', (e) => {
        if(chatbotWindow && !chatbotWindow.contains(e.target) && !chatbotBtn?.contains(e.target)) {
            chatbotWindow.style.display = 'none';
        }
    });
}

// ========================================
// NOTIFICACIONES
// ========================================
function mostrarNotificacion(mensaje, tipo = 'info') {
    const clases = {
        'exito': 'background: #4caf50; color: white;',
        'error': 'background: #f44336; color: white;',
        'info': 'background: #2196f3; color: white;',
        'advertencia': 'background: #ff9800; color: white;'
    };

    const estiloNotif = clases[tipo] || clases['info'];

    console.log(`%c${mensaje}`, estiloNotif);
    
    // Implementar notificación visual (opcional)
    // const notif = document.createElement('div');
    // notif.textContent = mensaje;
    // notif.style.cssText = `
    //     position: fixed;
    //     top: 20px;
    //     right: 20px;
    //     padding: 15px;
    //     border-radius: 5px;
    //     z-index: 9999;
    //     ${estiloNotif}
    // `;
    // document.body.appendChild(notif);
    // setTimeout(() => notif.remove(), 3000);
}

// ========================================
// UTILITARIOS
// ========================================
function formatearPrecio(precio) {
    return parseFloat(precio).toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
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
// FUNCIONES ALIAS (COMPATIBILIDAD)
// ========================================
const filtro = () => console.log('Filtros - Por implementar');
const busquedas = () => console.log('Búsqueda - Por implementar');
const openMovieModal = () => console.log('Modal - No disponible');
const closeMovieModal = () => console.log('Modal - No disponible');

// ========================================
// HELPERS DE DEBUG
// ========================================
function mostrarEstado() {
    console.log('Estado Global:', {
        url_api: API_URL,
        session_storage: sessionStorage,
        usuario_id: sessionStorage.getItem('usuario_id')
    });
}