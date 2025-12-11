// static/js/cook.js

/* ============================================================
   TOAST SUPERIOR
   ============================================================ */
function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;

    t.textContent = msg;
    t.classList.add("show");

    setTimeout(() => {
        t.classList.remove("show");
    }, 3500);
}

/* ============================================================
   CARGAR PEDIDOS DESDE API
   ============================================================ */
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

            const items = (p.items && p.items.length > 0)
                ? p.items.map(i => `<li>${i.nombre} x${i.cantidad}</li>`).join("")
                : "<li><em>Sin detalles registrados.</em></li>";

            let botones = "";

            // SOLO pedidos pendientes pueden marcarse como listos
            if (p.estado === "enviado_a_cocina") {
                botones = `
                    <button onclick="marcarListo(${p.id})" class="btn-listo">
                        Marcar como listo
                    </button>
                `;
            }

            div.innerHTML = `
                <div class="order-header">
                    <span><strong>Pedido #${p.id}</strong></span>
                    <span>${p.nombre_cliente || ""}</span>
                </div>

                <div class="order-body">
                    <ul class="order-items">${items}</ul>
                    <p><small>${p.fecha}</small></p>
                </div>

                ${botones}
            `;

            // PENDIENTES
            if (p.estado === "enviado_a_cocina") {
                pendientes.appendChild(div);
            }

            // LISTOS
            if (p.estado === "listo") {
                div.classList.add("ready");
                listos.appendChild(div);
            }
        });

    } catch (err) {
        console.error("Error al cargar pedidos:", err);
    }
}

/* ============================================================
   MARCAR COMO LISTO
   ============================================================ */
async function marcarListo(id) {
    try {
        const resp = await fetch(`/api/pedido/${id}/marcar_listo/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() }
        });

        const data = await resp.json();

        if (data.success) {
            toast("Pedido marcado como listo.");
            actualizarPedidos();
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        console.error("Error al marcar como listo:", err);
    }
}

/* ============================================================
   VOLVER A PENDIENTE (NO usado ahora, pero mantenido estable)
   ============================================================ */
async function volverPendiente(id) {
    try {
        const resp = await fetch(`/api/pedido/${id}/volver_cocina/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCSRFToken() }
        });

        const data = await resp.json();

        if (data.success) {
            toast("Pedido devuelto a cocina.");
            actualizarPedidos();
        } else {
            alert("Error: " + data.error);
        }

    } catch (err) {
        console.error("Error al devolver pedido:", err);
    }
}

/* ============================================================
   OBTENER TOKEN CSRF
   ============================================================ */
function getCSRFToken() {
    const name = "csrftoken";
    const cookies = document.cookie.split(";");

    for (let cookie of cookies) {
        if (cookie.trim().startsWith(name + "=")) {
            return cookie.trim().substring(name.length + 1);
        }
    }
    return "";
}

/* ============================================================
   AUTO-REFRESH
   ============================================================ */
setInterval(actualizarPedidos, 2000);
actualizarPedidos();
