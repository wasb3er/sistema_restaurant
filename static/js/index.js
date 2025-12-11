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

    function mostrarPopupStock(mensaje) {
    const popup = document.getElementById("popup-stock");
    const texto = document.getElementById("popup-texto-stock");

    texto.textContent = mensaje;
    popup.classList.add("mostrar");

    setTimeout(() => {
        popup.classList.remove("mostrar");
    }, 3000);
}


    // ============================
    // AGREGAR AL CARRITO
    // ============================
    window.agregarAlCarrito = function (id, nombre, precio, imagen, stock) {

        const existente = carrito.find(p => p.id === id);

        if (existente) {
            if (existente.cantidad >= stock) {
                mostrarPopupStock("No hay suficientes platillos disponibles, por favor elija más opciones.");
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

    if (carrito.length === 0) {
        mostrarPopupStock("Tu carrito está vacío.");
        return;
    }

    const clienteNombre = localStorage.getItem("clienteNombre");
    const clientePersonas = localStorage.getItem("clientePersonas");
    const mesa_id = localStorage.getItem("mesa_id");

    if (!clienteNombre || !mesa_id) {
        alert("Debes ingresar tus datos y seleccionar mesa.");
        return;
    }

    fetch("/pago/guardar_carrito/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCookie("csrftoken")
        },
        body: JSON.stringify({
            carrito: carrito,
            cliente: clienteNombre,
            personas: clientePersonas,
            mesa_id: mesa_id
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.location.href = "/pago/resumen/";
        } else {
            alert("Error guardando carrito en sesión.");
        }
    });
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

/* FILTRAR POR CATEGORÍA */
function filtrarCategoria(slug) {
    document.querySelectorAll(".categoria-pill").forEach(p => p.classList.remove("active"));

    let activeBtn = [...document.querySelectorAll(".categoria-pill")]
                   .find(p => p.dataset.cat === slug || slug === "todas");

    if (activeBtn) activeBtn.classList.add("active");

    document.querySelectorAll(".platillo-card").forEach(card => {
        if (slug === "todas" || card.dataset.cat === slug) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });
}

function toggleCarrito() {
    document.getElementById("carrito-panel").classList.toggle("open");
    document.getElementById("carrito-overlay").classList.toggle("show");
}

function mostrarCategoria(slug) {
    // Ocultar todas
    document.querySelectorAll(".categoria-seccion").forEach(sec => sec.classList.remove("active"));

    // Mostrar seleccionada
    document.getElementById("cat-" + slug).classList.add("active");

    // Estilo de pestañas
    document.querySelectorAll(".categoria-btn").forEach(btn => btn.classList.remove("active"));
    document.getElementById("tab-" + slug).classList.add("active");
}

// Activar por defecto la primera categoría
document.addEventListener("DOMContentLoaded", () => {
    const first = document.querySelector(".categoria-btn");
    if (first) {
        first.classList.add("active");
        mostrarCategoria(first.id.replace("tab-", ""));
    }
});
