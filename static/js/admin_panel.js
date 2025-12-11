// =======================
//  CONFIGURACIÓN GENERAL
// =======================
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
const esGestionPlatillos = document.getElementById("tabla-platillos") !== null;
const contenedorKPIs = document.getElementById("contenedor-kpis");
const contenedorTabla = document.getElementById("contenedor-tabla-reportes");
const contenedorGraficoPlatillos = document.getElementById("contenedor-grafico-platillos");
const contenedorGraficoTotal = document.getElementById("grafico-total-contenedor");
const graficoTotalCanvas = document.getElementById("grafico-total");
const modalDetalle = document.getElementById("modal-detalle");
const cerrarDetalle = document.getElementById("cerrar-detalle");
// const contenedorGraficoDia = document.getElementById("contenedor-grafico-dia");
// const contenedorGraficoSemana = document.getElementById("contenedor-grafico-semana");
let platilloEditando = null;
let graficoTop = null;
let graficoTotal = null;
// let graficoVentasDia = null;
// let graficoVentasSemana = null;

function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertBox");
    alertBox.textContent = message;

    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = "block";

    // Forzar reflow para aplicar animación
    void alertBox.offsetWidth;
    alertBox.classList.add("show");

    setTimeout(() => {
        alertBox.classList.add("hide");
    }, 2500);

    setTimeout(() => {
        alertBox.classList.remove("show", "hide");
        alertBox.style.display = "none";
    }, 3400);
}


// =======================
//  CONTROL DE VISTAS
// =======================
function inicializarVistas() {
    const buttons = document.querySelectorAll(".nav-btn");
    const views = document.querySelectorAll(".view");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const viewId = "view-" + btn.dataset.view;
            views.forEach(v => v.classList.remove("active"));
            document.getElementById(viewId).classList.add("active");
        });
    });
}


// =======================
//  CRUD PLATILLOS
// =======================
async function cargarPlatillos() {
    const res = await fetch("/api/platillos/");
    const data = await res.json();
    const tbody = document.getElementById("tabla-platillos");

    tbody.innerHTML = "";

    data.forEach(p => {
        tbody.innerHTML += `
            <tr data-categoria="${p.categoria_slug}">
                <td>${p.nombre}</td>
                <td>${p.descripcion}</td>
                <td>$${p.precio}</td>
                <td>${p.cantidad}</td>
                <td>
                    <button class="btn-edit-icon btn-edit"
                        data-id="${p.id}"
                        data-nombre="${p.nombre}"
                        data-descripcion="${p.descripcion}"
                        data-precio="${p.precio}"
                        data-cantidad="${p.cantidad}"
                        data-categoria="${p.categoria_id}">
                        <img src="/static/icons/edit.png">
                        Editar
                    </button>
                </td>
            </tr>
        `;
    });
}

// document.addEventListener("DOMContentLoaded", cargarPlatillos);


// Crear platillo
document.getElementById("form-crear")?.addEventListener("submit", async e => {
    e.preventDefault();
    let formData = new FormData(e.target);

    const res = await fetch("/api/platillos/crear/", {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    if (data.success) {
        showAlert("Platillo agregado correctamente");
        cargarPlatillos();
        e.target.reset();
        limpiarPreview();
    }
});


// Editar platillo
document.addEventListener("click", e => {
    if (!e.target.classList.contains("btn-edit")) return;

    const id = e.target.dataset.id;
    platilloEditando = id;

    const form = document.getElementById("form-crear");
    form.querySelector("[name=nombre]").value = e.target.dataset.nombre;
    form.querySelector("[name=descripcion]").value = e.target.dataset.descripcion;
    form.querySelector("[name=precio]").value = e.target.dataset.precio;
    form.querySelector("[name=cantidad]").value = e.target.dataset.cantidad;

    document.getElementById("btn-agregar").classList.add("oculto");
    const actualizarBtn = document.getElementById("btn-actualizar");

    actualizarBtn.classList.remove("oculto");
    actualizarBtn.disabled = false;

    actualizarBtn.onclick = async () => {
        if (!platilloEditando) {
            showAlert("Debe seleccionar un platillo antes de actualizar", "error");
            return;
        }

        let fd = new FormData(form);
        fd.append("id", platilloEditando);

        const res = await fetch(`/api/platillos/${platilloEditando}/editar/`, {
            method: "POST",
            body: fd
        });

        const data = await res.json();
        if (data.success) {
            showAlert("Platillo actualizado correctamente");
            cargarPlatillos();
            form.reset();
            platilloEditando = null;

            actualizarBtn.classList.add("oculto");
            actualizarBtn.disabled = true;
            document.getElementById("btn-agregar").classList.remove("oculto");
            limpiarPreview();
        }
    };
});

// =======================
//  PREVISUALIZACIÓN DE IMAGEN
// =======================
const inputImg = document.getElementById("imagen");
const preview = document.getElementById("preview-img");

if (inputImg) {
    inputImg.addEventListener("change", () => {
        const file = inputImg.files[0];

        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.style.display = "block";
        } else {
            preview.style.display = "none";
        }
    });
}


// LIMPIAR PREVISUALIZACIÓN
function limpiarPreview() {
    preview.src = "";
    preview.style.display = "none";

    if (inputImg) {
        inputImg.value = "";
    }
}
// function limpiarPreview() {
//     const preview = document.getElementById("preview-img");
//     const inputImg = document.getElementById("imagen");

//     preview.src = "";
//     preview.style.display = "none";

//     if (inputImg) {
//         inputImg.value = "";
//     }
// }

// =======================
//  PEDIDOS (POLLING)
// =======================
async function cargarPedidos() {
    const res = await fetch("/api/pedidos/");
    if (!res.ok) return;

    const data = await res.json();

    const tbody = document.querySelector("#view-pedidos .table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    data.pedidos.forEach(p => {

        // Crear la fila correctamente
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${p.id}</td>
            <td>${p.cliente}</td>
            <td>${p.personas}</td>
            <td>$${p.total}</td>
            <td>${p.estado}</td>
            <td>
                <button class="btn-small btn-cambiar" data-id="${p.id}">
                    Cambiar
                </button>
            </td>
        `;

        // Listener para abrir modal de detalle (Paso 6)
        fila.addEventListener("click", (e) => {
            // Evitar que el botón "Cambiar" active el modal
            if (e.target.classList.contains("btn-cambiar")) return;

            abrirDetallePedido(p.id);
        });

        tbody.appendChild(fila);
    });
}

setInterval(cargarPedidos, 3000);



// =======================
//  EMPLEADOS (MODAL + TOGGLE ACTIVO)
// =======================
const modal = document.getElementById("employeeModal");
const openBtn = document.getElementById("addEmployeeBtn");
const closeBtn = document.getElementById("closeModal");

openBtn?.addEventListener("click", () => modal.classList.remove("hidden"));
closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

// Crear empleado
document.getElementById("employeeForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const res = await fetch("/crear_empleado/", {
        method: "POST",
        body: formData
    });

    const data = await res.json();
    if (data.success) {
        modal.classList.add("hidden");
        showAlert("Empleado agregado con éxito");
        reloadEmpleados();
    }
});


// Toggle activo SI / NO
document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;

    if (btn.disabled || btn.classList.contains("disabled")) {
        e.stopPropagation();
        e.preventDefault();
        return;
    }

    const id = btn.dataset.id;

    try {
        const res = await fetch(`/api/empleado/${id}/toggle/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrftoken },
        });

        const data = await res.json();

        if (data.success) {
            btn.textContent = data.activo ? "Sí" : "No";
            btn.classList.toggle("activo", data.activo);
            btn.classList.toggle("inactivo", !data.activo);
            showAlert("Empleado actualizado");
        } else {
            showAlert("Error: " + data.error, "error");
        }
    } catch (err) {
        console.error(err);
        showAlert("Error de conexión al actualizar empleado", "error");
    }
});


// Recargar tabla empleados sin recargar la página
async function reloadEmpleados() {
    const res = await fetch("/admin-menu/");
    const html = await res.text();

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const nuevaTabla = temp.querySelector("#view-empleados table tbody");
    const tablaActual = document.querySelector("#view-empleados table tbody");

    if (nuevaTabla && tablaActual) {
        tablaActual.innerHTML = nuevaTabla.innerHTML;
    }
}

// =======================
//  ESTADO LABORAL EMPLEADO (DROPDOWN)
// =======================
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".estado-btn");
    const option = e.target.closest(".estado-option");
    const insideDropdown = e.target.closest(".estado-dropdown");

    if (btn) {
        const current = btn.closest(".estado-dropdown");
        document.querySelectorAll(".estado-dropdown.open").forEach(d => {
            if (d !== current) d.classList.remove("open");
        });
        current.classList.toggle("open");
        return;
    }

    if (option) {
        const dropdown = option.closest(".estado-dropdown");
        const empleadoId = dropdown.dataset.id;
        const nuevoEstado = option.dataset.estado;

        const btn = dropdown.querySelector(".estado-btn");
        const textSpan = dropdown.querySelector(".estado-text");

        actualizarEstadoLaboral(empleadoId, nuevoEstado, btn, textSpan, dropdown);
        return;
    }

    if (!insideDropdown) {
        document.querySelectorAll(".estado-dropdown.open").forEach(d => d.classList.remove("open"));
    }
});


async function actualizarEstadoLaboral(empleadoId, nuevoEstado, btn, textSpan, dropdown) {
    try {
        const res = await fetch(`/api/empleado/${empleadoId}/estado/`, {
            method: "POST",
            headers: {
                "X-CSRFToken": csrftoken,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ estado: nuevoEstado }),
        });

        const data = await res.json();

        if (data.success) {

            const map = {
                trabajando: "Trabajando",
                vacaciones: "De vacaciones",
                licencia: "Licencia",
                despedido: "Despedido"
            };

            textSpan.textContent = map[nuevoEstado];

            btn.classList.remove(
                "estado-trabajando", "estado-vacaciones",
                "estado-licencia", "estado-despedido"
            );
            btn.classList.add(`estado-${nuevoEstado}`);

            const toggleBtn = dropdown.closest("tr").querySelector(".toggle-btn");

            if (toggleBtn) {
                if (nuevoEstado !== "trabajando") {
                    toggleBtn.textContent = "No";
                    toggleBtn.classList.remove("activo");
                    toggleBtn.classList.add("inactivo");
                } else {
                    toggleBtn.textContent = "Sí";
                    toggleBtn.classList.remove("inactivo");
                    toggleBtn.classList.add("activo");
                }
            }

            dropdown.classList.remove("open");
            showAlert("Estado laboral actualizado");

        } else {
            showAlert("Error al actualizar estado laboral", "error");
        }

    } catch (error) {
        console.error(error);
        showAlert("Error de conexión al servidor", "error");
    }
}


// =======================
//  POSICIONAMIENTO FIJO DEL DROPDOWN
// =======================
document.addEventListener("click", (e) => {
    const btn = e.target.closest(".estado-btn");

    if (btn) {
        const dropdown = btn.closest(".estado-dropdown");
        const menu = dropdown.querySelector(".estado-menu");

        const rect = btn.getBoundingClientRect();

        menu.style.position = "fixed";
        menu.style.top = rect.bottom + "px";
        menu.style.left = rect.left + "px";
        menu.style.minWidth = rect.width + "px";
    }
});

// =============================
// CATEGORÍAS EN ADMIN
// =============================

// Cargar categorías desde backend
async function cargarCategorias() {
    try {
        const res = await fetch("/api/categorias/");
        const data = await res.json();

        const contenedor = document.getElementById("contenedor-categorias");

        // Si la vista no tiene contenedor → no hacer nada
        if (!contenedor) return;

        // Si la API no trajo categorias → detener
        if (!data || !Array.isArray(data.categorias)) {
            console.warn("No hay categorías disponibles todavía.");
            return;
        }

        contenedor.innerHTML = "";

        data.categorias.forEach(cat => {
            const btn = document.createElement("button");
            btn.classList.add("categoria-pill");
            btn.dataset.cat = cat.slug;
            btn.textContent = cat.nombre;

            contenedor.appendChild(btn);
        });

    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}



function filtrarTabla(slug) {
    const filas = document.querySelectorAll("#tabla-platillos tr");

    filas.forEach(fila => {
        const categoria = fila.dataset.categoria;

        if (slug === "todas" || categoria === slug) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });
}

// -----------------------------
// FILTRAR PLATILLOS POR CATEGORÍA
// -----------------------------
function filtrarCategoria(slug) {
    const filas = document.querySelectorAll("#tabla-platillos tr");

    filas.forEach(fila => {
        const categoria = fila.dataset.categoria || "sin-categoria";

        if (slug === "todos" || categoria === slug) {
            fila.style.display = "";
        } else {
            fila.style.display = "none";
        }
    });

    // Actualizar estado visual de los botones
    document.querySelectorAll(".categoria-pill").forEach(btn => {
        const btnSlug = btn.dataset.cat;       // ejemplo: data-cat="bebidas"
        btn.classList.toggle("active", btnSlug === slug);
    });
}

function poblarTablaPlatillos(lista) {
    const tbody = document.getElementById("tabla-platillos");
    if (!tbody) return;

    tbody.innerHTML = "";

    lista.forEach(p => {
        const row = document.createElement("tr");
        row.dataset.id = p.id;

        // NUEVO: guardar el slug de categoría en data-categoria
        // (si no tiene, le ponemos "comidas" o "sin-categoria")
        row.dataset.categoria = p.categoria_slug || "sin-categoria";

        row.innerHTML = `
            <td>${p.nombre}</td>
            <td>${p.descripcion}</td>
            <td>$${p.precio}</td>
            <td>${p.cantidad}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-editar-platillo" data-id="${p.id}">
                    <i class="fa fa-edit"></i> Editar
                </button>
            </td>
        `;

        tbody.appendChild(row);
    });
}


// =======================
//  INICIALIZACIÓN GLOBAL
// =======================
document.addEventListener("DOMContentLoaded", () => {
    inicializarVistas();
    cargarPedidos();

    // Solo en gestión de platillos
    if (esGestionPlatillos) {
        cargarPlatillos();
        cargarCategorias();
    }
});


/*REPORTES – FILTROS Y CONSULTA*/

const esVistaReportes = document.getElementById("contenedor-kpis") !== null;

if (esVistaReportes) {

    // ========= REFERENCIAS REALES DEL HTML =========
    const tablaReportes = document.getElementById("tabla-reportes");
    const kpiTotal = document.getElementById("kpi-total");
    const kpiPedidos = document.getElementById("kpi-pedidos");
    const kpiTicket = document.getElementById("kpi-ticket");
    const kpiTopPlatillo = document.getElementById("kpi-top-platillo");

    // Contenedores de gráficos
    const contenedorGraficoPlatillos = document.getElementById("contenedor-grafico-platillos");
    const contenedorGraficoTotal = document.getElementById("grafico-total-contenedor");

    // Canvas reales
    const canvasGraficoPlatillos = document.getElementById("graficoTopPlatillos");
    const canvasGraficoTotal = document.getElementById("grafico-total");

    // Ocultar gráficos al inicio
    contenedorGraficoPlatillos.style.display = "none";
    contenedorGraficoTotal.style.display = "none";

    let graficoTop = null;
    let graficoTotal = null;

    let filtros = {
        rango: "hoy",
        cliente: "",
        agrupacion: "dia"
    };


    /* =============================
        FILTROS RÁPIDOS DE FECHA
    ============================== */
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            filtros.rango = btn.dataset.range;

            document.querySelectorAll(".filter-btn")
                .forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            cargarReportes();
        });
    });


    /* =============================
        BÚSQUEDA POR CLIENTE
    ============================== */
    document.getElementById("filtro-cliente")?.addEventListener("input", (e) => {
        filtros.cliente = e.target.value.trim();
    });


    /* =============================
        FILTRO POR AGRUPACIÓN
    ============================== */
    document.getElementById("filtro-agrupacion")?.addEventListener("change", (e) => {
        filtros.agrupacion = e.target.value;
    });


    /* =============================
        BOTÓN APLICAR FILTROS
    ============================== */
    document.getElementById("btn-aplicar-filtros")?.addEventListener("click", () => {
        cargarReportes();
    });


    /* =============================
        FUNCIÓN PRINCIPAL: CONSULTAR API
    ============================== */
    async function cargarReportes() {

        const res = await fetch("/api/reportes/filtrar/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken
            },
            body: JSON.stringify(filtros)
        });

        if (!res.ok) {
            showAlert("Error cargando reportes", "error");
            return;
        }

        const data = await res.json();
        if (!data.success) {
            showAlert("Error: " + data.error, "error");
            return;
        }

        // =====================================================
        // KPI BÁSICOS
        // =====================================================
        kpiTotal.textContent = "$" + data.kpis.total_vendido;
        kpiPedidos.textContent = data.kpis.cantidad_pedidos;
        kpiTicket.textContent = "$" + data.kpis.ticket_promedio;

        // =====================================================
        // TOP PLATILLOS
        // =====================================================
        if (data.top_platillos?.length > 0) {
            kpiTopPlatillo.textContent = data.top_platillos
                .map(t => `${t.nombre}: ${t.valor}`)
                .join(", ");

            dibujarGraficoTopPlatillos(data.top_platillos);
        } else {
            kpiTopPlatillo.textContent = "N/A";
            if (graficoTop) graficoTop.destroy();
        }

        // =====================================================
        // TABLA DE PEDIDOS
        // =====================================================
        if (filtros.agrupacion === "platillo" || filtros.agrupacion === "platillo_ingresos") {
            tablaReportes.innerHTML = "";
        } else {
            llenarTablaReportes(data.pedidos);
        }

        // =====================================================
        // CONTROL DE VISIBILIDAD
        // =====================================================
        if (filtros.agrupacion === "total_vendido") {

            contenedorGraficoTotal.style.display = "block";
            contenedorGraficoPlatillos.style.display = "none";

            contenedorKPIs.style.display = "none";
            contenedorTabla.style.display = "none";

            dibujarGraficoTotal(data.grafico_total ?? []);

            return;
        }

        if (filtros.agrupacion === "platillo" || filtros.agrupacion === "platillo_ingresos") {

            contenedorGraficoPlatillos.style.display = "block";
            contenedorGraficoTotal.style.display = "none";

            contenedorKPIs.style.display = "none";
            contenedorTabla.style.display = "none";

        } else {

            contenedorGraficoPlatillos.style.display = "none";
            contenedorGraficoTotal.style.display = "none";

            contenedorKPIs.style.display = "block";
            contenedorTabla.style.display = "block";

            if (graficoTop) graficoTop.destroy();
        }
    }

//     } catch (err) {
//         console.error(err);
//         showAlert("Error de conexión al cargar reportes", "error");
//     }
// }




    /* =============================
        LLENAR TABLA
    ============================== */
    function llenarTablaReportes(lista) {
        tablaReportes.innerHTML = "";

        if (!lista || lista.length === 0) {
            tablaReportes.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding:12px;">
                        No hay resultados para los filtros seleccionados.
                    </td>
                </tr>`;
            return;
        }

        lista.forEach(p => {
            tablaReportes.innerHTML += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.cliente}</td>
                    <td>${p.fecha}</td>
                    <td>$${p.total}</td>
                    <td>${p.estado}</td>
                </tr>
            `;
        });
    }


    /* =============================
        EXPORTAR EXCEL FILTRADO
    ============================== */
    document.getElementById("btn-exportar-excel")?.addEventListener("click", () => {
        const query = new URLSearchParams(filtros).toString();
        window.location.href = "/reportes/ventas/filtrado/excel/?" + query;
    });

    function dibujarGraficoTopPlatillos(lista) {
        if (!canvasGraficoPlatillos) return;

        if (graficoTop) graficoTop.destroy();

        graficoTop = new Chart(canvasGraficoPlatillos, {
            type: "bar",
            data: {
                labels: lista.map(i => i.nombre),
                datasets: [{
                    label: "Unidades vendidas",
                    data: lista.map(i => i.valor),
                    backgroundColor: "rgba(54,162,235,0.6)",
                    borderColor: "rgba(54,162,235,1)"
                }]
            }
        });
    }

function dibujarGraficoTotal(lista) {
        if (!canvasGraficoTotal) return;

        if (graficoTotal) graficoTotal.destroy();

        graficoTotal = new Chart(canvasGraficoTotal, {
            type: "line",
            data: {
                labels: lista.map(i => i.etiqueta),
                datasets: [{
                    label: "Total vendido",
                    data: lista.map(i => i.total),
                    borderColor: "rgba(75,192,192,1)",
                    backgroundColor: "rgba(75,192,192,0.3)",
                    tension: 0.3
                }]
            }
        });
    }

    // Cargar por defecto
    cargarReportes();
}


async function abrirDetallePedido(idPedido) {
    try {
        const res = await fetch(`/api/pedido/${idPedido}/detalle/`);

        if (!res.ok) {
            console.error("Respuesta del servidor:", await res.text());
            alert("Error al cargar detalle del pedido (URL no encontrada o servidor falló)");
            return;
        }

        const data = await res.json();

        if (!data.success) {
            alert("El servidor no pudo entregar el pedido.");
            return;
        }

        const pedido = data.pedido;

        document.getElementById("detalle-pedido-info").innerHTML = `
            <p><strong>ID:</strong> ${pedido.id}</p>
            <p><strong>Cliente:</strong> ${pedido.cliente}</p>
            <p><strong>Personas:</strong> ${pedido.personas}</p>
            <p><strong>Fecha:</strong> ${pedido.fecha}</p>
            <p><strong>Total:</strong> $${pedido.total}</p>
            <p><strong>Estado:</strong> ${pedido.estado}</p>
        `;

        const lista = document.getElementById("detalle-pedido-items");
        lista.innerHTML = "";

        pedido.items.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.cantidad} × ${item.platillo} — $${item.subtotal}`;
            lista.appendChild(li);
        });

        document.getElementById("modal-detalle").classList.remove("oculto");

    } catch (err) {
        console.error("Detalle error:", err);
        alert("Error inesperado al cargar detalle del pedido");
    }
}

document.getElementById("cerrar-detalle")?.addEventListener("click", () => {
    document.getElementById("modal-detalle").classList.add("oculto");
});

cerrarDetalle.addEventListener("click", () => {
    modalDetalle.classList.add("oculto");
});

modalDetalle.addEventListener("click", (e) => {
    if (e.target === modalDetalle) {
        modalDetalle.classList.add("oculto");
    }
});