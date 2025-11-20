// Datos de funciones obtenidos desde el backend
let funcionesData = [];

// Cargar funciones al iniciar la página
document.addEventListener('DOMContentLoaded', function () {
    cargarFunciones();
});

function cargarFunciones() {
    fetch('../backend/api_funciones_cajero.php')
        .then(response => response.json())
        .then(data => {
            if (!data.success) return;

            funcionesData = data.data || [];
            renderFunciones();
        })
        .catch(error => {
            console.error('Error al cargar funciones:', error);
        });
}

function renderFunciones() {
    const grid = document.querySelector('.movies-grid');
    if (!grid) return;

    grid.innerHTML = '';

    funcionesData.forEach(funcion => {
        const card = document.createElement('div');
        card.className = 'movie-card';

        // Por ahora usamos una imagen genérica; luego se puede guardar ruta en BD
        card.innerHTML = `
            <img src="../images/Peliculas_Cartelera/default.jpg" alt="${funcion.nombre}">
            <h3>${funcion.nombre}</h3>
            <div class="movie-actions">
                <button class="btn-view">
                    <span class="material-symbols-outlined">visibility</span>
                    Ver detalles
                </button>
                <button class="btn-tobook" onclick="window.location.href='reservar-asientos.html?id_funcion=${funcion.id_funcion}'">
                    <span class="material-symbols-outlined">theater_comedy</span>
                    Reservar asientos
                </button>
            </div>
        `;

        const verDetallesBtn = card.querySelector('.btn-view');
        verDetallesBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            openMovieModal(funcion);
        });

        grid.appendChild(card);
    });
}

function openMovieModal(funcion) {
    const modal = document.getElementById('movieModal');

    // Contenido del modal basado en los datos de la función/película
    document.getElementById('modalMovieImage').src = '../images/Peliculas_Cartelera/default.jpg';
    document.getElementById('modalMovieTitle').textContent = funcion.nombre;
    document.getElementById('modalOriginalName').textContent = funcion.nombre;
    document.getElementById('modalClassification').textContent = funcion.clasificacion;
    document.getElementById('modalCast').textContent = funcion.reparto;
    document.getElementById('modalDirector').textContent = funcion.director;
    document.getElementById('modalSynopsis').textContent = funcion.sipnosis;

    modal.style.display = 'block';
}

function closeMovieModal() {
    document.getElementById('movieModal').style.display = 'none';
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function (event) {
    const modal = document.getElementById('movieModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Menú de usuario (perfil Cajero1)
document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('userMenuToggle');
    const menu = document.getElementById('userMenu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isVisible = menu.style.display === 'block';
        menu.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', function () {
        menu.style.display = 'none';
    });
});