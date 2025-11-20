document.addEventListener('DOMContentLoaded', () => {
  const clienteBox = document.getElementById('clienteBox');
  const menuCliente = document.getElementById('menuCliente');

  if (!clienteBox || !menuCliente) return;

  clienteBox.addEventListener('click', (event) => {
    event.stopPropagation();
    menuCliente.classList.toggle('show');
  });

  menuCliente.addEventListener('click', (event) => event.stopPropagation());

  document.addEventListener('click', () => {
    menuCliente.classList.remove('show');
  });
});
