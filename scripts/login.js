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
const listausuarios =['luigi@gmail.com', "andres@gmail.com"]
const listacontraseñas = ['1234', '5678']
const btniniciarSesion = document.getElementById('Iniciar-sesion');
btniniciarSesion.addEventListener('click', (event) => {
    event.preventDefault();
    let validacion = false;
    const correo = document.getElementById('correo').value;
    const contraseña = document.getElementById('contraseña').value;
    for(let i=0; i<listausuarios.length; i++){
        if(correo === listausuarios[i] && contraseña === listacontraseñas[i]){
            validacion=true;
            break;
        }
    }  
    if(validacion){
        mostrarNotificacion('Inicio de sesión exitoso', 'exito');
        window.location.href = 'index.html';
    }else{
        mostrarNotificacion('Correo o contraseña incorrectos', 'error');
    }   
});
