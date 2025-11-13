//Versión mesero_script.js

const orderItems = document.getElementById("orderItems");
const totalAmount = document.getElementById("totalAmount");

//Cargar pedidos nuevos (pendientes/nuevos)
async function cargarPedidos() {
  try {
    const resp = await fetch("/api/pedidos/nuevos/");
    const data = await resp.json();

    orderItems.innerHTML = "";
    let total = 0;

    if (!data.pedidos || data.pedidos.length === 0) {
      orderItems.innerHTML = `<div style="padding:12px;color:#777">No hay pedidos nuevos</div>`;
      totalAmount.textContent = "$0";
      return;
    }

    data.pedidos.forEach(p => {
      const div = document.createElement("div");
      div.classList.add("pedido-item");
      div.innerHTML = `
        <div>
          <strong>Pedido #${p.id}</strong><br>
          Cliente: ${p.nombre_cliente}<br>
          Personas: ${p.personas}<br>
          Total: $${p.total}<br>
          Estado: ${p.estado}<br>
          <small>${p.fecha}</small>
        </div>
        <button class="btn small" onclick="enviarACocina(${p.id})">Enviar a cocina</button>
      `;
      orderItems.appendChild(div);
      total += p.total;
    });

    totalAmount.textContent = "$" + total.toLocaleString("es-CL");
  } catch (err) {
    console.error("Error al cargar pedidos:", err);
    orderItems.innerHTML = `<div style="color:red">Error al cargar pedidos</div>`;
  }
}

//Enviar pedido a cocina
async function enviarACocina(id) {
  try {
    const resp = await fetch(`/api/pedido/${id}/enviar_cocina/`, {
      method: "POST",
      headers: { "X-CSRFToken": getCSRFToken() },
    });
    const data = await resp.json();

    if (data.success) {
      alert("✅ Pedido enviado a cocina correctamente");
      cargarPedidos();
    } else {
      alert("Error " + data.error);
    }
  } catch (err) {
    console.error("Error al enviar pedido:", err);
  }
}

//Obtener token CSRF
function getCSRFToken() {
  const name = "csrftoken";
  for (const cookie of document.cookie.split(";")) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(name + "=")) return trimmed.substring(name.length + 1);
  }
  return "";
}

//Actualiza cada 2 segundos
setInterval(cargarPedidos, 2000);
cargarPedidos();
