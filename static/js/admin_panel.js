// =======================
//  CONFIGURACIÓN GENERAL
// =======================
const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;

function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertBox");
    alertBox.textContent = message;
    alertBox.className = `alert-box ${type}`;
    alertBox.style.display = "block";
    setTimeout(() => alertBox.style.display = "none", 3000);
}


// =======================
//  CONTROL DE VISTAS
// =======================
document.addEventListener("DOMContentLoaded", () => {
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
});


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
            <tr>
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
                    data-cantidad="${p.cantidad}">
                    <img src="/static/icons/edit.png" alt="editar">
                    Editar
                </button>
                </td>
            </tr>
        `;
    });
}

document.addEventListener("DOMContentLoaded", cargarPlatillos);


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
    }
});


// Editar platillo
document.addEventListener("click", e => {
    if (!e.target.classList.contains("btn-edit")) return;

    const id = e.target.dataset.id;

    const form = document.getElementById("form-crear");
    form.querySelector("[name=nombre]").value = e.target.dataset.nombre;
    form.querySelector("[name=descripcion]").value = e.target.dataset.descripcion;
    form.querySelector("[name=precio]").value = e.target.dataset.precio;
    form.querySelector("[name=cantidad]").value = e.target.dataset.cantidad;

    document.getElementById("btn-agregar").classList.add("oculto");
    const actualizarBtn = document.getElementById("btn-actualizar");
    actualizarBtn.classList.remove("oculto");

    actualizarBtn.onclick = async () => {
        let fd = new FormData(form);
        fd.append("id", id);

        const res = await fetch(`/api/platillos/${id}/editar/`, {
            method: "POST",
            body: fd
        });

        const data = await res.json();
        if (data.success) {
            showAlert("Platillo actualizado correctamente");
            cargarPlatillos();
            form.reset();
            actualizarBtn.classList.add("oculto");
            document.getElementById("btn-agregar").classList.remove("oculto");
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
        tbody.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.cliente}</td>
                <td>${p.personas}</td>
                <td>$${p.total}</td>
                <td>${p.estado}</td>
                <td><button class="btn-small btn-cambiar" data-id="${p.id}">Cambiar</button></td>
            </tr>
        `;
    });
}

// Actualiza pedidos cada 3 segundos
setInterval(cargarPedidos, 3000);


// =======================
//  EMPLEADOS (MODAL + TOGGLE ACTIVO)
// =======================
const modal = document.getElementById("employeeModal");
const openBtn = document.getElementById("addEmployeeBtn");
const closeBtn = document.getElementById("closeModal");

openBtn?.addEventListener("click", () => modal.classList.remove("hidden"));
closeBtn?.addEventListener("click", () => modal.classList.add("hidden"));

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
    if (!btn) return;              // ← Primero validar

    const id = btn.dataset.id;
    console.log("Click en botón de empleado:", id);

    try {
        const res = await fetch(`/api/empleado/${id}/toggle/`, {
            method: "POST",
            headers: { "X-CSRFToken": csrftoken },
        });
        const data = await res.json();

        if (data.success) {
            // Actualización visual sin recargar
            btn.textContent = data.activo ? "Sí" : "No";
            btn.classList.toggle("activo", data.activo);
            btn.classList.toggle("inactivo", !data.activo);

            showAlert("Empleado actualizado correctamente", "success");
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
