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
btniniciarSesion.addEventListener('click', (event) => {
    event.preventDefault();
    let validacion = false;
    const correo = document.getElementById('correo').value;
    const contraseña = document.getElementById('contraseña').value;
    for(let i=0; i<lista_usuarios.length; i++){
        if(correo.toLowerCase() === lista_usuarios[i].correo.toLowerCase() && contraseña === lista_usuarios[i].contraseña){
            validacion=true;
            tipo = lista_usuarios[i].tipo_usuario;
            break;
        }
    }  
    if(validacion){
        mostrarNotificacion('Inicio de sesión exitoso', 'exito');
        if(tipo === 'Administrador'){
            window.location.href = 'lobby_admin.html';
        }
        else if(tipo === 'Cajero'){
            window.location.href = 'lobby-cajero.html';
        }
        else if(tipo === 'Cliente'){
            window.location.href = 'mod-cliente/lobby-cliente.html';
        }
    }else{
        mostrarNotificacion('Correo o contraseña incorrectos', 'error');
    }   
});
