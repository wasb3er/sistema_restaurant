// static/js/cook.js

//Carga pedidos "enviados_a_cocina" y "listos" desde la API
async function actualizarPedidos() {
  try {
    const resp = await fetch('/api/pedidos/en_cocina/');
    const data = await resp.json();

    const pendientes = document.getElementById('pendingList');
    const listos = document.getElementById('readyList');
    pendientes.innerHTML = '';
    listos.innerHTML = '';

    if (!data.pedidos || data.pedidos.length === 0) {
      pendientes.innerHTML = '<div class="empty">No hay pedidos pendientes.</div>';
      listos.innerHTML = '<div class="empty">No hay pedidos listos.</div>';
      return;
    }

    data.pedidos.forEach(p => {
      const div = document.createElement('div');
      div.classList.add('order-box');

      div.innerHTML = `
        <div class="order-header">
          <span><strong>Pedido #${p.id}</strong></span>
          <span>${p.nombre_cliente}</span>
        </div>
        <div class="order-body">
          <p>Personas: ${p.personas}</p>
          <p>Total: $${p.total}</p>
          <p><small>${p.fecha}</small></p>
        </div>
        ${
          p.estado === 'enviado_a_cocina'
            ? `<button onclick="marcarListo(${p.id})" class="btn-listo">✅ Marcar como listo</button>`
            : `<button onclick="volverPendiente(${p.id})" class="btn-pendiente">↩ Volver a cocina</button>`
        }
      `;

      if (p.estado === 'enviado_a_cocina') {
        pendientes.appendChild(div);
      } else if (p.estado === 'listo') {
        div.classList.add('ready');
        listos.appendChild(div);
      }
    });
  } catch (err) {
    console.error('Error al cargar pedidos:', err);
  }
}

//Marcar pedido como listo
async function marcarListo(id) {
  try {
    const resp = await fetch(`/api/pedido/${id}/marcar_listo/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCSRFToken() }
    });
    const data = await resp.json();

    if (data.success) {
      alert('✅ Pedido marcado como listo.');
      actualizarPedidos();
    } else {
      alert('Hubo un error, intente de nuevo ' + data.error);
    }
  } catch (err) {
    console.error('Error al marcar pedido como listo:', err);
  }
}

//Volver un pedido a estado "enviado_a_cocina"
async function volverPendiente(id) {
  try {
    const resp = await fetch(`/api/pedido/${id}/volver_cocina/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': getCSRFToken() }
    });
    const data = await resp.json();

    if (data.success) {
      alert('Pedido devuelto a cocina.');
      actualizarPedidos();
    } else {
      alert('⚠️ ' + data.error);
    }
  } catch (err) {
    console.error('Error al volver pedido:', err);
  }
}

//Obtener token CSRF
function getCSRFToken() {
  const name = 'csrftoken';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    if (cookie.trim().startsWith(name + '=')) {
      return cookie.trim().substring(name.length + 1);
    }
  }
  return '';
}

//Refrescar cada 2 segundos
setInterval(actualizarPedidos, 2000);
actualizarPedidos();
