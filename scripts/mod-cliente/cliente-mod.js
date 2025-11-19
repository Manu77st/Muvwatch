/**
 * Script principal para todas las páginas del módulo cliente
 * Maneja: Sesión, navegación, chatbot, eventos globales
 */

const API_URL = "../../backend/api/index.php";
// Compatibilidad: algunos scripts anteriores usan `API_BASE`
const API_BASE = API_URL;

// Compatibilidad con otra versión del archivo (alias a normalizarNombreImagen)
function filenameFromTitle(title) {
    return normalizarNombreImagen(title);
}

// Cache de películas para modal
let peliculasCache = {};

// ========================================
// INICIALIZACIÓN GLOBAL
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  verificarSesionGlobal();
  configurarChatbot();
  configurarMenu();
  cargarContenidoPrincipal();
  configurarEventosGlobales();
});

// Configurar preselección de función desde el lobby-clientes
function configurarPreseleccionReserva() {
  document.addEventListener(
    "click",
    (e) => {
      try {
        const target = e.target.closest && e.target.closest(".btn-reservar");
        if (!target) return;

        // Buscar el contenedor .movie-card más cercano
        const card = target.closest(".movie-card");
        if (!card) return;

        const peliculaId = card.getAttribute("data-pelicula-id");
        if (!peliculaId) return;

        const pelicula = peliculasCache[peliculaId];
        if (!pelicula) return;

        // FILTRAR solo funciones futuras
        const funcionesFuturas = (pelicula.funciones || [])
          .filter((funcion) => new Date(funcion.fecha_funcion) > new Date())
          .sort(
            (a, b) => new Date(a.fecha_funcion) - new Date(b.fecha_funcion)
          );

        if (funcionesFuturas.length === 0) {
          alert("No hay funciones disponibles para esta película");
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
          console.debug("Preselección guardada:", {
            id_pelicula: peliculaId,
            id_funcion_preseleccionada,
          });
        }

        // También guardar id_pelicula por compatibilidad
        sessionStorage.setItem("id_pelicula", String(peliculaId));
        console.debug("id_pelicula guardado en sessionStorage:", peliculaId);
      } catch (err) {
        // no bloquear navegación por errores de este handler
        console.error("Error preseleccionando función:", err);
      }
    },
    true
  ); // usar captura para ejecutarse antes de handlers en bubbling
}

// Ejecutar la configuración al cargar el script
configurarPreseleccionReserva();

// ========================================
// SESIÓN Y AUTENTICACIÓN
// ========================================
async function verificarSesionGlobal() {
  try {
    const respuesta = await fetch(`${API_URL}?accion=verificar_sesion`, {
      credentials: "include",
    });
    const datos = await respuesta.json();

    if (datos.exito && datos.datos) {
      actualizarMenuUsuario(datos.datos);
    } else {
      // Permitir acceso a páginas públicas
      const paginasPublicas = ["login.html", "registro.html"];
      const paginaActual = window.location.pathname.split("/").pop();

      if (!paginasPublicas.includes(paginaActual)) {
        // Redirigir solo si no está en páginas públicas
        if (
          !window.location.href.includes("login") &&
          !window.location.href.includes("registro")
        ) {
          // redirigirAlLogin();
        }
      }
    }
  } catch (error) {
    console.error("Error al verificar sesión:", error);
  }
}

function actualizarMenuUsuario(usuario) {
  const clienteBox = document.querySelector(".cliente-box");

  if (clienteBox) {
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

  if (!confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}?accion=logout`, {
      method: "POST",
      credentials: "include",
    });
    const datos = await respuesta.json();

    if (datos.exito) {
      sessionStorage.clear();
      window.location.href = "../../src/login.html";
    }
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    alert("Error al cerrar sesión");
  }
}

// ========================================
// CARGAR CONTENIDO SEGÚN PÁGINA
// ========================================
function cargarContenidoPrincipal() {
  // Detectar página actual
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

    if (datos.exito && datos.datos) {
      renderizarCartelera(datos.datos);
    } else {
      console.warn("No se pudieron cargar las películas");
    }
  } catch (error) {
    console.error("Error cargando cartelera:", error);
  }
}

// ========================================
// CARGAR PROMOCIONES
// ========================================
async function cargarPromociones() {
  try {
    const respuesta = await fetch(`${API_URL}?accion=promociones`);
    const datos = await respuesta.json();

    if (datos.exito && datos.datos) {
      renderizarPromociones(datos.datos);
    } else {
      console.warn("No hay promociones disponibles");
    }
  } catch (error) {
    console.error("Error cargando promociones:", error);
  }
}

// ========================================
// CARGAR RESERVAS (CARRITO) - ACTUALIZADO
// ========================================
async function cargarReservas() {
  const contenedor = document.querySelector('.reservas-container');
  const noReservas = contenedor ? contenedor.querySelector('.no-reservas') : null;

  try {
    const res = await fetch(`${API_BASE}?accion=mis_reservas`, { credentials: 'include' });
    const j = await res.json();
    if (!j.exito) {
      console.warn('No se pudo obtener reservas:', j.mensaje);
      if (noReservas) noReservas.style.display = 'block';
      return;
    }

    const datos = Array.isArray(j.datos) ? j.datos : [];
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
      status.className = 'reserva-status ' + (r.estado === 'activa' ? 'activa' : r.estado);
      status.innerHTML = `<span class="material-symbols-outlined">${r.estado === 'activa' ? 'check_circle' : 'calendar_today'}</span> ${r.estado === 'activa' ? 'Confirmada' : r.estado}`;

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
      filaAsientos.innerHTML = `<span class="material-symbols-outlined">event_seat</span> <span>Asientos: ${r.asientos || ''}</span>`;

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
      btnDownload.innerHTML = `<span class="material-symbols-outlined">download</span> Descargar ticket`;
      btnDownload.addEventListener('click', () => {
        alert('Descarga de ticket no implementada en esta versión.');
      });

      const btnCancel = document.createElement('button');
      btnCancel.className = 'btn-cancelar';
      btnCancel.innerHTML = `<span class="material-symbols-outlined">cancel</span> Cancelar reserva`;
      btnCancel.addEventListener('click', () => cancelarReserva(r.id_reserva));

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
    console.error('Error cargando reservas:', err);
    if (noReservas) noReservas.style.display = 'block';
  }
}

// ========================================
// RENDERIZAR CARTELERA - CORREGIDO
// ========================================
function renderizarCartelera(peliculas) {
  const grid = document.querySelector(".movies-grid");
  if (!grid) return;

  // FILTRAR solo películas con funciones disponibles Y futuras
  const peliculasConFunciones = peliculas.filter((pelicula) => {
    if (!pelicula.funciones || pelicula.funciones.length === 0) return false;

    // Filtrar funciones futuras
    const funcionesFuturas = pelicula.funciones.filter(
      (funcion) => new Date(funcion.fecha_funcion) > new Date()
    );

    // Actualizar las funciones de la película con solo las futuras
    pelicula.funciones = funcionesFuturas;

    return funcionesFuturas.length > 0;
  });

  if (peliculasConFunciones.length === 0) {
    grid.innerHTML =
      '<p class="no-movies">No hay funciones disponibles en este momento</p>';
    return;
  }

  grid.innerHTML = peliculasConFunciones
    .map((pelicula) => {
      const id = pelicula.id_pelicula;
      peliculasCache[id] = pelicula;

      const primeraFuncion = pelicula.funciones[0];
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
          <button class="btn-view" onclick="event.stopPropagation(); abrirDetallesPelicula(${id})">
            <span class="material-symbols-outlined">visibility</span>
            Ver detalles
          </button>
          <button class="btn-reservar" onclick="event.stopPropagation(); irAReservar(${id})">
            Reservar
          </button>
        </div>
      </div>
    `;
    })
    .join("");
}

// ========================================
// RENDERIZAR PROMOCIONES
// ========================================
function renderizarPromociones(peliculas) {
  const grid = document.querySelector(".movies-grid");
  if (!grid) return;

  grid.innerHTML = peliculas
    .map((pelicula) => {
      const id = pelicula.id_pelicula;
      peliculasCache[id] = pelicula;

      // Filtrar funciones futuras para promociones también
      const funcionesFuturas =
        pelicula.funciones
          ?.filter((funcion) => new Date(funcion.fecha_funcion) > new Date())
          ?.sort(
            (a, b) => new Date(a.fecha_funcion) - new Date(b.fecha_funcion)
          ) || [];

      if (funcionesFuturas.length === 0) return "";

      const primeraFuncion = funcionesFuturas[0];
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
                    <span class="precio-antes">$${parseFloat(
                      primeraFuncion.precio || 0
                    ).toLocaleString("es-CO")}</span>
                    <span class="precio-ahora">$${parseFloat(
                      primeraFuncion.precio_final || 0
                    ).toLocaleString("es-CO")}</span>
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
    })
    .join("");
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
  const modal = document.getElementById("movieModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Cerrar modal al hacer click fuera
window.onclick = function (event) {
  const modal = document.getElementById("movieModal");
  if (event.target === modal) {
    cerrarDetallesPelicula();
  }
};

// ========================================
// RESERVAS - CANCELAR RESERVA
// ========================================
async function cancelarReserva(id_reserva) {
  if (!confirm("¿Deseas cancelar esta reserva?")) return;

  try {
    const respuesta = await fetch(`${API_URL}?accion=cancelar_reserva`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_reserva }),
    });

    const datos = await respuesta.json();

    if (datos.exito) {
      alert("Reserva cancelada exitosamente");
      cargarReservas(); // Recargar la lista
    } else {
      alert("Error: " + datos.mensaje);
    }
  } catch (error) {
    console.error("Error al cancelar reserva:", error);
    alert("Error al cancelar la reserva");
  }
}

function descargarTicket(id_reserva) {
  alert("Descargando ticket #" + id_reserva);
  // Implementar descarga de PDF en el futuro
}

// ========================================
// NAVEGACIÓN
// ========================================
function abrirPerfil(e) {
  if (e) e.preventDefault();
  window.location.href = "perfil-cliente.html";
}

function irACartelera() {
  window.location.href = "lobby-cliente.html";
}

function irAPromociones() {
  window.location.href = "promociones.html";
}

function irAReservas() {
  window.location.href = "mis-reservas.html";
}

function irACarrito() {
  window.location.href = "carrito.html";
}

function irAContacto() {
  window.location.href = "contactanos.html";
}

function irAReservar(id_pelicula) {
  sessionStorage.setItem("id_pelicula", id_pelicula);
  try {
    // Exponer una variable global estática para uso inmediato por la página
    // de reserva (evita depender únicamente de sessionStorage)
    window.__selectedPeliculaId = String(id_pelicula);

    // Intentar capturar el nombre desde la cache global si está disponible
    const nombre =
      window.peliculasCache && window.peliculasCache[id_pelicula]
        ? window.peliculasCache[id_pelicula].nombre
        : null;
    if (nombre) {
      window.__selectedPeliculaName = nombre;
      sessionStorage.setItem("pelicula_nombre", String(nombre));
    }

    // Si tenemos la película en cache global, guardamos sus funciones para
    // que la página de reservar las reutilice sin hacer otra petición.
    if (window.peliculasCache && window.peliculasCache[id_pelicula]) {
      const funciones = window.peliculasCache[id_pelicula].funciones || [];
      // FILTRAR solo funciones futuras antes de guardar en cache
      const funcionesFuturas = funciones.filter(
        (funcion) => new Date(funcion.fecha_funcion) > new Date()
      );
      sessionStorage.setItem(
        "funciones_cache",
        JSON.stringify(funcionesFuturas)
      );
    }
    // Guardar también el id en sessionStorage para compatibilidad
    sessionStorage.setItem("id_pelicula", String(id_pelicula));
  } catch (err) {
    console.debug("No se pudo guardar funciones en sessionStorage:", err);
  }
  window.location.href = "reservar-pelicula.html";
}

function redirigirAlLogin() {
  window.location.href = "../../src/login.html";
}

// ========================================
// MENÚ DESPLEGABLE
// ========================================
function configurarMenu() {
  const clienteBox = document.querySelector(".cliente-box");

  if (clienteBox) {
    clienteBox.addEventListener("click", (e) => {
      e.stopPropagation();
      const menu = clienteBox.querySelector(".menu-cliente");
      if (menu) {
        menu.style.display = menu.style.display === "block" ? "none" : "block";
      }
    });

    document.addEventListener("click", () => {
      const menu = clienteBox.querySelector(".menu-cliente");
      if (menu) {
        menu.style.display = "none";
      }
    });
  }
}

// ========================================
// CHATBOT
// ========================================
function configurarChatbot() {
  const chatbotBtn = document.getElementById("chatbotBtn");
  const chatbotClose = document.getElementById("chatbotClose");
  const chatbotWindow = document.getElementById("chatbotWindow");

  if (chatbotBtn && chatbotWindow) {
    chatbotBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const display = chatbotWindow.style.display;
      chatbotWindow.style.display =
        display === "none" || display === "" ? "flex" : "none";
    });
  }

  if (chatbotClose && chatbotWindow) {
    chatbotClose.addEventListener("click", () => {
      chatbotWindow.style.display = "none";
    });
  }

  document.addEventListener("click", (e) => {
    if (
      chatbotWindow &&
      !chatbotWindow.contains(e.target) &&
      !chatbotBtn?.contains(e.target)
    ) {
      chatbotWindow.style.display = "none";
    }
  });
}

// ========================================
// EVENTOS GLOBALES
// ========================================
function configurarEventosGlobales() {
  // Botones de métodos de pago
  document.querySelectorAll(".boton-pago").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".boton-pago")
        .forEach((b) => b.classList.remove("activo"));
      btn.classList.add("activo");
    });
  });

  // Búsqueda
  const inputBusqueda = document.getElementById("search-input");
  if (inputBusqueda) {
    inputBusqueda.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        busquedas();
      }
    });
  }
}

// ========================================
// UTILIDADES
// ========================================
function normalizarNombreImagen(nombre) {
  if (!nombre) return "placeholder";
  return nombre.replace(/[:%\*|\"<>]/g, "").trim();
}

function mostrarMensajeVacio(mensaje) {
  const contenedor =
    document.querySelector(".reservas-container") ||
    document.querySelector(".movies-grid");
  if (contenedor) {
    contenedor.innerHTML = `<p style="text-align: center; padding: 20px;">${mensaje}</p>`;
  }
}

function formatearPrecio(precio) {
  return parseFloat(precio).toLocaleString("es-CO");
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-CO", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatearHora(fecha) {
  return new Date(fecha).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ========================================
// ALIAS DE COMPATIBILIDAD
// ========================================
const filtro = () => console.log("Filtros - Por implementar");
const busquedas = () => console.log("Búsqueda - Por implementar");
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

// Calcular total
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