function processPayment() {
    // Obtener valores de los campos
    const creditNumber = document.getElementById('credit-number').value;
    const creditHolder = document.getElementById('credit-holder').value;
    const creditType = document.getElementById('credit-type').value;
    const debitNumber = document.getElementById('debit-number').value;
    const debitBank = document.getElementById('debit-bank').value;
    const debitAuth = document.getElementById('debit-auth').value;

    // Validación básica
    if (!creditNumber && !debitNumber) {
        alert('Por favor, ingresa al menos un número de tarjeta');
        return;
    }

    // Simular procesamiento de pago
    const button = document.querySelector('.pay-button');
    const buttonText = document.querySelector('.pay-button-text');

    button.style.background = '#ccc';
    buttonText.textContent = 'Procesando...';
    button.disabled = true;

    setTimeout(() => {
        alert('¡Pago procesado exitosamente!');

        // Resetear botón
        button.style.background = '#1b629e';
        buttonText.textContent = 'Pagar';
        button.disabled = false;

        // Limpiar campos
        document.querySelectorAll('input').forEach(input => {
            input.value = '';
        });
    }, 2000);
}

// Validación en tiempo real para números de tarjeta
function validateCardNumber(input) {
    // Solo permitir números y espacios
    input.value = input.value.replace(/[^\d\s]/g, '');

    // Formatear con espacios cada 4 dígitos
    if (input.value.length > 0) {
        input.value = input.value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    }
}

// Agregar validación a los campos de número de tarjeta
document.getElementById('credit-number').addEventListener('input', function () {
    validateCardNumber(this);
});

document.getElementById('debit-number').addEventListener('input', function () {
    validateCardNumber(this);
});

// Efectos hover adicionales para interactividad
document.querySelectorAll('.input-container input').forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.style.borderColor = '#1b629e';
        this.parentElement.style.boxShadow = '0 0 0 2px rgba(27, 98, 158, 0.2)';
    });

    input.addEventListener('blur', function () {
        this.parentElement.style.borderColor = 'black';
        this.parentElement.style.boxShadow = 'none';
    });
});