// ============================
// INDEX.JS — VERSIÓN FINAL
// ============================

document.addEventListener("DOMContentLoaded", () => {

    let carrito = [];
    let totalCarrito = 0;

    // Para sincronizar con index_cliente.js
    let mesa_id = localStorage.getItem("mesa_id");
    let clienteNombre = localStorage.getItem("clienteNombre");
    let clientePersonas = localStorage.getItem("clientePersonas");

    // ============================
    // AGREGAR AL CARRITO
    // ============================
    window.agregarAlCarrito = function (id, nombre, precio, imagen, stock) {

        const existente = carrito.find(p => p.id === id);

        if (existente) {
            if (existente.cantidad >= stock) {
                alert(`Solo quedan ${stock} unidades disponibles.`);
                return;
            }
            existente.cantidad++;
        } else {
            carrito.push({
                id,
                nombre,
                precio,
                imagen,
                cantidad: 1,
                stock
            });
        }

        actualizarCarrito();
    };

    // ============================
    // ELIMINAR DEL CARRITO
    // ============================
    window.eliminarDelCarrito = function (id) {
        const item = carrito.find(p => p.id === id);
        if (!item) return;

        if (item.cantidad > 1) item.cantidad--;
        else carrito = carrito.filter(p => p.id !== id);

        actualizarCarrito();
    };

    // ============================
    // ACTUALIZAR CARRITO
    // ============================
    function actualizarCarrito() {
        const lista = document.getElementById("carrito-lista");
        const totalEl = document.getElementById("total");

        if (!lista || !totalEl) return;

        lista.innerHTML = "";
        let total = 0;

        carrito.forEach(item => {
            const subtotal = item.precio * item.cantidad;
            total += subtotal;

            const imgUrl = item.imagen ? `/media/${item.imagen}` : "/static/img/placeholder.png";

            const li = document.createElement("li");
            li.className = "list-group-item d-flex align-items-center justify-content-between";

            li.innerHTML = `
                <div class="d-flex align-items-center">
                    <img src="${imgUrl}" width="60" height="60" class="me-3 rounded border">
                    <div>
                        <h6>${item.nombre}</h6>
                        <small>x${item.cantidad} — $${subtotal}</small>
                    </div>
                </div>
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarDelCarrito(${item.id})">
                    🗑️
                </button>
            `;

            lista.appendChild(li);
        });

        totalCarrito = total;
        totalEl.innerText = total;

        actualizarTotalNavbar();
    }

    function actualizarTotalNavbar() {
        const navbarTotal = document.getElementById("navbar-total");
        if (navbarTotal) navbarTotal.innerText = "$" + totalCarrito;
    }

    // ============================
    // CONFIRMAR PEDIDO
    // ============================
    window.confirmarPedido = function () {

        // Verificaciones
        if (carrito.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }

        clienteNombre = localStorage.getItem("clienteNombre");
        clientePersonas = localStorage.getItem("clientePersonas");
        mesa_id = localStorage.getItem("mesa_id");

        if (!clienteNombre) {
            alert("Debes ingresar tus datos primero.");
            return;
        }

        if (!mesa_id) {
            alert("Debes seleccionar una mesa antes de continuar.");
            return;
        }

        const pedidoData = {
            nombre: clienteNombre,
            personas: clientePersonas,
            platillos: carrito,
            mesa_id: Number(mesa_id)
        };

        fetch("/crear_pedido/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": getCookie("csrftoken")
            },
            body: JSON.stringify(pedidoData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {

                    alert(`Pedido #${data.pedido_id} registrado correctamente.\nTotal: $${data.total}`);

                    // Vaciar carrito
                    carrito = [];
                    actualizarCarrito();

                    // Limpiar mesa después del pedido
                    localStorage.removeItem("mesa_id");

                    // Redirigir al inicio para nuevo cliente
                    window.location.href = "/";
                } else {
                    alert("Error: " + data.error);
                }
            })
            .catch(err => console.error("Error al crear pedido:", err));
    };

    // ============================
    // OBTENER TOKEN CSRF
    // ============================
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie) {
            const cookies = document.cookie.split(";");
            for (let cookie of cookies) {
                cookie = cookie.trim();
                if (cookie.startsWith(name + "=")) {
                    cookieValue = decodeURIComponent(cookie.slice(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Mostrar carrito al cargar
    actualizarCarrito();
});
