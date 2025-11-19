// Establecer fecha máxima (31 de diciembre de 2007)
const fechaNacInput = document.getElementById('fecha-nac');
if (fechaNacInput) fechaNacInput.max = '2007-12-31';

// Validación al enviar el formulario y envío al backend
const form = document.querySelector('.registro-form');
const API_BASE = `${window.location.origin}/Muvwatch/backend/api/index.php`;

if (form) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const correo = document.getElementById('correo').value;
        const contrasena = document.getElementById('contrasena').value;
        const confirmarContrasena = document.getElementById('confirmar-contrasena').value;
        const nombres = document.getElementById('nombres').value;
        const apellidos = document.getElementById('apellidos').value;
        const tipoDoc = document.getElementById('tipo-doc').value;
        const docNum = document.getElementById('doc-num').value;
        const fechaNac = document.getElementById('fecha-nac').value;
        const celular = document.getElementById('celular').value;
        const terminos = document.getElementById('terminos').checked;
        const privacidad = document.getElementById('privacidad').checked;

        // Validar que las contraseñas coincidan
        if (contrasena !== confirmarContrasena) {
            alert('Las contraseñas no coinciden');
            return;
        }

        // Validar fecha de nacimiento
        if (!fechaNac) {
            alert('Por favor selecciona tu fecha de nacimiento');
            return;
        }

        //Validar que la fecha de nacimiento se encuentre en el rango establecido
        const fechaSeleccionada = new Date(fechaNac);
        const fechaMaxima = new Date('2007-12-31');
        const fechaMinima = new Date('1900-01-01');

        if (fechaSeleccionada > fechaMaxima) {
            alert('Debes tener al menos 18 años para registrarte');
            return;
        }

        if (fechaSeleccionada < fechaMinima) {
            alert('Por favor ingresa una fecha válida');
            return;
        }

        //Verificar que el usuario haya aceptado los terminnos y condiciones
        if (!terminos) {
            alert('Debes aceptar los Términos y Condiciones');
            return;
        }

        if (!privacidad) {
            alert('Debes autorizar el uso de tu información personal');
            return;
        }

        //Validar que el celular tenga solo 10 dígitos
        const celularRegex = /^[0-9]{10}$/;
        if (!celularRegex.test(celular)) {
            alert('El celular debe contener exactamente 10 dígitos');
            return;
        }

        // Preparar payload para el backend (nombres esperados por el API PHP)
        const payload = {
            nombres: nombres,
            apellidos: apellidos,
            correo: correo,
            'contraseña': contrasena,
            telefono: celular,
            tipo_documento: tipoDoc,
            numero_documento: docNum,
            fecha_nacimiento: fechaNac
        };

        try {
            const respuesta = await fetch(`${API_BASE}?accion=registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const resultado = await respuesta.json();

            if (resultado.exito) {
                alert(resultado.mensaje || 'Registro exitoso. Ya puedes iniciar sesión');
                // Redirigir al login (archivo en la misma carpeta `src`)
                window.location.href = 'login.html';
            } else {
                alert(resultado.mensaje || 'Error al registrar');
            }

        } catch (error) {
            console.error('Error en la petición de registro:', error);
            alert('Hubo un error de conexión con el servidor');
        }

    });
}

// Validación en tiempo real para las contraseñas
document.getElementById('confirmar-contrasena').addEventListener('input', function() {
    const contrasena = document.getElementById('contrasena').value;
    const confirmar = this.value;
    
    if (confirmar && contrasena !== confirmar) {
        this.setCustomValidity('Las contraseñas no coinciden');
        this.style.borderColor = '#d32f2f';
    } else {
        this.setCustomValidity('');
        this.style.borderColor = '#999';
    }
});

// Validación para el celular (solo números)
document.getElementById('celular').addEventListener('input', function() {
    this.value = this.value.replace(/[^0-9]/g, '');
    
    if (this.value.length > 10) {
        this.value = this.value.slice(0, 10);
    }
});