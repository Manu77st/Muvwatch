//Scripts para cliente - Módulo unificado

// ========== FUNCIONES DEL LOBBY ==========

// Filtro de películas
function filtro() {
    const contenedor = document.querySelector(".filtros");
    let panelExistente = document.querySelector(".filtros-panel");
  
    if (panelExistente) {
      panelExistente.remove();
      return;
    }
  
    const panel = document.createElement("div");
    panel.className = "filtros-panel";
    panel.innerHTML = `
      <button data-filter="todos">Todos</button>
      <button data-filter="promociones">Promociones</button>
      <button data-filter="destacadas">Destacadas</button>
    `;
  
    contenedor.appendChild(panel);
  
    // Cerrar al hacer clic fuera
    document.addEventListener("click", function cerrarPanel(e) {
      if (!contenedor.contains(e.target)) {
        panel.remove();
        document.removeEventListener("click", cerrarPanel);
      }
    });
  }
  
  // Búsqueda de películas
  function busquedas() {
    const resultados = document.getElementById('resultados');
    const input = document.getElementById('search-input');
    const busqueda = input.value.trim().toLowerCase();
    const peliculas = document.querySelectorAll('.movie-card');
  
    let coincidencias = 0;
  
    peliculas.forEach(pelicula => {
      const tituloElemento = pelicula.querySelector('h3'); 
      const titulo = tituloElemento.textContent.toLowerCase();
  
      if (titulo.includes(busqueda)) {
        pelicula.style.display = 'block';
        coincidencias++;
      } else {
        pelicula.style.display = 'none';
      }
    });
  
    if (busqueda === '') {
      resultados.innerHTML = '';
    } else if (coincidencias > 0) {
      resultados.innerHTML = `Resultados para: <strong>${busqueda}</strong>`;
    } else {
      resultados.innerHTML = `No se encontraron resultados para: <strong>${busqueda}</strong>`;
    }
  }
  
  // --- Cartelera dinámica desde backend ---
  const API_BASE = `${window.location.origin}/Muvwatch/backend/api/index.php`;
  let moviesCache = {};

  async function loadCartelera() {
    try {
      const res = await fetch(`${API_BASE}?accion=cartelera`, { method: 'GET', credentials: 'include' });
      const json = await res.json();
      if (json && json.exito && Array.isArray(json.datos)) {
        renderCartelera(json.datos);
      } else {
        console.warn('No hay datos de cartelera o la respuesta no es válida', json);
      }
    } catch (err) {
      console.error('Error cargando cartelera:', err);
    }
  }

  function filenameFromTitle(title) {
    if (!title) return '';
    // Crear nombre de archivo aproximado: quitar caracteres especiales básicos
    return title.replace(/[:\/\\\?\%\*\|\"<>]/g, '').trim();
  }

  function renderCartelera(peliculas) {
    const grid = document.querySelector('.movies-grid');
    if (!grid) return;
    grid.innerHTML = ''; // limpiar tarjetas estáticas

    peliculas.forEach(pel => {
      const id = pel.id_pelicula || pel.id || Math.random().toString(36).slice(2,9);
      moviesCache[id] = pel;

      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.peliculaId = id;
      card.addEventListener('click', () => openMovieModal(id));

      const img = document.createElement('img');
      // Intentar usar una imagen por nombre (fallback si no existe)
      const filename = filenameFromTitle(pel.nombre || pel.nombre_original || pel.title || 'poster');
      img.src = `../../images/Peliculas_Cartelera/${filename}.jpg`;
      img.alt = pel.nombre || 'Póster';
      img.onerror = function() { this.src = '../../images/Logo.svg'; };

      const h3 = document.createElement('h3');
      h3.className = 'data-titulo';
      h3.textContent = pel.nombre || pel.title || 'Sin título';

      const actions = document.createElement('div');
      actions.className = 'movie-actions';

      const btnView = document.createElement('button');
      btnView.className = 'btn-view';
      btnView.innerHTML = `<span class="material-symbols-outlined">visibility</span>Ver detalles`;
      btnView.addEventListener('click', (e) => { e.stopPropagation(); openMovieModal(id); });

      const btnReservar = document.createElement('button');
      btnReservar.className = 'btn-reservar';
      btnReservar.textContent = 'Reservar';
      btnReservar.addEventListener('click', (e) => {
        e.stopPropagation();
        // Si hay funciones asociadas, redirigir con id_funcion de la primera
        const funciones = pel.funciones || [];
        if (funciones.length > 0) {
          const id_funcion = funciones[0].id_funcion;
          window.location.href = `reservar-pelicula.html?id_funcion=${id_funcion}`;
        } else {
          // Redirigir por id_pelicula
          window.location.href = `reservar-pelicula.html?id_pelicula=${id}`;
        }
      });

      actions.appendChild(btnView);
      actions.appendChild(btnReservar);

      card.appendChild(img);
      card.appendChild(h3);
      card.appendChild(actions);

      grid.appendChild(card);
    });
  }
  
  // Modal de película
  function openMovieModal(movieId) {
    const modal = document.getElementById('movieModal');
    const pel = moviesCache[movieId];
    if (!pel) {
      // Intentar cargar desde API por id
      fetch(`${API_BASE}?accion=pelicula&id=${movieId}`)
        .then(r => r.json())
        .then(j => {
          if (j.exito && j.datos) {
            moviesCache[movieId] = j.datos;
            populateModal(j.datos);
            modal.style.display = 'block';
          }
        }).catch(err => console.error(err));
      return;
    }

    populateModal(pel);
    modal.style.display = 'block';
  }
  
function populateModal(pel) {
  const imageEl = document.getElementById('modalMovieImage');
  const titleEl = document.getElementById('modalMovieTitle');
  const originalEl = document.getElementById('modalOriginalName');
  const classEl = document.getElementById('modalClassification');
  const castEl = document.getElementById('modalCast');
  const dirEl = document.getElementById('modalDirector');
  const synEl = document.getElementById('modalSynopsis');

  const filename = filenameFromTitle(pel.nombre || pel.title || 'poster');
  if (imageEl) {
    imageEl.src = `../../images/Peliculas_Cartelera/${filename}.jpg`;
    imageEl.onerror = function() { this.src = '../../images/Logo.svg'; };
  }
  if (titleEl) titleEl.textContent = pel.nombre || pel.title || '';
  if (originalEl) originalEl.textContent = pel.nombre || '';
  if (classEl) classEl.textContent = pel.clasificacion || '';
  if (castEl) castEl.textContent = pel.reparto || '';
  if (dirEl) dirEl.textContent = pel.director || '';
  if (synEl) synEl.textContent = pel.sipnosis || '';
}
  function closeMovieModal() {
    document.getElementById("movieModal").style.display = "none";
  }
  
  // Cerrar modal al hacer clic fuera de él
  window.onclick = function(event) {
    const modal = document.getElementById('movieModal');
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  }
  
  // Menú cliente desplegable
  const clienteBox = document.getElementById("clienteBox");
  const menuCliente = document.getElementById("menuCliente");
  if (clienteBox && menuCliente) {
    clienteBox.onclick = function (e) {
      e.stopPropagation();
      // Soporte para ambos métodos (style.display y classList)
      if (menuCliente.style.display !== undefined) {
        menuCliente.style.display = menuCliente.style.display === "block" ? "none" : "block";
      } else {
        menuCliente.classList.toggle('show');
      }
    };
    
    document.body.addEventListener("click", function () {
      if (menuCliente.style.display !== undefined) {
        menuCliente.style.display = "none";
      } else {
        menuCliente.classList.remove('show');
      }
    });
  }
  
  // Chatbot
  const chatbotBtn = document.getElementById("chatbotBtn");
  const chatbotWindow = document.getElementById("chatbotWindow");
  const chatbotClose = document.getElementById("chatbotClose");
  if (chatbotBtn && chatbotWindow) {
    chatbotBtn.onclick = function () {
      chatbotWindow.style.display = "flex";
    };
  }
  if (chatbotClose && chatbotWindow) {
    chatbotClose.onclick = function () {
      chatbotWindow.style.display = "none";
    };
  }
  
  // ========== FUNCIONES DE RESERVA DE PELÍCULA ==========
  
  // Configuración de la sala
  const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const asientosPorBloque = 7;
  
  // Estado de los asientos (simulado)
  const asientosOcupados = ['A3', 'B5', 'C2', 'D4', 'E6'];
  const asientosDiscapacidad = ['H1', 'H7', 'H8', 'H14'];
  
  let asientosSeleccionados = [];
  let metodoPagoSeleccionado = null;
  
  // Generar asientos
  function generarAsientos() {
    const bloqueIzq = document.getElementById('bloqueAsientosIzquierda');
    const bloqueDer = document.getElementById('bloqueAsientosDerecha');
  
    if (!bloqueIzq || !bloqueDer) {
      return; // No está en la página de reserva
    }
  
    filas.forEach(fila => {
      // Bloque izquierdo (asientos 1-7)
      for (let i = 1; i <= asientosPorBloque; i++) {
        const id = `${fila}${i}`;
        const asiento = crearAsiento(id);
        bloqueIzq.appendChild(asiento);
      }
  
      // Bloque derecho (asientos 8-14)
      for (let i = 8; i <= 14; i++) {
        const id = `${fila}${i}`;
        const asiento = crearAsiento(id);
        bloqueDer.appendChild(asiento);
      }
    });
  }
  
  // Crear elemento de asiento
  function crearAsiento(id) {
    const div = document.createElement('div');
    div.className = 'asiento';
    div.dataset.id = id;
  
    const etiqueta = document.createElement('span');
    etiqueta.className = 'etiqueta-asiento';
    etiqueta.textContent = id;
  
    // Determinar estado del asiento
    if (asientosOcupados.includes(id)) {
      div.classList.add('asiento-ocupado');
    } else {
      div.classList.add('asiento-disponible');
    }
  
    if (asientosDiscapacidad.includes(id)) {
      div.classList.add('asiento-discapacidad');
    }
  
    div.appendChild(etiqueta);
  
    // Evento click
    if (!asientosOcupados.includes(id)) {
      div.addEventListener('click', () => toggleAsiento(id));
    }
  
    return div;
  }
  
  // Seleccionar/deseleccionar asiento
  function toggleAsiento(id) {
    const asiento = document.querySelector(`[data-id="${id}"]`);
    
    if (asientosSeleccionados.includes(id)) {
      asientosSeleccionados = asientosSeleccionados.filter(a => a !== id);
      asiento.classList.remove('asiento-seleccionado');
    } else {
      asientosSeleccionados.push(id);
      asiento.classList.add('asiento-seleccionado');
    }
  
    actualizarContador();
  }
  
  // Actualizar contador de seleccionados
  function actualizarContador() {
    const contador = document.getElementById('contadorSeleccionadas');
    if (contador) {
      contador.textContent = asientosSeleccionados.length;
    }
  }
  
  // Manejo de botones de pago
  document.addEventListener('DOMContentLoaded', function() {
    // Cargar cartelera dinámica al iniciar
    loadCartelera();
    document.querySelectorAll('.boton-pago').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.boton-pago').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        metodoPagoSeleccionado = btn.dataset.metodo;
      });
    });
  
    // Botón confirmar
    const botonConfirmar = document.getElementById('botonConfirmar');
    if (botonConfirmar) {
      botonConfirmar.addEventListener('click', () => {
        if (asientosSeleccionados.length === 0) {
          alert('Por favor selecciona al menos un asiento');
          return;
        }
  
        if (!metodoPagoSeleccionado) {
          alert('Por favor selecciona un método de pago');
          return;
        }
  
        const total = calcularTotal();
        alert(`Reserva confirmada!\nAsientos: ${asientosSeleccionados.join(', ')}\nTotal: $${total.toLocaleString()}\nMétodo de pago: ${metodoPagoSeleccionado}`);
      });
    }
  
    // Inicializar asientos si estamos en la página de reserva
    generarAsientos();
  });
  
  // Calcular total
  function calcularTotal() {
    let total = 0;
    asientosSeleccionados.forEach(id => {
      if (asientosDiscapacidad.includes(id)) {
        total += 10000;
      } else {
        total += 15000;
      }
    });
    return total;
  }
  
  