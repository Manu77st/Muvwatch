// Obtener parámetros de la URL
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search)
  return params.get(name)
}

// Cargar datos de la función seleccionada
function cargarDatosFuncion() {
  const idFuncion = getQueryParam('id_funcion')
  if (!idFuncion) return

  fetch(`../backend/api_funcion_detalle.php?id_funcion=${encodeURIComponent(idFuncion)}`)
    .then(response => response.json())
    .then(data => {
      if (!data.success || !data.data) return

      const funcion = data.data

      const inputTitulo = document.getElementById('movie-title')
      const inputFecha = document.getElementById('movie-date')
      const inputHora = document.getElementById('movie-time')

      if (inputTitulo) inputTitulo.value = funcion.nombre
      if (inputFecha && funcion.fecha_funcion) inputFecha.value = funcion.fecha_funcion

      // No tenemos hora en la tabla, solo fecha, así que dejamos la hora por defecto
    })
    .catch(error => {
      console.error('Error al cargar la función:', error)
    })
}

// Generate seats
const seatsGrid = document.getElementById("seatsGrid")
const rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
const columns = 14

// Ocupadas desde BD + seleccionadas por el usuario
let occupiedSeats = []
const initialSelectedSeats = []
const wheelchairSeats = ["A4", "A5"]
let selectedSeats = [...initialSelectedSeats]

function renderSeats() {
  seatsGrid.innerHTML = ''

  rows.forEach((row) => {
    for (let col = 1; col <= columns; col++) {
      const seatId = `${row}${col}`
      const seat = document.createElement("div")
      seat.className = "seat available"
      seat.textContent = seatId
      seat.dataset.seat = seatId

      if (occupiedSeats.includes(seatId)) {
        seat.classList.remove("available")
        seat.classList.add("occupied")
      } else if (initialSelectedSeats.includes(seatId)) {
        seat.classList.remove("available")
        seat.classList.add("selected")
      }

      if (wheelchairSeats.includes(seatId)) {
        seat.classList.add("wheelchair")
      }

      seat.addEventListener("click", () => {
        if (seat.classList.contains("occupied")) return
        
        if (seat.classList.contains("selected")) {
          seat.classList.remove("selected")
          seat.classList.add("available")
          selectedSeats = selectedSeats.filter((s) => s !== seatId)
        } else {
          seat.classList.remove("available")
          seat.classList.add("selected")
          selectedSeats.push(seatId)
        }

        updateSelectedCount()
      })

      seatsGrid.appendChild(seat)
    }
  })
}

// Cargar sillas reservadas/ocupadas desde la BD
function cargarSillasOcupadas() {
  const idFuncion = getQueryParam('id_funcion')
  if (!idFuncion) {
    renderSeats()
    return
  }

  fetch(`../backend/api_reservas_sillas.php?id_funcion=${encodeURIComponent(idFuncion)}`)
    .then(response => response.json())
    .then(data => {
      if (!data.success || !data.data) {
        renderSeats()
        return
      }

      // Marcar sillas exactas como ocupadas usando fila+numero
      occupiedSeats = data.data.map(s => `${s.fila}${s.numero}`)

      renderSeats()
    })
    .catch(error => {
      console.error('Error al cargar sillas ocupadas:', error)
      renderSeats()
    })
}

// Update selected count
function updateSelectedCount() {
  document.getElementById("selectedCount").textContent = selectedSeats.length
}

// Initialize count
updateSelectedCount()

// Payment method toggle
const efectivoBtn = document.getElementById("efectivoBtn")
const otroBtn = document.getElementById("otroBtn")

efectivoBtn.addEventListener("click", () => {
  efectivoBtn.classList.add("active")
  otroBtn.classList.remove("active")
})

otroBtn.addEventListener("click", () => {
  otroBtn.classList.add("active")
  efectivoBtn.classList.remove("active")
})

function linkToCajero() {
  const idFuncion = getQueryParam('id_funcion') || ''

  const funcionNombre = document.getElementById('movie-title')?.value || ''
  const fecha = document.getElementById('movie-date')?.value || ''
  const hora = document.getElementById('movie-time')?.value || ''

  const precioBase = 15000
  const total = selectedSeats.length * precioBase

  const params = new URLSearchParams()
  if (idFuncion) params.set('id_funcion', idFuncion)
  if (funcionNombre) params.set('funcion', funcionNombre)
  if (fecha) params.set('fecha', fecha)
  if (hora) params.set('hora', hora)
  if (selectedSeats.length) params.set('sillas', selectedSeats.join(','))
  params.set('total', String(total))
  
  // Guardar reserva en la BD antes de ir a método de pago
  if (!idFuncion || !selectedSeats.length) {
    alert('Seleccione al menos una silla para continuar.')
    return
  }

  fetch('../backend/api_reservar_sillas.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id_funcion: Number(idFuncion),
      sillas: selectedSeats,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        alert('Error al reservar las sillas. Intente nuevamente.')
        return
      }

      window.location.href = `otro-metodo.html?${params.toString()}`
    })
    .catch(error => {
      console.error('Error al reservar sillas:', error)
      alert('Error al reservar las sillas. Intente nuevamente.')
    })
}

// Inicializar datos de la función cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
  cargarDatosFuncion()
  cargarSillasOcupadas()
})