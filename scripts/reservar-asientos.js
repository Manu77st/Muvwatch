// reservar-asientos.js 
// Agrega esto al inicio de la función inicio() para debug
async function inicio() {
    try {
        console.log("🔄 Iniciando página de reserva...");
        console.log("📋 sessionStorage actual:", {
            id_pelicula: sessionStorage.getItem("id_pelicula"),
            pelicula_nombre: sessionStorage.getItem("pelicula_nombre"),
            funciones_cache: sessionStorage.getItem("funciones_cache") ? "EXISTE" : "NO EXISTE"
        });
        
        // Limpiar cache corrupto al inicio
        limpiarCacheCorrupto();
        
        idPelicula = obtenerIdPelicula();
        
        if (!idPelicula) {
            msg("Error: No se pudo identificar la película");
            setTimeout(() => window.location.href = "lobby-cliente.html", 2000);
            return;
        }

        console.log("✅ ID Película encontrado:", idPelicula);
        await cargarNombrePelicula(idPelicula);
        await cargarFunciones(idPelicula);

    } catch (err) {
        console.error("❌ Error en inicialización:", err);
        msg("Error al cargar los datos");
    }
}
(() => {
  "use strict";

  const API = "../../backend/api/index.php";

  // --- DOM ---
  const selectFunciones = document.getElementById("selectFunciones");
  const bloqueL = document.getElementById("bloqueAsientosIzquierda");
  const bloqueR = document.getElementById("bloqueAsientosDerecha");
  const contador = document.getElementById("contadorSeleccionadas");
  const botonConfirmar = document.getElementById("botonConfirmar");
  const reservaMensaje = document.getElementById("reservaMensaje");
  const indicador = document.getElementById("loadingIndicator");

  const funcionNombre = document.getElementById("funcionNombre");
  const funcionFecha = document.getElementById("funcionFecha");
  const tituloSala = document.querySelector(".panel-sala h2");

  // --- Estado ---
  let funciones = [];
  let asientos = [];
  let seleccionados = [];
  let idFuncion = null;
  let precioBase = 0;
  let idPelicula = null;

  // -------------------------
  // Helper: fetch seguro
  // -------------------------
  async function api(url, opciones = {}) {
    opciones.credentials = opciones.credentials || "include";
    
    try {
      const resp = await fetch(url, opciones);
      const text = await resp.text();
      
      if (text.trim().startsWith('<!') || text.includes('<br />') || text.includes('<b>')) {
        console.error('❌ El servidor devolvió HTML:', text.substring(0, 200));
        throw new Error('Error del servidor');
      }
      
      let datos;
      try {
        datos = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', text.substring(0, 200));
        throw new Error('Respuesta inválida');
      }
      
      if (!resp.ok) {
        throw new Error(`Error ${resp.status}: ${datos.mensaje || 'Error del servidor'}`);
      }
      
      return datos;
      
    } catch (error) {
      console.error('❌ Error en petición API:', error);
      throw error;
    }
  }

  const loading = (b) => {
    if (indicador) indicador.style.display = b ? "block" : "none";
  };

  const msg = (t) => {
    if (reservaMensaje) {
      reservaMensaje.style.display = t ? "block" : "none";
      reservaMensaje.textContent = t || "";
    }
  };

  // -------------------------
  // Calcular precio por tipo de silla
  // -------------------------
  function calcularPrecioAsiento(tipoAsiento) {
    const precioStandard = precioBase;
    if (tipoAsiento === 'Discapacitado') {
      return Math.round(precioStandard * 0.9); // 10% de descuento
    }
    return precioStandard;
  }

  // -------------------------
  // Filtrar funciones futuras
  // -------------------------
  function filtrarFuncionesFuturas(funcionesArray) {
    const ahora = new Date();
    return funcionesArray.filter(funcion => 
      new Date(funcion.fecha_funcion) > ahora
    ).sort((a, b) => new Date(a.fecha_funcion) - new Date(b.fecha_funcion));
  }

  // -------------------------
  // Limpiar cache corrupto
  // -------------------------
  function limpiarCacheCorrupto() {
    try {
      const funcionesCache = sessionStorage.getItem("funciones_cache");
      if (funcionesCache) {
        const datos = JSON.parse(funcionesCache);
        if (Array.isArray(datos) && datos.length === 0) {
          console.log("🔄 Limpiando cache corrupto...");
          sessionStorage.removeItem("funciones_cache");
          return true;
        }
      }
    } catch (e) {
      console.warn("Error limpiando cache:", e);
    }
    return false;
  }

  // -------------------------
  // Inicialización
  // -------------------------
  async function inicio() {
    try {
      console.log("🔄 Iniciando página de reserva...");
      
      // Limpiar cache corrupto al inicio
      limpiarCacheCorrupto();
      
      idPelicula = obtenerIdPelicula();
      
      if (!idPelicula) {
        msg("Error: No se pudo identificar la película");
        setTimeout(() => window.location.href = "lobby-cliente.html", 2000);
        return;
      }

      console.log("✅ ID Película encontrado:", idPelicula);
      await cargarNombrePelicula(idPelicula);
      await cargarFunciones(idPelicula);

    } catch (err) {
      console.error("❌ Error en inicialización:", err);
      msg("Error al cargar los datos");
    }
  }

  function obtenerIdPelicula() {
    if (window.__selectedPeliculaId) {
      return window.__selectedPeliculaId;
    }
    const idSession = sessionStorage.getItem("id_pelicula");
    if (idSession) {
      return idSession;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const idUrl = urlParams.get('id_pelicula');
    return idUrl;
  }

  async function cargarNombrePelicula(idPelicula) {
    try {
        console.log("🔍 Buscando nombre para película ID:", idPelicula);
        
        // 1. Intentar desde cache global (si existe)
        if (window.peliculasCache && window.peliculasCache[idPelicula]) {
            const nombre = window.peliculasCache[idPelicula].nombre;
            console.log("✅ Nombre desde cache global:", nombre);
            if (funcionNombre) {
                funcionNombre.textContent = nombre;
                // Guardar en sessionStorage para futuras referencias
                sessionStorage.setItem("pelicula_nombre", nombre);
            }
            return;
        }

        // 2. Intentar desde sessionStorage
        const nombreSession = sessionStorage.getItem("pelicula_nombre");
        if (nombreSession && funcionNombre) {
            console.log("✅ Nombre desde sessionStorage:", nombreSession);
            funcionNombre.textContent = nombreSession;
            return;
        }

        // 3. Intentar desde funciones cache
        const funcionesCache = sessionStorage.getItem("funciones_cache");
        if (funcionesCache) {
            try {
                const funciones = JSON.parse(funcionesCache);
                if (funciones.length > 0 && funciones[0].pelicula) {
                    const nombre = funciones[0].pelicula;
                    console.log("✅ Nombre desde funciones cache:", nombre);
                    if (funcionNombre) {
                        funcionNombre.textContent = nombre;
                        sessionStorage.setItem("pelicula_nombre", nombre);
                    }
                    return;
                }
            } catch (e) {
                console.warn("Error leyendo funciones cache:", e);
            }
        }

        // 4. Último recurso: llamar a la API
        console.log("🔄 Consultando API para nombre de película...");
        try {
            const res = await api(`${API}?accion=pelicula&id=${idPelicula}`);
            if (res.exito && res.datos && res.datos.nombre) {
                const nombre = res.datos.nombre;
                console.log("✅ Nombre desde API:", nombre);
                if (funcionNombre) {
                    funcionNombre.textContent = nombre;
                    sessionStorage.setItem("pelicula_nombre", nombre);
                }
            } else {
                throw new Error("No se pudo obtener el nombre de la película");
            }
        } catch (apiError) {
            console.error("❌ Error API pelicula:", apiError);
            // Valor por defecto
            if (funcionNombre) {
                funcionNombre.textContent = "Película #" + idPelicula;
            }
        }

    } catch (err) {
        console.error("❌ Error en cargarNombrePelicula:", err);
        // Valor por defecto como fallback
        if (funcionNombre) {
            funcionNombre.textContent = "Película";
        }
    }
}

  // -------------------------
  // Cargar funciones - VERSIÓN CORREGIDA
  // -------------------------
  async function cargarFunciones(idPelicula) {
    loading(true);
    msg("Cargando funciones...");
    
    try {
      console.log("🔄 Cargando funciones para película:", idPelicula);

      // Intentar desde cache primero, pero con validación
      const funcionesCache = sessionStorage.getItem("funciones_cache");
      if (funcionesCache) {
        try {
          const cacheData = JSON.parse(funcionesCache);
          
          // Validar que el cache no esté corrupto o vacío
          if (Array.isArray(cacheData) && cacheData.length > 0) {
            // ✅ FILTRAR FUNCIONES FUTURAS DEL CACHE
            funciones = filtrarFuncionesFuturas(cacheData);
            console.log("✅ Funciones desde cache (futuras):", funciones.length);
            renderizarFunciones();
            loading(false);
            return;
          } else {
            console.warn("⚠️ Cache vacío o inválido, forzando recarga API");
            sessionStorage.removeItem("funciones_cache");
          }
        } catch (e) {
          console.warn("⚠️ Cache corrupto, cargando desde API");
          sessionStorage.removeItem("funciones_cache");
        }
      }

      // Cargar desde API
      console.log("🔄 Solicitando datos desde API...");
      const res = await api(`${API}?accion=pelicula&id=${idPelicula}`);
      
      if (!res.exito) {
        throw new Error(res.mensaje || "Error al cargar funciones");
      }
      
      if (!res.datos) {
        throw new Error("No se encontraron datos de la película");
      }

      // Verificar si hay funciones
      if (!res.datos.funciones || res.datos.funciones.length === 0) {
        console.warn("❌ No hay funciones en la respuesta API");
        msg("No hay funciones disponibles para esta película");
        funciones = [];
        renderizarFunciones();
        return;
      }

      // ✅ FILTRAR SOLO FUNCIONES FUTURAS
      funciones = filtrarFuncionesFuturas(res.datos.funciones);
      console.log("✅ Funciones futuras cargadas desde API:", funciones.length);
      console.log("📋 Detalle de funciones:", funciones);
      
      // Guardar en cache SOLO si hay funciones válidas
      if (funciones.length > 0) {
        try {
          sessionStorage.setItem("funciones_cache", JSON.stringify(funciones));
          console.log("💾 Cache actualizado con", funciones.length, "funciones futuras");
        } catch (e) {
          console.warn("No se pudo guardar en cache");
        }
      }
      
      renderizarFunciones();

    } catch (err) {
      console.error("❌ Error cargando funciones:", err);
      msg("Error: " + err.message);
      mostrarFuncionesEjemplo();
    } finally {
      loading(false);
    }
  }

  function mostrarFuncionesEjemplo() {
    console.warn("🔄 Mostrando funciones de ejemplo por fallo en API");
    
    // Funciones de ejemplo realistas (solo futuras)
    const ahora = new Date();
    funciones = [
      {
        id_funcion: 1,
        fecha_funcion: new Date(ahora.getTime() + 86400000).toISOString().split('T')[0], // Mañana
        sala: "1",
        id_sala: 1,
        precio: 15000,
        descuento: 2000,
        pelicula: "Inception"
      },
      {
        id_funcion: 2,
        fecha_funcion: new Date(ahora.getTime() + 172800000).toISOString().split('T')[0], // Pasado mañana
        sala: "2", 
        id_sala: 2,
        precio: 15000,
        descuento: 0,
        pelicula: "Inception"
      }
    ];
    
    renderizarFunciones();
    msg("Mostrando datos de ejemplo - Error de conexión");
  }

  function renderizarFunciones() {
    if (!selectFunciones) {
      console.error("❌ selectFunciones no encontrado en DOM");
      return;
    }

    selectFunciones.innerHTML = '<option value="">-- Seleccione una función --</option>';
    
    if (funciones.length === 0) {
      console.warn("⚠️ No hay funciones para renderizar");
      msg("No hay funciones disponibles para esta película");
      return;
    }

    funciones.forEach((funcion) => {
      const option = document.createElement("option");
      option.value = funcion.id_funcion;
      
      const fecha = new Date(funcion.fecha_funcion);
      const fechaFormateada = fecha.toLocaleDateString('es-CO', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      
      const precioFinal = funcion.precio - (funcion.descuento || 0);
      option.textContent = `${fechaFormateada} - Sala ${funcion.sala || funcion.id_sala} - $${precioFinal.toLocaleString('es-CO')}`;
      option.dataset.precio = funcion.precio;
      option.dataset.sala = funcion.sala || funcion.id_sala;
      option.dataset.fecha = funcion.fecha_funcion;
      option.dataset.descuento = funcion.descuento || 0;
      
      selectFunciones.appendChild(option);
    });

    console.log("✅ Funciones renderizadas:", funciones.length);
    selectFunciones.onchange = manejarCambioFuncion;
  }

  function manejarCambioFuncion() {
    const funcionId = selectFunciones.value;
    
    if (!funcionId) {
      limpiarSala();
      return;
    }

    idFuncion = funcionId;
    const funcionSeleccionada = funciones.find(f => f.id_funcion == funcionId);
    
    if (!funcionSeleccionada) {
      console.error("❌ Función seleccionada no encontrada");
      return;
    }

    console.log("✅ Función seleccionada:", funcionSeleccionada);
    actualizarInfoFuncion(funcionSeleccionada);
    cargarAsientos(funcionId);
  }

  function actualizarInfoFuncion(funcion) {
    if (!funcion) return;

    if (funcionFecha) {
      const fecha = new Date(funcion.fecha_funcion);
      funcionFecha.textContent = fecha.toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (tituloSala) {
      const sala = funcion.sala || funcion.id_sala;
      tituloSala.textContent = `SALA ${sala} | ESTÁNDAR`;
    }

    precioBase = parseFloat(funcion.precio) - parseFloat(funcion.descuento || 0);
    
    // Actualizar información de precios en el panel
    actualizarInfoPrecios();
    
    console.log("💰 Precio base actual:", precioBase);
  }

  function actualizarInfoPrecios() {
    const precioStandard = precioBase;
    const precioDiscapacitado = Math.round(precioBase * 0.9);
    
    const infoPrecios = document.querySelector('.seccion-info h4 + div');
    if (infoPrecios) {
      infoPrecios.innerHTML = `
        <div>Standard $${precioStandard.toLocaleString('es-CO')}</div>
        <div>Discapacitados $${precioDiscapacitado.toLocaleString('es-CO')} (10% descuento)</div>
      `;
    }
  }

  async function cargarAsientos(funcionId) {
    loading(true);
    msg("Cargando asientos...");
    
    try {
      console.log("🔄 Cargando asientos para función:", funcionId);
      
      const res = await api(`${API}?accion=obtener_asientos&id_funcion=${funcionId}`);
      
      if (!res.exito) throw new Error(res.mensaje);
      if (!res.datos || !res.datos.asientos) {
        throw new Error("No se pudieron cargar los asientos");
      }

      asientos = res.datos.asientos;
      console.log("✅ Asientos cargados:", asientos.length);
      
      renderizarAsientos();
      msg("");

    } catch (err) {
      console.error("❌ Error cargando asientos:", err);
      msg("Error al cargar asientos");
      mostrarAsientosEjemplo();
    } finally {
      loading(false);
    }
  }

  function mostrarAsientosEjemplo() {
    console.warn("🔄 Mostrando asientos de ejemplo");
    
    asientos = generarAsientosEjemplo();
    renderizarAsientos();
  }

  function generarAsientosEjemplo() {
    const asientosEjemplo = [];
    const filas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const columnas = Array.from({length: 14}, (_, i) => i + 1);
    
    let id = 1;
    filas.forEach(fila => {
      columnas.forEach(columna => {
        const disponible = Math.random() > 0.3; // 70% disponibles
        const tipo = fila === 'A' && Math.random() > 0.7 ? 'Discapacitado' : 'Standard';
        
        asientosEjemplo.push({
          id_silla: id++,
          fila: fila,
          columna: columna,
          activa: 1,
          disponible: disponible ? 1 : 0,
          tipo: tipo
        });
      });
    });
    
    return asientosEjemplo;
  }

  // -------------------------
  // RENDERIZADO DE ASIENTOS
  // -------------------------
  function renderizarAsientos() {
    console.log("🎬 Renderizando asientos...");
    
    if (!bloqueL || !bloqueR) {
      console.error("❌ Bloques de asientos no encontrados");
      return;
    }

    bloqueL.innerHTML = '';
    bloqueR.innerHTML = '';

    const asientosPorFila = {};
    asientos.forEach(asiento => {
      if (!asientosPorFila[asiento.fila]) {
        asientosPorFila[asiento.fila] = [];
      }
      asientosPorFila[asiento.fila].push(asiento);
    });

    const filasOrdenadas = Object.keys(asientosPorFila).sort();

    filasOrdenadas.forEach(fila => {
      const asientosFila = asientosPorFila[fila].sort((a, b) => a.columna - b.columna);
      
      const columnas = asientosFila.map(a => a.columna);
      const columnaMax = Math.max(...columnas);
      const puntoDivision = Math.ceil(columnaMax / 2);

      const filaIzquierda = document.createElement('div');
      const filaDerecha = document.createElement('div');
      
      filaIzquierda.className = 'fila-asientos';
      filaDerecha.className = 'fila-asientos';

      const labelIzquierda = document.createElement('div');
      labelIzquierda.className = 'label-fila';
      labelIzquierda.textContent = fila;
      filaIzquierda.appendChild(labelIzquierda);

      const labelDerecha = document.createElement('div');
      labelDerecha.className = 'label-fila';
      labelDerecha.textContent = fila;
      filaDerecha.appendChild(labelDerecha);

      asientosFila.forEach(asiento => {
        const divAsiento = crearDivAsiento(asiento);
        
        if (asiento.columna <= puntoDivision) {
          filaIzquierda.appendChild(divAsiento);
        } else {
          filaDerecha.appendChild(divAsiento);
        }
      });

      if (filaIzquierda.children.length > 1) {
        bloqueL.appendChild(filaIzquierda);
      }
      if (filaDerecha.children.length > 1) {
        bloqueR.appendChild(filaDerecha);
      }
    });

    console.log("✅ Asientos renderizados:", asientos.length);
  }

  function crearDivAsiento(asiento) {
    const div = document.createElement('div');
    div.className = 'asiento';
    div.dataset.id = asiento.id_silla;
    div.dataset.fila = asiento.fila;
    div.dataset.columna = asiento.columna;
    div.dataset.tipo = asiento.tipo;

    let estado, color, cursor, texto;
    
    if (!asiento.activa) {
      estado = 'inactiva';
      color = '#95a5a6';
      cursor = 'not-allowed';
      texto = '❌';
    } else if (!asiento.disponible) {
      estado = 'ocupada';
      color = '#e74c3c';
      cursor = 'not-allowed';
      texto = '✖';
    } else if (seleccionados.includes(asiento.id_silla)) {
      estado = 'seleccionada';
      color = '#3498db';
      cursor = 'pointer';
      texto = asiento.fila + asiento.columna;
    } else {
      estado = 'disponible';
      color = asiento.tipo === 'Discapacitado' ? '#9b59b6' : '#2ecc71';
      cursor = 'pointer';
      texto = asiento.fila + asiento.columna;
    }

    div.dataset.estado = estado;
    div.style.cssText = `
      width: 35px;
      height: 35px;
      background: ${color};
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: ${cursor};
      font-size: 10px;
      font-weight: bold;
      color: white;
      transition: all 0.2s ease;
      border: 2px solid ${estado === 'seleccionada' ? '#f1c40f' : 'transparent'};
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;

    div.textContent = texto;
    
    const precioAsiento = calcularPrecioAsiento(asiento.tipo);
    div.title = `Asiento ${asiento.fila}${asiento.columna} - ${asiento.tipo} - $${precioAsiento.toLocaleString('es-CO')} - ${estado}`;

    if (asiento.activa && asiento.disponible) {
      div.addEventListener('click', () => toggleAsiento(asiento.id_silla, div));
    }

    return div;
  }

  function toggleAsiento(idAsiento, elemento) {
    const index = seleccionados.indexOf(idAsiento);
    
    if (index > -1) {
      seleccionados.splice(index, 1);
      const asiento = asientos.find(a => a.id_silla == idAsiento);
      elemento.style.background = asiento.tipo === 'Discapacitado' ? '#9b59b6' : '#2ecc71';
      elemento.style.border = '2px solid transparent';
      elemento.textContent = asiento.fila + asiento.columna;
    } else {
      seleccionados.push(idAsiento);
      elemento.style.background = '#3498db';
      elemento.style.border = '2px solid #f1c40f';
      elemento.textContent = '✓';
    }
    
    actualizarContador();
  }

  function limpiarSala() {
    if (bloqueL) bloqueL.innerHTML = '';
    if (bloqueR) bloqueR.innerHTML = '';
    if (funcionFecha) funcionFecha.textContent = "—";
    if (tituloSala) tituloSala.textContent = "SALA —";
    
    seleccionados = [];
    actualizarContador();
  }

  function actualizarContador() {
    if (contador) contador.textContent = seleccionados.length;
    
    let total = 0;
    seleccionados.forEach(idAsiento => {
      const asiento = asientos.find(a => a.id_silla == idAsiento);
      if (asiento) {
        total += calcularPrecioAsiento(asiento.tipo);
      }
    });
    
    const totalElement = document.getElementById("totalSeleccion");
    if (totalElement) {
      totalElement.textContent = `$${total.toLocaleString("es-CO")}`;
    }
  }

  if (botonConfirmar) {
    botonConfirmar.onclick = async () => {
      if (!idFuncion) return alert("Selecciona una función");
      if (seleccionados.length === 0) return alert("Selecciona al menos un asiento");

      try {
        const body = {
          id_funcion: idFuncion,
          asientos: seleccionados,
        };

        const r = await api(`${API}?accion=crear_reserva`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!r.exito) throw new Error(r.mensaje);

        alert("Reserva creada con éxito");
        window.location.href = "mis-reservas.html";
      } catch (err) {
        console.error(err);
        alert("Error al crear la reserva: " + err.message);
      }
    };
  }

  // -------------------------
  // DEBUG Y UTILIDADES
  // -------------------------
  function forzarRecargaAPI() {
    console.log("🔧 Forzando recarga desde API...");
    sessionStorage.removeItem("funciones_cache");
    location.reload();
  }

  // Auto-diagnóstico después de 3 segundos
  setTimeout(() => {
    if (funciones.length === 0) {
      console.warn("⚠️ AUTO-DIAGNÓSTICO: No se cargaron funciones");
      console.log("💡 Sugerencia: Ejecuta forzarRecargaAPI() en la consola");
    }
  }, 3000);

  // Exponer función de utilidad para consola
  window.forzarRecargaAPI = forzarRecargaAPI;

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicio);
  } else {
    inicio();
  }

})();