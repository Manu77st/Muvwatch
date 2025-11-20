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
    window.handlePayment = async function () {
        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const metodo = 'tarjeta'; // podrías mapear a 'efectivo', 'tarjeta', etc.

        const params = new URLSearchParams(window.location.search);
        const idFuncion = params.get('id_funcion');
        const total = Number(params.get('total') || '0');
        const sillasParam = params.get('sillas') || '';
        const sillas = sillasParam ? sillasParam.split(',') : [];

        if (!idFuncion || !total || !sillas.length) {
            alert('Faltan datos de la venta. Vuelva a intentar desde la selección de asientos.');
            return;
        }

        try {
            const response = await fetch('../backend/registrar_venta.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_funcion: Number(idFuncion),
                    total: total,
                    sillas: sillas,
                    metodo_pago: metodo,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                alert('Error al registrar la venta.');
                return;
            }

            alert(`Venta registrada. Ticket: ${data.numero_ticket}`);
            window.location.href = 'lobby-cajero.html';
        } catch (error) {
            console.error('Error en el pago:', error);
            alert('Ocurrió un error al procesar el pago.');
        }
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