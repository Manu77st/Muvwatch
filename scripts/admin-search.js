function busquedas() {
  const input = document.getElementById('search-input');
  const resultados = document.getElementById('resultados');
  if (!input) return;

  const termino = input.value.trim().toLowerCase();
  let coincidencias = 0;
  let handled = false;

  const grid = document.querySelector('.movies-grid');
  if (grid) {
    const cards = grid.querySelectorAll('.movie-card');
    cards.forEach((card) => {
      if (card.classList.contains('add-card')) {
        card.style.display = '';
        return;
      }

      const titulo =
        (card.dataset.title || card.querySelector('h3')?.textContent || '').toLowerCase();

      if (termino === '' || titulo.includes(termino)) {
        card.style.display = '';
        coincidencias++;
      } else {
        card.style.display = 'none';
      }
    });
    handled = true;
  }

  const tabla = document.querySelector('.tabla-clientes tbody');
  if (!handled && tabla) {
    const filas = tabla.querySelectorAll('tr');
    filas.forEach((row) => {
      const texto = row.textContent.toLowerCase();
      if (termino === '' || texto.includes(termino)) {
        row.style.display = '';
        coincidencias++;
      } else {
        row.style.display = 'none';
      }
    });
    handled = true;
  }

  if (resultados) {
    if (termino === '' || !handled) {
      resultados.textContent = '';
    } else if (coincidencias > 0) {
      resultados.innerHTML = `Se encontraron ${coincidencias} coincidencias para <strong>${termino}</strong>.`;
    } else {
      resultados.innerHTML = `No se encontraron resultados para <strong>${termino}</strong>.`;
    }
  }

  if (!handled && termino !== '') {
    alert('Esta búsqueda aún no está disponible en esta sección.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('search-input');
  const botonBuscar = document.querySelector('.caja-busqueda span.material-symbols-outlined');

  if (input) {
    input.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        busquedas();
      } else if (input.value === '') {
        busquedas();
      }
    });
  }

  if (botonBuscar) {
    botonBuscar.addEventListener('click', () => busquedas());
  }
});

window.busquedas = busquedas;
