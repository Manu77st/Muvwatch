const API_URL = '../../backend/api/index.php';

// Variables de estado
let usuarioActual = {};
let modificado = false;

document.addEventListener('DOMContentLoaded', () => {
  cargarPerfil();
  configurarEventos();
  configurarMenu();
});

// ========================================
// CARGAR PERFIL
// ========================================
async function cargarPerfil() {
  try {
    const respuesta = await fetch(`${API_URL}?accion=perfil`, {
      method: 'GET',
      credentials: 'include'
    });

    const datos = await respuesta.json();

    if (datos.exito && datos.datos) {
      usuarioActual = datos.datos;
      poblarFormulario();
      // Actualizar nombre en navbar
      const userNameDisplay = document.getElementById('userNameDisplay');
      if (userNameDisplay && usuarioActual.nombres) {
        userNameDisplay.textContent = usuarioActual.nombres;
      }
    } else {
      mostrarMensaje('No se pudieron cargar los datos del perfil', 'error');
      console.error('Error al cargar perfil:', datos.mensaje);
    }
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    mostrarMensaje('Error al conectar con el servidor', 'error');
  }
}

// ========================================
// POBLAR FORMULARIO CON DATOS
// ========================================
function poblarFormulario() {
  // Nombres
  const nombres = document.getElementById('nombres');
  if (nombres && usuarioActual.nombres) {
    nombres.value = usuarioActual.nombres;
  }

  // Apellidos
  const apellidos = document.getElementById('apellidos');
  if (apellidos && usuarioActual.apellidos) {
    apellidos.value = usuarioActual.apellidos;
  }

  // Correo
  const correo = document.getElementById('correo');
  if (correo && usuarioActual.correo) {
    correo.value = usuarioActual.correo;
  }

  // Teléfono
  const telefono = document.getElementById('telefono');
  if (telefono && usuarioActual.telefono) {
    telefono.value = usuarioActual.telefono;
  }

  // Tipo de Documento
  const tipoDocumento = document.getElementById('tipo_documento');
  if (tipoDocumento && usuarioActual.tipo_documento) {
    tipoDocumento.value = usuarioActual.tipo_documento;
  }

  // Número de Documento
  const numeroDocumento = document.getElementById('numero_documento');
  if (numeroDocumento && usuarioActual.numero_documento) {
    numeroDocumento.value = usuarioActual.numero_documento;
  }

  // Fecha de Nacimiento (formato ISO: YYYY-MM-DD)
  const fechaNacimiento = document.getElementById('fecha_nacimiento');
  if (fechaNacimiento && usuarioActual.fecha_nacimiento) {
    // Si viene como string con espacio, tomar solo la parte de fecha
    let fechaFormato = usuarioActual.fecha_nacimiento;
    if (fechaFormato.includes(' ')) {
      fechaFormato = fechaFormato.split(' ')[0];
    }
    fechaNacimiento.value = fechaFormato;
  }

  // Estado VIP
  const vipStatus = document.getElementById('vip_status');
  if (vipStatus) {
    vipStatus.value = usuarioActual.cliente_vip === 1 || usuarioActual.vip === 1 ? 'Sí' : 'No';
  }

  modificado = false;
}

// ========================================
// CONFIGURAR EVENTOS
// ========================================
function configurarEventos() {
  const formPerfil = document.getElementById('formPerfil');
  const btnGuardar = document.getElementById('btnGuardar');
  const btnCancelar = document.getElementById('btnCancelar');

  // Detectar cambios en el formulario
  if (formPerfil) {
    formPerfil.querySelectorAll('input[type="text"], input[type="tel"], input[type="email"], select').forEach(input => {
      if (!input.hasAttribute('readonly') && !input.hasAttribute('disabled')) {
        input.addEventListener('change', () => {
          modificado = true;
        });
      }
    });
  }

  // Botón Guardar
  if (btnGuardar) {
    btnGuardar.addEventListener('click', guardarCambios);
  }

  // Botón Cancelar
  if (btnCancelar) {
    btnCancelar.addEventListener('click', () => {
      poblarFormulario();
      modificado = false;
      limpiarMensajes();
    });
  }
}

// ========================================
// GUARDAR CAMBIOS
// ========================================
async function guardarCambios() {
  if (!modificado) {
    mostrarMensaje('No hay cambios para guardar', 'error');
    return;
  }

  // Recopilar datos del formulario
  const nombres = document.getElementById('nombres').value.trim();
  const apellidos = document.getElementById('apellidos').value.trim();
  const telefono = document.getElementById('telefono').value.trim();

  // Validación básica
  if (!nombres || !apellidos || !telefono) {
    mostrarMensaje('Por favor completa todos los campos requeridos', 'error');
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}?accion=perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        nombres: nombres,
        apellidos: apellidos,
        telefono: telefono
      })
    });

    const datos = await respuesta.json();

    if (datos.exito) {
      mostrarMensaje('Perfil actualizado correctamente', 'success');
      usuarioActual.nombres = nombres;
      usuarioActual.apellidos = apellidos;
      usuarioActual.telefono = telefono;
      modificado = false;
      
      // Actualizar nombre en navbar
      const userNameDisplay = document.getElementById('userNameDisplay');
      if (userNameDisplay) {
        userNameDisplay.textContent = nombres;
      }
    } else {
      mostrarMensaje(datos.mensaje || 'Error al guardar los cambios', 'error');
    }
  } catch (error) {
    console.error('Error al guardar:', error);
    mostrarMensaje('Error al conectar con el servidor', 'error');
  }
}

// ========================================
// MENSAJES
// ========================================
function mostrarMensaje(texto, tipo) {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) {
    mensajeDiv.textContent = texto;
    mensajeDiv.className = `message ${tipo}`;
    
    // Auto-ocultar después de 5 segundos si es success
    if (tipo === 'success') {
      setTimeout(() => {
        mensajeDiv.className = 'message';
      }, 5000);
    }
  }
}

function limpiarMensajes() {
  const mensajeDiv = document.getElementById('mensaje');
  if (mensajeDiv) {
    mensajeDiv.className = 'message';
    mensajeDiv.textContent = '';
  }
}

// ========================================
// MENU CLIENTE
// ========================================
function configurarMenu() {
  const clienteBox = document.querySelector('.cliente-box');
  
  if (clienteBox) {
    clienteBox.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = clienteBox.querySelector('.menu-cliente');
      if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
      }
    });

    document.addEventListener('click', () => {
      const menu = clienteBox.querySelector('.menu-cliente');
      if (menu) {
        menu.style.display = 'none';
      }
    });
  }
}

// Función que hereda de cliente-mod.js
function abrirPerfil(e) {
  if(e) e.preventDefault();
  window.location.href = 'perfil.html';
}
