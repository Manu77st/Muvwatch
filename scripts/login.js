const btnver = document.getElementById("toggle-password");
const inputPassword = document.getElementById("contraseña");
if (btnver && inputPassword) {
  const icon = btnver.querySelector(".material-icons");
  btnver.addEventListener("click", () => {
    if (inputPassword.type === "password") {
      inputPassword.type = "text";
      if (icon) icon.textContent = "visibility_off";
    } else {
      inputPassword.type = "password";
      if (icon) icon.textContent = "visibility";
    }
  });
}

function mostrarNotificacion(mensaje, tipo) {
  const notificaciones = document.getElementById("notificaciones");
  if (!notificaciones) {
    alert(mensaje);
    return;
  }
  const contenedor = document.createElement("div");
  contenedor.classList.add("contenedor-notificaciones");
  const linea = document.createElement("div");
  linea.classList.add("linea");
  const notificacion = document.createElement("div");
  notificacion.className = `notificacion ${tipo}`;
  notificacion.innerHTML = `\n  <h3>Resultados:</h3>\n  <p>${mensaje}</p>\n`;
  contenedor.appendChild(linea);
  contenedor.appendChild(notificacion);
  notificaciones.appendChild(contenedor);

  setTimeout(() => {
    contenedor.remove();
  }, 3000);
}

const btniniciarSesion = document.getElementById("Iniciar-sesion");
const API_BASE = `${window.location.origin}/Muvwatch/backend/api/index.php`;

if (btniniciarSesion) {
  btniniciarSesion.addEventListener("click", async (event) => {
    event.preventDefault();

    const correoEl = document.getElementById("correo");
    const contraseñaEl = document.getElementById("contraseña");
    const correo = correoEl ? correoEl.value.trim() : "";
    const contraseña = contraseñaEl ? contraseñaEl.value : "";

    if (!correo || !contraseña) {
      mostrarNotificacion("Por favor complete todos los campos", "error");
      return;
    }

    try {
      const respuesta = await fetch(`${API_BASE}?accion=login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          correo: correo,
          contraseña: contraseña,
        }),
      });

      const resultado = await respuesta.json();
      const tipoU = resultado.datos.tipo_usuario;

      if (resultado.exito) {
        mostrarNotificacion(
          resultado.mensaje || "Inicio de sesión exitoso",
          "exito"
        );
        const tipo =
          resultado.datos && resultado.datos.tipo_usuario
            ? resultado.datos.tipo_usuario.toLowerCase()
            : "cliente";

        // Redirigir según tipo
        if (tipoU === "administrador") {
          window.location.href = "lobby_admin.html";
        } else if (tipoU === "cajero") {
          window.location.href = "lobby-cajero.html";
        } else {
          window.location.href = "mod-cliente/lobby-cliente.html";
        }
      } else {
        mostrarNotificacion(
          resultado.mensaje || "Credenciales inválidas",
          "error"
        );
      }
    } catch (error) {
      console.error("Error al hacer la petición:", error);
      mostrarNotificacion("Hubo un error de conexión con el servidor", "error");
    }
  });
}
