// Generate seats
const seatsGrid = document.getElementById("seatsGrid")
const rows = ["A", "B", "C", "D", "E", "F", "G", "H"]
const columns = 14

// Predefined occupied and selected seats
const occupiedSeats = ["B12", "F4", "F5"]
const initialSelectedSeats = ["C5", "C6"]
const wheelchairSeats = ["A4", "A5"]
let selectedSeats = [...initialSelectedSeats]

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

      if (seat.classList.contains("wheelchair")) {
        seat.classList.remove("wheelchair")
        seat.classList.add("available")
      } else if (wheelchairSeats.includes(seatId)) {
        seat.classList.add("wheelchair")
        seat.classList.remove("available")
      }

      updateSelectedCount()
    })

    seatsGrid.appendChild(seat)
  }
})

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
  window.location.href = "cajero.html";
}