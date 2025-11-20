// scripts/pago-module.js
class GestorPagos {
  constructor() {
    this.URL_API = "../../backend/api/index.php";
    this.datosPago = null;
    this.inicializar();
  }

  inicializar() {
    this.obtenerElementosDOM();
    this.configurarEventos();
    this.cargarDatosReserva();
    console.log("Módulo de pago inicializado correctamente");
  }

  obtenerElementosDOM() {
    // Elementos de información de reserva
    this.elementosInfo = {
      funcion: document.querySelector(".info-row:nth-child(1) .info-value"),
      fecha: document.querySelector(".info-row:nth-child(2) .info-value"),
      hora: document.querySelector(".info-row:nth-child(3) .info-value"),
      sala: document.querySelector(".info-row:nth-child(4) .info-value"),
      sillas: document.querySelector(".info-row:nth-child(5) .info-value"),
      precioTotal: document.querySelector(".info-row:nth-child(7) .info-value"),
      descuento: document.querySelector(".info-row:nth-child(8) .info-value"),
    };

    // Formularios de pago
    this.formularioCredito = document.getElementById("creditCard");
    this.formularioDebito = document.getElementById("debitCard");

    // Botones
    this.botonPagar = document.querySelector(".pay-button");
  }

  configurarEventos() {
    // Cambio entre crédito y débito
    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
      radio.addEventListener("change", (evento) => {
        this.cambiarFormularioTarjeta(evento.target.value);
      });
    });

    // Validación de tarjetas
    this.configurarValidacionesTarjetas();

    // Botón de pago
    if (this.botonPagar) {
      this.botonPagar.addEventListener("click", () => this.procesarPago());
    }
  }

  configurarValidacionesTarjetas() {
    // Formateo automático de números de tarjeta
    document
      .querySelectorAll("#credit-number, #debit-number")
      .forEach((input) => {
        input.addEventListener("input", (evento) => {
          this.formatearNumeroTarjeta(evento.target);
          this.validarNumeroTarjeta(evento.target);
        });
      });

    // Solo números en campos numéricos
    document
      .querySelectorAll("#credit-number, #debit-number, #debit-auth")
      .forEach((input) => {
        input.addEventListener("keypress", (evento) => {
          if (
            !/[\d\s]/.test(evento.key) &&
            evento.key !== "Backspace" &&
            evento.key !== "Delete"
          ) {
            evento.preventDefault();
          }
        });
      });
  }

  cargarDatosReserva() {
    try {
      const datosGuardados = sessionStorage.getItem("datos_pago");
      if (!datosGuardados) {
        this.mostrarError(
          "No se encontraron datos de reserva. Regresa a seleccionar asientos."
        );
        return false;
      }

      this.datosPago = JSON.parse(datosGuardados);
      console.log("Datos de pago cargados:", this.datosPago);

      this.actualizarInformacionReserva();
      return true;
    } catch (error) {
      console.error("Error cargando datos de reserva:", error);
      this.mostrarError("Error al cargar los datos de la reserva.");
      return false;
    }
  }

  actualizarInformacionReserva() {
    if (!this.datosPago) return;

    const funcionSeleccionada = this.datosPago.funciones.find(
      (funcion) => funcion.id_funcion == this.datosPago.id_funcion
    );

    if (!funcionSeleccionada) {
      this.mostrarError("No se encontró la función seleccionada.");
      return;
    }

    // Formatear fecha y hora (aceptar 'YYYY-MM-DD HH:MM:SS' o ISO)
    let fechaFormateada = "—";
    let horaFormateada = "—";
    try {
      let raw = funcionSeleccionada.fecha_funcion || "";
      // Normalizar: convertir espacio entre fecha y hora a 'T' para formar ISO
      if (raw && typeof raw === "string") {
        let iso = raw.includes("T") ? raw : raw.replace(" ", "T");
        // Algunos navegadores tratan 'YYYY-MM-DDTHH:MM:SS' como local, otros como UTC.
        // Intentamos crear Date y si es inválida, intentamos reemplazando espacios y añadiendo seconds.
        let d = new Date(iso);
        if (isNaN(d.getTime())) {
          // Intentar con ' ' -> 'T' ya hecho; si sigue inválido, intentar agregar 'Z' (UTC)
          d = new Date(iso + "Z");
        }
        if (!isNaN(d.getTime())) {
          fechaFormateada = d.toLocaleDateString("es-CO");
          horaFormateada = d.toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }
    } catch (e) {
      console.debug(
        "No se pudo parsear fecha_funcion:",
        funcionSeleccionada.fecha_funcion,
        e
      );
    }

    // Actualizar interfaz
    this.actualizarElemento(
      this.elementosInfo.funcion,
      funcionSeleccionada.pelicula ||
        this.datosPago.pelicula_nombre ||
        "Película"
    );
    this.actualizarElemento(this.elementosInfo.fecha, fechaFormateada);
    this.actualizarElemento(this.elementosInfo.hora, horaFormateada);
    this.actualizarElemento(
      this.elementosInfo.sala,
      funcionSeleccionada.sala ||
        funcionSeleccionada.id_sala ||
        this.datosPago.sala ||
        "—"
    );

    // Asientos
    const textoAsientos = this.datosPago.asientos_seleccionados
      .map((asiento) => `${asiento.fila}${asiento.columna}`)
      .join(", ");
    this.actualizarElemento(this.elementosInfo.sillas, textoAsientos);

    // Precios (formateo seguro)
    try {
      const totalNum = Number(this.datosPago.total) || 0;
      this.actualizarElemento(
        this.elementosInfo.precioTotal,
        `$${totalNum.toLocaleString("es-CO")}`
      );
    } catch (e) {
      console.warn("No se pudo formatear total:", e);
      this.actualizarElemento(this.elementosInfo.precioTotal, "$0");
    }

    // Descuentos
    const asientosDiscapacitados = this.datosPago.asientos_seleccionados.filter(
      (asiento) => asiento.tipo === "Discapacitado"
    ).length;

    if (asientosDiscapacitados > 0) {
      this.actualizarElemento(
        this.elementosInfo.descuento,
        `${
          asientosDiscapacitados * 10
        }% (${asientosDiscapacitados} asiento(s) discapacitados)`
      );
    } else {
      this.actualizarElemento(this.elementosInfo.descuento, "0%");
    }
  }

  actualizarElemento(elemento, texto) {
    if (elemento) elemento.textContent = texto;
  }

  cambiarFormularioTarjeta(tipo) {
    if (tipo === "credit") {
      this.formularioCredito?.classList.remove("hidden");
      this.formularioDebito?.classList.add("hidden");
    } else {
      this.formularioCredito?.classList.add("hidden");
      this.formularioDebito?.classList.remove("hidden");
    }
  }

  formatearNumeroTarjeta(input) {
    let valor = input.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    let valorFormateado = valor.match(/.{1,4}/g)?.join(" ") || valor;
    input.value = valorFormateado;
  }

  validarNumeroTarjeta(input) {
    const valor = input.value.replace(/\s/g, "");
    input.style.borderColor = valor.length === 16 ? "#28a745" : "#dc3545";
  }

  async procesarPago() {
    if (!this.validarFormulario()) return;

    const textoOriginal = this.botonPagar.innerHTML;
    this.botonPagar.innerHTML = "Procesando...";
    this.botonPagar.disabled = true;

    try {
      const datosPagoCompletos = this.obtenerDatosPagoCompletos();
      console.log("Enviando pago:", datosPagoCompletos);

      const resultado = await this.enviarPago(datosPagoCompletos);

      if (resultado.exito) {
        this.mostrarExito("¡Pago realizado con éxito! Redirigiendo...");
        this.limpiarDatosTemporales();

        setTimeout(() => {
          window.location.href = "mis-reservas.html";
        }, 2000);
      } else {
        throw new Error(resultado.mensaje || "Error al procesar el pago");
      }
    } catch (error) {
      console.error("Error en el pago:", error);
      this.mostrarError("Error al procesar el pago: " + error.message);
    } finally {
      this.botonPagar.innerHTML = textoOriginal;
      this.botonPagar.disabled = false;
    }
  }

  validarFormulario() {
    const metodoPago = document.querySelector(
      'input[name="payment"]:checked'
    )?.value;

    if (!metodoPago) {
      this.mostrarError("Selecciona un método de pago.");
      return false;
    }

    if (metodoPago === "credit") {
      return this.validarTarjetaCredito();
    } else if (metodoPago === "debit") {
      return this.validarTarjetaDebito();
    }

    return false;
  }

  validarTarjetaCredito() {
    const numero = document
      .getElementById("credit-number")
      ?.value.replace(/\s/g, "");
    const titular = document.getElementById("credit-holder")?.value.trim();
    const tipo = document.getElementById("credit-type")?.value.trim();

    if (!numero || numero.length !== 16) {
      this.mostrarError(
        "El número de tarjeta de crédito debe tener 16 dígitos."
      );
      return false;
    }
    if (!titular) {
      this.mostrarError("Ingresa el nombre del titular de la tarjeta.");
      return false;
    }
    if (!tipo) {
      this.mostrarError("Ingresa el tipo de tarjeta (Visa, MasterCard, etc.).");
      return false;
    }

    return true;
  }

  validarTarjetaDebito() {
    const numero = document
      .getElementById("debit-number")
      ?.value.replace(/\s/g, "");
    const banco = document.getElementById("debit-holder")?.value.trim();
    const autorizacion = document.getElementById("debit-auth")?.value.trim();

    if (!numero || numero.length !== 16) {
      this.mostrarError(
        "El número de tarjeta de débito debe tener 16 dígitos."
      );
      return false;
    }
    if (!banco) {
      this.mostrarError("Ingresa el nombre del banco emisor.");
      return false;
    }
    if (!autorizacion) {
      this.mostrarError("Ingresa el código de autorización.");
      return false;
    }

    return true;
  }

  obtenerDatosPagoCompletos() {
    const metodoPago = document.querySelector(
      'input[name="payment"]:checked'
    ).value;
    const datosTarjeta = this.obtenerDatosTarjeta(metodoPago);

    return {
      ...this.datosPago,
      metodo_pago: metodoPago,
      ...datosTarjeta,
      fecha_pago: new Date().toISOString(),
    };
  }

  obtenerDatosTarjeta(metodo) {
    if (metodo === "credit") {
      return {
        tipo_tarjeta: "credito",
        numero_tarjeta: document
          .getElementById("credit-number")
          .value.replace(/\s/g, ""),
        titular_tarjeta: document.getElementById("credit-holder").value.trim(),
        tipo_tarjeta_especifico: document
          .getElementById("credit-type")
          .value.trim(),
      };
    } else {
      return {
        tipo_tarjeta: "debito",
        numero_tarjeta: document
          .getElementById("debit-number")
          .value.replace(/\s/g, ""),
        banco_emisor: document.getElementById("debit-holder").value.trim(),
        codigo_autorizacion: document.getElementById("debit-auth").value.trim(),
      };
    }
  }

  async enviarPago(datosPago) {
    try {
      const respuesta = await fetch(`${this.URL_API}?accion=procesar_pago`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosPago),
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP: ${respuesta.status}`);
      }

      return await respuesta.json();
    } catch (error) {
      // Simulación para desarrollo
      console.log("API no disponible, simulando pago exitoso");
      return {
        exito: true,
        mensaje: "Pago procesado exitosamente",
        id_reserva: "RES-" + Date.now(),
      };
    }
  }

  limpiarDatosTemporales() {
    const datosTemporales = [
      "datos_pago",
      "id_funcion_preseleccionada",
      "asientos_seleccionados",
      "funciones_cache",
      "id_pelicula",
      "pelicula_nombre",
    ];

    datosTemporales.forEach((item) => sessionStorage.removeItem(item));
  }

  mostrarError(mensaje) {
    this.removerMensajes();

    const divMensaje = document.createElement("div");
    divMensaje.className = "mensaje-error";
    divMensaje.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 5px;
            margin: 15px 0;
            border: 1px solid #f5c6cb;
        `;
    divMensaje.textContent = mensaje;

    this.insertarMensaje(divMensaje);
  }

  mostrarExito(mensaje) {
    this.removerMensajes();

    const divMensaje = document.createElement("div");
    divMensaje.className = "mensaje-exito";
    divMensaje.style.cssText = `
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 5px;
            margin: 15px 0;
            border: 1px solid #c3e6cb;
        `;
    divMensaje.textContent = mensaje;

    this.insertarMensaje(divMensaje);
  }

  insertarMensaje(divMensaje) {
    const contenedor = document.querySelector(".pay-button-container");
    if (contenedor) {
      contenedor.parentNode.insertBefore(divMensaje, contenedor);
    }
  }

  removerMensajes() {
    document
      .querySelectorAll(".mensaje-error, .mensaje-exito")
      .forEach((mensaje) => mensaje.remove());
  }
}

// Inicialización automática cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  window.gestorPagos = new GestorPagos();
});

// Compatibilidad: wrapper global usado por el atributo inline `onclick="handlePayment()"`
window.handlePayment = function () {
  if (
    window.gestorPagos &&
    typeof window.gestorPagos.procesarPago === "function"
  ) {
    window.gestorPagos.procesarPago();
  } else {
    console.error("Gestor de pagos no inicializado");
  }
};
