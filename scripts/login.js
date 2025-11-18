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
const lista_usuarios = []
lista_usuarios.push({
    correo: 'luigi@gmail.com',
    contraseña: '1234',
    tipo_usuario: 'Cajero'},
    {correo: 'freddy@gmail.com',
    contraseña: '5678',
    tipo_usuario: 'Administrador'},
    {correo: 'Emanuel@gmail.com',
    contraseña: '12345',
    tipo_usuario: 'Cliente'});

    const btniniciarSesion = document.getElementById('Iniciar-sesion');

    btniniciarSesion.addEventListener('click', async (event) => {
        event.preventDefault();
        
        const correo = document.getElementById('correo').value.trim();
        const contraseña = document.getElementById('contraseña').value;
    
        // Validación básica en el frontend
        if (!correo || !contraseña) {
            mostrarNotificacion('Hola, porfa llenar todos los campos', 'error');
            return;
        }
    
        try {
            const respuesta = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo: correo,
                    contraseña: contraseña
                })
            });
    
            // Aquí convertimos la respuesta a JSON
            const resultado = await respuesta.json();
            /*const resultado = await resuesta.json();*/
    
            if (resultado.success) {
                mostrarNotificacion(resultado.message, 'exito :)');
                
                // Redirigimos según el tipo de usuario registrado
                const tipo = resultado.usuario.tipo_usuario;
                
                if (tipo === 'administrador') {
                    window.location.href = 'lobby_admin.html';
                } else if (tipo === 'cajero') {
                    window.location.href = 'lobby-cajero.html';
                } else if (tipo === 'cliente') {
                    window.location.href = 'mod-cliente/lobby-cliente.html';
                }
            } else {
                mostrarNotificacion(resultado.message, 'error');
            }
    
        } catch (error) {
            console.error('Error al hacer la petición:', error);
            mostrarNotificacion('Hubo un error de conexión con el servidor', 'error');
        }
    });