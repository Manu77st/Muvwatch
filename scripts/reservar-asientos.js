// reservar-asientos.js
// Carga función y asientos reales desde la API y gestiona la reserva.

const API_BASE_LOCAL = (typeof API_BASE !== 'undefined') ? API_BASE : `${window.location.origin}/Muvwatch/backend/api/index.php`;

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

let seleccionadas = [];
let funcionActual = null;

function actualizarContador() {
  const contador = document.getElementById('contadorSeleccionadas');
  if (contador) contador.textContent = seleccionadas.length;
}

function crearAsientoElemento(asiento) {
  const div = document.createElement('div');
  div.className = 'asiento';
  div.dataset.id = asiento.id_silla || asiento.id || `${asiento.fila}${asiento.columna}`;

  const etiqueta = document.createElement('span');
  etiqueta.className = 'etiqueta-asiento';
  etiqueta.textContent = (asiento.fila || '') + (asiento.columna || '');

  const disponible = (typeof asiento.disponible !== 'undefined') ? Boolean(Number(asiento.disponible)) : (asiento.activa !== 0);

  if (!disponible || asiento.activa == 0) {
    div.classList.add('asiento-ocupado');
  } else {
    div.classList.add('asiento-disponible');
    div.addEventListener('click', () => {
      const id = div.dataset.id;
      if (seleccionadas.includes(id)) {
        seleccionadas = seleccionadas.filter(x => x !== id);
        div.classList.remove('asiento-seleccionado');
      } else {
        seleccionadas.push(id);
        div.classList.add('asiento-seleccionado');
      }
      actualizarContador();
    });
  }

  if (asiento.tipo && String(asiento.tipo).toLowerCase().includes('discap')) {
    div.classList.add('asiento-discapacidad');
  }

  div.appendChild(etiqueta);
  return div;
}

function renderAsientos(asientos) {
  const bloqueIzq = document.getElementById('bloqueAsientosIzquierda');
  const bloqueDer = document.getElementById('bloqueAsientosDerecha');
  if (!bloqueIzq || !bloqueDer) return;
  bloqueIzq.innerHTML = '';
  bloqueDer.innerHTML = '';

  // Normalizar filas/columnas
  asientos.sort((a,b) => {
    const fa = a.fila || '';
    const fb = b.fila || '';
    if (fa === fb) return (Number(a.columna) || 0) - (Number(b.columna) || 0);
    return fa.localeCompare(fb);
  });

  asientos.forEach(a => {
    const elem = crearAsientoElemento(a);
    // si columna viene como string, parsear
    const col = Number(a.columna) || 0;
    if (col > 0 && col <= 7) bloqueIzq.appendChild(elem);
    else bloqueDer.appendChild(elem);
  });
}

async function cargarFuncionYAsientos() {
  const id_funcion = getQueryParam('id_funcion') || getQueryParam('id');
  if (!id_funcion) return;

  try {
    const r1 = await fetch(`${API_BASE_LOCAL}?accion=funcion&id=${encodeURIComponent(id_funcion)}`, { credentials: 'include' });
    const j1 = await r1.json();
    if (j1.exito && j1.datos) {
      funcionActual = j1.datos;
      // Poner datos en el panel derecho
      const nombreEl = document.getElementById('funcionNombre');
      const fechaEl = document.getElementById('funcionFecha');
      const horaEl = document.getElementById('funcionHora');
        if (nombreEl) nombreEl.textContent = funcionActual.pelicula || funcionActual.pelicula_nombre || funcionActual.nombre || '';
        if (funcionActual.fecha_funcion) {
          // fecha_funcion puede venir como 'YYYY-MM-DD' o 'YYYY-MM-DD HH:MM:SS'
          const raw = funcionActual.fecha_funcion;
          const dt = new Date(raw);
          if (!isNaN(dt.getTime())) {
            // formatear fecha dd/mm/yyyy
            const dia = String(dt.getDate()).padStart(2, '0');
            const mes = String(dt.getMonth() + 1).padStart(2, '0');
            const anio = dt.getFullYear();
            const horas = dt.getHours();
            const minutos = String(dt.getMinutes()).padStart(2, '0');
            const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
            const hora12 = ((horas + 11) % 12 + 1);
            if (fechaEl) fechaEl.textContent = `${dia}/${mes}/${anio}`;
            if (horaEl) horaEl.textContent = `${hora12}:${minutos} ${ampm}`;
          } else {
            if (fechaEl) fechaEl.textContent = raw;
            if (horaEl) horaEl.textContent = '';
          }
        } else {
          if (fechaEl) fechaEl.textContent = '';
          if (horaEl) horaEl.textContent = '';
        }
    }

    const r2 = await fetch(`${API_BASE_LOCAL}?accion=asientos_funcion&id=${encodeURIComponent(id_funcion)}`, { credentials: 'include' });
    const j2 = await r2.json();
    if (j2.exito && j2.datos && Array.isArray(j2.datos.asientos)) {
      renderAsientos(j2.datos.asientos);
    } else if (j2.exito && j2.datos && Array.isArray(j2.datos)) {
      // Algunos endpoints devuelven directamente un array
      renderAsientos(j2.datos);
    } else {
      console.warn('Respuesta de asientos inválida', j2);
    }
  } catch (err) {
    console.error('Error cargando función/asientos:', err);
  }
}

async function crearReserva() {
  const id_funcion = getQueryParam('id_funcion') || getQueryParam('id');
  if (!id_funcion) {
    alert('No se encontró la función para reservar');
    return;
  }
  if (seleccionadas.length === 0) {
    alert('Selecciona al menos un asiento');
    return;
  }

  try {
    const payload = { id_funcion: id_funcion, asientos: seleccionadas };
    const res = await fetch(`${API_BASE_LOCAL}?accion=crear_reserva`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const j = await res.json();
    if (j.exito) {
      alert(j.mensaje || 'Reserva creada con éxito');
      // opcional: redirigir a mis reservas o al lobby
      window.location.href = '../../src/mod-cliente/carrito.html';
    } else {
      alert(j.mensaje || 'Error creando la reserva');
      // recargar asientos para reflejar cambios
      cargarFuncionYAsientos();
    }
  } catch (err) {
    console.error('Error creando reserva:', err);
    alert('Error al comunicarse con el servidor');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  cargarFuncionYAsientos();

  // Botón confirmar
  const botonConfirmar = document.getElementById('botonConfirmar');
  if (botonConfirmar) {
    botonConfirmar.addEventListener('click', async () => {
      // Validaciones simples
      if (seleccionadas.length === 0) {
        alert('Por favor selecciona al menos un asiento');
        return;
      }
      crearReserva();
    });
  }

  // Manejo de botones de pago (delegado por clase)
  document.querySelectorAll('.boton-pago').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.boton-pago').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});