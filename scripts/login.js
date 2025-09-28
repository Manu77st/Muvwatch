const btnver = document.getElementById('toggle-password');
const inputPassword = document.getElementById('contraseña');
const icon = btnver.querySelector('.material-icons');

btnver.addEventListener('click', () => {
    if(inputPassword.type === 'password'){
        inputPassword.type = 'text';
        icon.textContent = 'visibility_off';
    }else{
        inputPassword.type = 'password';
        icon.textContent = 'visibility';
    }
});

function mostrarNotificacion(mensaje, tipo) {
    const notificaciones = document.getElementById('notificaciones');
    const contenedor = document.createElement('div');
    contenedor.classList.add('contenedor-notificaciones');
    const linea = document.createElement('div');
    linea.classList.add('linea');
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = notificacion.innerHTML = `
  <h3>Resultados:</h3>
  <p>${mensaje}</p>
`;
    contenedor.appendChild(linea);
    contenedor.appendChild(notificacion);
    notificaciones.appendChild(contenedor);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}
const btniniciarSesion = document.getElementById('Iniciar-sesion');

btniniciarSesion.addEventListener('click', async (event) => {
    event.preventDefault();
    
    const correo = document.getElementById('correo').value.trim();
    const contraseña = document.getElementById('contraseña').value.trim();
    
    // Validación básica en el frontend
    if (!correo || !contraseña) {
        mostrarNotificacion('Por favor complete todos los campos', 'error');
        return;
    }
    
    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        mostrarNotificacion('Por favor ingrese un correo electrónico válido', 'error');
        return;
    }
    
    try {
        // Deshabilitar el botón para evitar múltiples envíos
        btniniciarSesion.disabled = true;
        btniniciarSesion.textContent = 'Validando...';
        
        // Hacer petición AJAX al backend
        const response = await fetch('../backend/validar_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                correo: correo,
                contraseña: contraseña
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar información del usuario en sessionStorage
            sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
            mostrarNotificacion(data.message, 'exito');
            
            // Redirigir según el tipo de usuario
            setTimeout(() => {
                if (data.usuario.tipo_usuario === 'administrador') {
                    window.location.href = 'admin_dashboard.html';
                } else if (data.usuario.tipo_usuario === 'cajero') {
                    window.location.href = 'cajero_dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 1500);
        } else {
            mostrarNotificacion(data.message, 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error de conexión. Intente nuevamente.', 'error');
    } finally {
        // Rehabilitar el botón
        btniniciarSesion.disabled = false;
        btniniciarSesion.textContent = 'Ingresar';
    }
});
