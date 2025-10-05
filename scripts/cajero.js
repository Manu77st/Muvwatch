document.addEventListener('DOMContentLoaded', () => {
    // Elementos
    const creditRadio = document.getElementById('credit');
    const debitRadio = document.getElementById('debit');
    const creditCard = document.getElementById('creditCard');
    const debitCard = document.getElementById('debitCard');

    // Cambiando visibilidad de las tarjetas con la clase 'hidden'
    function showPaymentCard(type) {
        if (type === 'credit') {
            creditCard.classList.remove('hidden');
            debitCard.classList.add('hidden');
        } else {
            creditCard.classList.add('hidden');
            debitCard.classList.remove('hidden');
        }
    }

    // Actualizar UI basado en el radio seleccionado
    function updateFromRadios() {
        const checked = document.querySelector('input[name="payment"]:checked');
        if (checked) showPaymentCard(checked.value);
    }

    creditRadio.addEventListener('change', updateFromRadios);
    debitRadio.addEventListener('change', updateFromRadios);

    // Inicializar estado de la UI al cargar la página
    updateFromRadios();

    // Exponer función global para manejar el pago
    window.handlePayment = function () {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const cardType = paymentMethod === 'credit' ? 'crédito' : 'débito';
        alert(`Procesando pago con tarjeta de ${cardType}...`);
    };

    // Formato de número de tarjeta de crédito/débito en grupos de 4 dígitos
    const cardInputs = document.querySelectorAll('input[type="text"]');
    cardInputs.forEach(input => {
        const prev = input.previousElementSibling;
        if (prev && prev.textContent && prev.textContent.includes('N° tarjeta')) {
            input.addEventListener('input', function (e) {
                let value = e.target.value.replace(/\s/g, '');
                value = value.replace(/[^0-9]/g, '');
                if (value.length > 0) {
                    const parts = value.match(/.{1,4}/g) || [];
                    value = parts.join(' ');
                }
                e.target.value = value;
            });
        }
    });
});