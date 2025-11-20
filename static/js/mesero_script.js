//Cargar MESAS
async function cargarMesas() {
    try {
        const resp = await fetch("/api/mesas/");
        const data = await resp.json();

        const grid = document.getElementById("mesasGrid");
        grid.innerHTML = "";

        data.mesas.forEach(m => {

            // Crear tarjeta moderna
            const card = document.createElement("div");
            card.classList.add("mesa-card");

            // Asignar clase segun estado real
            if (m.pedido) {
                if (m.pedido.estado === "nuevo" || m.pedido.estado === "enviado_a_cocina") {
                    card.classList.add("estado-pedido");
                } else {
                    card.classList.add("estado-ocupado");
                }
            } else {
                card.classList.add("estado-libre");
            }
            // Contenido visual de la tarjeta
            card.innerHTML = `
                <div class="mesa-number">Mesa ${m.numero}</div>
                <div class="mesa-status">
                    ${m.pedido ? `Pedido #${m.pedido.id}` : "Libre"}
                </div>
                <div class="mesa-mesero">
                    ${m.mesero ? "Atendida por: " + m.mesero : ""}
                </div>
            `;

            card.onclick = () => seleccionarMesa(m.id, m.numero);
            //Agregarla al grid
            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Error cargando mesas:", err);
    }
}


//Seleccionar MESA
let mesaSeleccionada = null;

async function seleccionarMesa(id, numero) {
    mesaSeleccionada = id;
    document.getElementById("panelTitle").textContent = "Mesa " + numero;
    cargarPedidoMesa(id);
}

//Pedido por mesa
async function cargarPedidoMesa(id) {
    try {
        const resp = await fetch(`/api/mesa/${id}/pedido/`);
        const data = await resp.json();

        const orderItems = document.getElementById("orderItems");
        const totalAmount = document.getElementById("totalAmount");

        if (!data.pedido) {
            orderItems.innerHTML = `<div style="padding:12px;color:#777">No hay pedido para esta mesa.</div>`;
            totalAmount.textContent = "$0";
            return;
        }

        const p = data.pedido;

        orderItems.innerHTML = `
            <div class="pedido-item">
                <strong>Pedido #${p.id}</strong><br>
                Cliente: ${p.cliente}<br>
                Personas: ${p.personas}<br>
                Total: $${p.total}<br>
                Estado: ${p.estado}<br>
                <small>${p.fecha}</small>
            </div>
        `;

        const t = Number(p.total) || 0;
        totalAmount.textContent = "$" + t.toLocaleString("es-CL");

    } catch (err) {
        console.error("Error cargando pedido de mesa:", err);
    }
}

//Enviar pedido a cocina
async function enviarACocina() {
    if (!mesaSeleccionada) return alert("Seleccione una mesa primero");

    const resp = await fetch(`/api/mesa/${mesaSeleccionada}/pedido/`);
    const data = await resp.json();

    if (!data.pedido) {
        alert("No hay pedido para enviar");
        return;
    }

    const pedidoId = data.pedido.id;

    try {
        const resp2 = await fetch(`/api/pedido/${pedidoId}/enviar_cocina/`, {
            method: "POST",
            headers: { "X-CSRFToken": getCSRFToken() }
        });

        const result = await resp2.json();

        if (result.success) {
            alert("Pedido enviado a cocina");
            cargarMesas();
            cargarPedidoMesa(mesaSeleccionada);
        }
    } catch (err) {
        console.error("Error enviando pedido a cocina:", err);
    }
}

//Obtener CSRF Token
function getCSRFToken() {
    const name = "csrftoken";
    for (const cookie of document.cookie.split(";")) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(name + "="))
            return trimmed.substring(name.length + 1);
    }
    return "";
}

//Eventos
document.getElementById("sendKitchen").onclick = enviarACocina;

//Polling automático
setInterval(async () => {
    await cargarMesas(); 
    if (mesaSeleccionada) {
        cargarPedidoMesa(mesaSeleccionada);
    }
}, 2000);
// Primera carga
cargarMesas();




// //Polling automático
// setInterval(() => {
//     cargarMesas();
//     if (mesaSeleccionada) cargarPedidoMesa(mesaSeleccionada);
// }, 2000);

// //Primera carga
// cargarMesas();
