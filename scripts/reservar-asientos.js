// Elementos del DOM
const bloqueIzquierdo = document.getElementById('bloqueAsientosIzquierda');
const bloqueDerecho = document.getElementById('bloqueAsientosDerecha');
const contadorSeleccionadas = document.getElementById('contadorSeleccionadas');
const botonConfirmar = document.getElementById('botonConfirmar');
const funcionNombre = document.getElementById('funcionNombre');
const funcionFecha = document.getElementById('funcionFecha');
const funcionHora = document.getElementById('funcionHora');

let asientos = [];
let seleccionados = [];
let precios = {
    standard: 15000,
    discapacitados: 10000
};

// Obtener id_funcion de la URL
const urlParams = new URLSearchParams(window.location.search);
const idFuncion = urlParams.get('id_funcion');

// Traer asientos desde API
fetch(`api.php?accion=obtenerAsientos&id_funcion=${idFuncion}`)
    .then(res => res.json())
    .then(data => {
        if (data.exito) {
            const funcion = data.datos.funcion;
            asientos = data.datos.asientos;

            // Actualizar info de la función
            funcionNombre.textContent = funcion.pelicula;
            funcionFecha.textContent = funcion.fecha_funcion;
            funcionHora.textContent = funcion.hora;

            renderizarAsientos();
        } else {
            alert(data.mensaje);
        }
    });

// Renderizar asientos en la sala
function renderizarAsientos() {
    bloqueIzquierdo.innerHTML = '';
    bloqueDerecho.innerHTML = '';

    asientos.forEach(a => {
        const div = document.createElement('div');
        div.classList.add('asiento');

        if (!a.activa) div.classList.add('inactiva');
        else if (!a.disponible) div.classList.add('ocupada');
        else div.classList.add('disponible');

        div.textContent = a.fila + a.columna;
        div.dataset.id = a.id_silla;
        div.dataset.tipo = a.tipo; // standard o discapacitado

        if (a.activa && a.disponible) {
            div.addEventListener('click', () => toggleSeleccion(a.id_silla, div, a.tipo));
        }

        if (a.bloque === 'izquierda') bloqueIzquierdo.appendChild(div);
        else bloqueDerecho.appendChild(div);
    });
}

// Seleccionar / deselect asientos
function toggleSeleccion(id, div, tipo) {
    const index = seleccionados.findIndex(s => s.id === id);
    if (index >= 0) {
        seleccionados.splice(index, 1);
        div.classList.remove('seleccionada');
    } else {
        seleccionados.push({id, tipo});
        div.classList.add('seleccionada');
    }
    actualizarContador();
}

function actualizarContador() {
    contadorSeleccionadas.textContent = seleccionados.length;
}

// Confirmar reserva
botonConfirmar.addEventListener('click', () => {
    if (seleccionados.length === 0) {
        alert('Selecciona al menos un asiento');
        return;
    }

    const asientoIds = seleccionados.map(s => s.id);

    fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            accion: 'crearReserva',
            id_funcion: idFuncion,
            asientos: asientoIds
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.exito) {
            alert('Reserva realizada con éxito.');
            window.location.href = 'mis-reservas.html';
        } else {
            alert(data.mensaje);
        }
    });
});
