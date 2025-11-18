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

// Datos de películas
function getMovieData(movieId) {
  const movies = {
    'mission-impossible': {
      image: '../images/Peliculas_Cartelera/Mision imposible.jpg',
      title: 'Mission Impossible',
      originalName: 'Mission: Impossible',
      classification: 'PG-13',
      cast: 'Tom Cruise, Jon Voight, Emmanuelle Béart, Henry Czerny, Jean Reno, Ving Rhames',
      director: 'Brian De Palma',
      synopsis: 'Ethan Hunt es un agente de la Fuerza de Tareas de Imposibles (IMF) que se ve obligado a aceptar una misión para limpiar su nombre después de ser acusado de traición. Debe recuperar una lista secreta de agentes encubiertos que ha sido robada por un traidor dentro de la IMF.'
    },
    'spiderman': {
      image: '../images/Peliculas_Cartelera/Spider-man.jpg',
      title: 'Spiderman',
      originalName: 'Spider-Man: Across the Spider-Verse',
      classification: 'PG-13',
      cast: 'Shameik Moore, Hailee Steinfeld, Oscar Isaac, Jake Johnson',
      director: 'Joaquim Dos Santos, Kemp Powers, Justin K. Thompson',
      synopsis: 'Miles Morales regresa para una nueva aventura épica que transportará al amigable vecino de Brooklyn a través del Multiverso para unir fuerzas con Gwen Stacy y un nuevo equipo de Spider-People.'
    },
    'inside-out-2': {
      image: '../images/Peliculas_Cartelera/Intesamente_2.jpg',
      title: 'Inside Out 2',
      originalName: 'Inside Out 2',
      classification: 'PG',
      cast: 'Amy Poehler, Phyllis Smith, Lewis Black, Tony Hale',
      director: 'Kelsey Mann',
      synopsis: 'Riley, ahora una adolescente, debe navegar por una nueva emoción: Ansiedad. Joy, Tristeza, Ira, Miedo y Asco deben ayudar a Riley a adaptarse a los cambios de la adolescencia.'
    },
    'beetlejuice': {
      image: '../images/Peliculas_Cartelera/Bettlejuice.jpg',
      title: 'Beetlejuice',
      originalName: 'Beetlejuice 2',
      classification: 'PG-13',
      cast: 'Michael Keaton, Winona Ryder, Catherine O\'Hara, Jenna Ortega',
      director: 'Tim Burton',
      synopsis: 'La secuela de la película clásica de 1988 sigue a Lydia Deetz y su familia cuando regresan a Winter River, donde se encuentran con Beetlejuice una vez más.'
    },
    'paddington': {
      image: '../images/Peliculas_Cartelera/Paddington.jpg',
      title: 'Paddington',
      originalName: 'PADDINGTON AVENTURA EN LA SELVA',
      classification: 'PG',
      cast: 'Ben Whishaw, Hugh Grant, Madeleine Harris, Samuel Joslin',
      director: 'Paul King',
      synopsis: 'Paddington se embarca en una aventura épica en la selva peruana para encontrar su verdadero hogar, mientras el Sr. Brown y su familia lo siguen en una misión de rescate.'
    }
  };
  return movies[movieId] || movies['mission-impossible'];
}

// Modal de película
function openMovieModal(movieId) {
  const modal = document.getElementById("movieModal");
  const movieData = getMovieData(movieId);

  document.getElementById("modalMovieImage").src = movieData.image;
  document.getElementById("modalMovieTitle").textContent = movieData.title;
  document.getElementById("modalOriginalName").textContent = movieData.originalName;
  document.getElementById("modalClassification").textContent = movieData.classification;
  document.getElementById("modalCast").textContent = movieData.cast;
  document.getElementById("modalDirector").textContent = movieData.director;
  document.getElementById("modalSynopsis").textContent = movieData.synopsis;

  modal.style.display = "block";
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

