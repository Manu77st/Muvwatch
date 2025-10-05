// Toggle between credit and debit card forms
const creditRadio = document.getElementById('credit');
const debitRadio = document.getElementById('debit');
const creditCard = document.getElementById('creditCard');
const debitCard = document.getElementById('debitCard');

creditRadio.addEventListener('change', function () {
    if (this.checked) {
        creditCard.style.display = 'block';
        debitCard.style.display = 'none';
    }
});

debitRadio.addEventListener('change', function () {
    if (this.checked) {
        creditCard.style.display = 'none';
        debitCard.style.display = 'block';
    }
});

// Handle payment button click
function handlePayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    const cardType = paymentMethod === 'credit' ? 'crédito' : 'débito';

    alert(`Procesando pago con tarjeta de ${cardType}...`);
}

// Format card number input (add spaces every 4 digits)
const cardInputs = document.querySelectorAll('input[type="text"]');
cardInputs.forEach(input => {
    if (input.previousElementSibling.textContent.includes('N° tarjeta')) {
        input.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\s/g, '');
            if (value.length > 0) {
                value = value.match(/.{1,4}/g).join(' ');
            }
            e.target.value = value;
        });
    }
});

function showPaymentCard(type) {
    const credit = document.getElementById('creditCard');
    const debit = document.getElementById('debitCard');

    if (type === 'credit') {
        credit.classList.remove('hidden');
        debit.classList.add('hidden');
    } else {
        credit.classList.add('hidden');
        debit.classList.remove('hidden');
    }
}