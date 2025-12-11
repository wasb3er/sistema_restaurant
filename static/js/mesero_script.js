/* =====================================================
   VARIABLES GLOBALES
===================================================== */
let mesaSeleccionada = null;
let pedidoActualId = null;

/* Elementos del DOM */
const mesasGrid = document.getElementById("mesasGrid");
const panelTitle = document.getElementById("panelTitle");
const orderItems = document.getElementById("orderItems");
const totalAmount = document.getElementById("totalAmount");
const sendKitchenBtn = document.getElementById("sendKitchen");
const finishOrderBtn = document.getElementById("finishOrder");
const addItemBtn = document.getElementById("addItem");

const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filter");

/* Modal agregar ítem */
const modalAddItem = document.getElementById("modalAddItem");
const closeModalAddItem = document.getElementById("closeModalAddItem");
const modalItemsContainer = document.getElementById("modalItemsContainer");

/* =====================================================
   CARGAR MESAS
===================================================== */
async function cargarMesas() {
    try {
        const resp = await fetch("/api/mesas/");
        const data = await resp.json();

        mesasGrid.innerHTML = "";

        // Ordenar por número
        data.mesas.sort((a, b) => Number(a.numero) - Number(b.numero));

        data.mesas.forEach(m => {
            const card = document.createElement("div");
            card.classList.add("mesa-card");

            let estadoMesa = "libre";

            if (m.pedido) {
                const e = m.pedido.estado;

                if (["nuevo", "pendiente", "enviado_a_cocina"].includes(e)) {
                    estadoMesa = "pedido";
                    card.classList.add("mesa-pedido"); // Amarillo
                }
                else if (e === "listo") {
                    estadoMesa = "listo";
                    card.classList.add("mesa-listo"); // Rojo
                }
                else if (e === "entregado") {
                    estadoMesa = "entregado";
                    card.classList.add("mesa-entregado"); // Azul
                }
            } else {
                estadoMesa = "libre";
                card.classList.add("mesa-libre"); // Verde
            }

            card.dataset.estado = estadoMesa;
            card.dataset.numero = m.numero;

            card.innerHTML = `
                <div class="mesa-number">Mesa ${m.numero}</div>
                <div class="mesa-status">${m.pedido ? "Pedido #" + m.pedido.id : "Libre"}</div>
            `;

            card.onclick = () => seleccionarMesa(m.id, m.numero);

            mesasGrid.appendChild(card);
        });

        filtrarMesas();

    } catch (error) {
        console.error("Error cargando mesas:", error);
    }
}

/* =====================================================
   SELECCIONAR MESA
===================================================== */
function seleccionarMesa(id, numero) {
    mesaSeleccionada = id;
    panelTitle.textContent = "Mesa " + numero;
    cargarPedidoCompleto(id);
}

/* =====================================================
   CARGAR DETALLE DEL PEDIDO
===================================================== */
async function cargarPedidoCompleto(mesaId) {
    try {
        const r1 = await fetch(`/api/mesa/${mesaId}/pedido/`);
        const d1 = await r1.json();

        if (!d1.pedido) {
            resetPanel();
            return;
        }

        pedidoActualId = d1.pedido.id;

        const r2 = await fetch(`/api/pedido/${pedidoActualId}/detalle/`);
        const d2 = await r2.json();
        if (!d2.success) return;

        const p = d2.pedido;

        let html = `
            <div class="pedido-data">
                <strong>Pedido #${p.id}</strong><br>
                Cliente: ${p.cliente}<br>
                Personas: ${p.personas}<br>
                Estado: ${p.estado}<br>
                <small>${p.fecha}</small>
                <hr>
                <strong>Ítems:</strong>
        `;

        if (p.items.length) {
            html += "<ul>";
            p.items.forEach(i => {
                html += `<li>${i.cantidad} × ${i.platillo} — $${i.subtotal}</li>`;
            });
            html += "</ul>";
        } else {
            html += "<p>No hay ítems aún.</p>";
        }

        html += "</div>";

        orderItems.innerHTML = html;
        totalAmount.textContent = "$" + Number(p.total).toLocaleString("es-CL");

        // Reset de botones
        sendKitchenBtn.classList.add("oculto");
        finishOrderBtn.classList.add("oculto");
        addItemBtn.classList.add("oculto");

        // ======== LÓGICA CENTRAL DEL FLUJO ========
        if (p.estado === "nuevo" || p.estado === "pendiente") {
            sendKitchenBtn.classList.remove("oculto");
            addItemBtn.classList.remove("oculto");
        }
        else if (p.estado === "enviado_a_cocina") {
            addItemBtn.classList.remove("oculto");
        }
        else if (p.estado === "listo") {
            finishOrderBtn.textContent = "Marcar como ENTREGADO";
            finishOrderBtn.classList.remove("oculto");
            addItemBtn.classList.remove("oculto");
        }
        else if (p.estado === "entregado") {
            finishOrderBtn.textContent = "Liberar mesa";
            finishOrderBtn.classList.remove("oculto");
        }

    } catch (error) {
        console.error("Error cargando detalle:", error);
    }
}

/* =====================================================
   ENVIAR A COCINA
===================================================== */
sendKitchenBtn.onclick = async () => {
    if (!pedidoActualId) return;

    await fetch(`/api/pedido/${pedidoActualId}/enviar_cocina/`, {
        method: "POST",
        headers: { "X-CSRFToken": csrf() }
    });

    await cargarMesas();
    await cargarPedidoCompleto(mesaSeleccionada);
};

/* =====================================================
   MARCAR ENTREGADO / LIBERAR MESA
===================================================== */
finishOrderBtn.onclick = async () => {
    if (!pedidoActualId) return;

    const accion = finishOrderBtn.textContent;

    if (accion.includes("ENTREGADO")) {
        await fetch(`/api/pedido/${pedidoActualId}/marcar_entregado/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrf() }
        });
    }
    else {
        await fetch(`/api/pedido/${pedidoActualId}/liberar_mesa/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrf() }
        });
    }

    resetPanel();
    await cargarMesas();
};

/* =====================================================
   MODAL PARA AGREGAR ÍTEM
===================================================== */
addItemBtn.onclick = () => {
    if (!pedidoActualId) return;

    modalAddItem.classList.remove("oculto");
    modalItemsContainer.innerHTML = `
        <p>Aquí irá el listado de platillos para agregar al pedido #${pedidoActualId}.</p>
        <p>Conéctalo a tu API de platillos cuando quieras.</p>
    `;
};

closeModalAddItem.onclick = () => {
    modalAddItem.classList.add("oculto");
};

/* =====================================================
   RESET PANEL
===================================================== */
function resetPanel() {
    panelTitle.textContent = "Selecciona una mesa";
    orderItems.innerHTML = `<p class="empty-msg">Aquí aparecerán los ítems del pedido.</p>`;
    totalAmount.textContent = "$0";

    sendKitchenBtn.classList.add("oculto");
    finishOrderBtn.classList.add("oculto");
    addItemBtn.classList.add("oculto");
}

/* =====================================================
   FILTROS
===================================================== */
function filtrarMesas() {
    const txt = searchInput.value.toLowerCase();
    const filtro = filterSelect.value;

    document.querySelectorAll(".mesa-card").forEach(card => {
        let ok = true;

        const numero = card.dataset.numero;
        const estado = card.dataset.estado;

        if (txt && !numero.includes(txt)) ok = false;
        if (filtro !== "all" && filtro !== estado) ok = false;

        card.style.display = ok ? "block" : "none";
    });
}

searchInput.oninput = filtrarMesas;
filterSelect.onchange = filtrarMesas;

/* =====================================================
   CSRF
===================================================== */
function csrf() {
    const name = "csrftoken=";
    return document.cookie
        .split(";")
        .map(x => x.trim())
        .find(x => x.startsWith(name))
        ?.substring(name.length);
}

/* =====================================================
   POLLING OPTIMIZADO
===================================================== */
setInterval(async () => {
    await cargarMesas();
    if (mesaSeleccionada) await cargarPedidoCompleto(mesaSeleccionada);
}, 2500);

// Primer render
cargarMesas();
