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
  document.getElementById('contadorSeleccionadas').textContent = asientosSeleccionados.length;
}

// Manejo de botones de pago
document.querySelectorAll('.boton-pago').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.boton-pago').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    metodoPagoSeleccionado = btn.dataset.metodo;
  });
});

// Botón confirmar
document.getElementById('botonConfirmar').addEventListener('click', () => {
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

// Menú de cliente
document.getElementById('clienteBox')?.addEventListener('click', function(e) {
  e.stopPropagation();
  document.getElementById('menuCliente').classList.toggle('show');
});

document.addEventListener('click', function() {
  document.getElementById('menuCliente')?.classList.remove('show');
});

// Inicializar
generarAsientos();