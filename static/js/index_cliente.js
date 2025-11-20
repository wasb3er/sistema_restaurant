// ==============================
// INDEX CLIENTE – Versión Final
// ==============================
document.addEventListener("DOMContentLoaded", async () => {

    let timers = {};
    let mesa_id = null;

    const acciones = document.getElementById("acciones");
    const btnIrMenu = document.getElementById("btnIrMenu");
    const resumen = document.getElementById("resumen");
    const btnMostrarFormulario = document.getElementById("btnMostrarFormulario");

    // Ocultar paneles al inicio
    acciones.classList.add("oculto");
    btnIrMenu.classList.add("oculto");
    resumen.classList.add("oculto");

    // ==========================
    // BOTÓN: Mostrar formulario
    // ==========================
    if (btnMostrarFormulario) {
        btnMostrarFormulario.addEventListener("click", () => {
            document.getElementById("inicio").style.display = "none";
            document.getElementById("formulario").classList.remove("oculto");

            
            // localStorage.removeItem("mesa_id");   ← Eliminado
        });
    }

    // ==========================
    // FORMULARIO
    // ==========================
    const datosForm = document.getElementById("datosForm");
    if (datosForm) {
        datosForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const nombre = document.getElementById("nombre").value.trim();
            const personas = document.getElementById("personas").value.trim();

            if (!nombre) {
                alert("Debes ingresar tu nombre.");
                return;
            }

            localStorage.setItem("clienteNombre", nombre);
            localStorage.setItem("clientePersonas", personas);

            resumen.textContent = `${nombre} — ${personas} persona(s)`;
            resumen.classList.remove("oculto");

            // Mostrar control de mesas
            document.getElementById("formulario").classList.add("oculto");
            document.getElementById("menuPrincipal").classList.remove("oculto");
        });
    }

    // ==========================
    // CARGAR ESTADO DE MESAS
    // ==========================
    await cargarMesasBackend();

    // Restaurar selección previa solo si está ocupada por backend
    mesa_id = localStorage.getItem("mesa_id");

    if (mesa_id) {
        const mesaHTML = document.querySelector(`.mesa[data-mesa-id="${mesa_id}"]`);
        if (mesaHTML && mesaHTML.dataset.bloqueada === "1") {
            acciones.classList.remove("oculto");
            btnIrMenu.classList.remove("oculto");
            resumen.classList.remove("oculto");
        }
    }

    // ==========================
    // Cambio de piso
    // ==========================
    document.getElementById("btnPiso1").addEventListener("click", () => {
        document.getElementById("primer-piso").classList.remove("oculto");
        document.getElementById("segundo-piso").classList.add("oculto");
    });

    document.getElementById("btnPiso2").addEventListener("click", () => {
        document.getElementById("segundo-piso").classList.remove("oculto");
        document.getElementById("primer-piso").classList.add("oculto");
    });

    // ==========================
    // Seleccionar mesas
    // ==========================
    document.querySelectorAll(".mesa").forEach(mesa => {
        mesa.addEventListener("click", () => toggleMesa(mesa));
    });

    function toggleMesa(mesa) {
        const idReal = mesa.dataset.mesaId;

        if (mesa.dataset.bloqueada === "1") {
            alert("Mesa con pedido activo.");
            return;
        }

        if (mesa_id == idReal) {
            liberarMesa(mesa);
            return;
        }

        if (mesa_id && mesa_id !== idReal) {
            alert("Solo puedes seleccionar una mesa.");
            return;
        }

        seleccionarMesa(mesa);
    }

    function seleccionarMesa(mesa) {
        const idReal = mesa.dataset.mesaId;

        mesa.classList.add("ocupada");
        mesa.classList.remove("disponible");

        mesa.querySelector(".status").textContent = "Ocupada";
        mesa.querySelector(".timer").style.display = "block";

        mesa_id = idReal;
        localStorage.setItem("mesa_id", mesa_id);

        acciones.classList.remove("oculto");
        btnIrMenu.classList.remove("oculto");
        resumen.classList.remove("oculto");
    }

    function liberarMesa(mesa) {
        mesa.classList.remove("ocupada");
        mesa.classList.add("disponible");

        mesa.querySelector(".status").textContent = "Disponible";
        mesa.querySelector(".timer").style.display = "none";

        mesa_id = null;
        localStorage.removeItem("mesa_id");

        acciones.classList.add("oculto");
        btnIrMenu.classList.add("oculto");
    }

    // ==========================
    // Cargar Backend
    // ==========================
    async function cargarMesasBackend() {
        try {
            const resp = await fetch("/api/mesas/");
            const data = await resp.json();

            data.mesas.forEach(m => {
                const mesaHTML = document.querySelector(`.mesa[data-mesa-id="${m.id}"]`);
                if (!mesaHTML) return;

                if (m.pedido) {
                    mesaHTML.dataset.bloqueada = "1";
                    mesaHTML.classList.add("ocupada");
                    mesaHTML.classList.remove("disponible");
                    mesaHTML.querySelector(".status").textContent = "Ocupada";
                } else {
                    mesaHTML.dataset.bloqueada = "0";
                    mesaHTML.classList.add("disponible");
                    mesaHTML.classList.remove("ocupada");
                    mesaHTML.querySelector(".status").textContent = "Disponible";
                }
            });

        } catch (err) {
            console.error("Error al cargar backend:", err);
        }
    }

    // ==========================
    // Botón ir al menú
    // ==========================
    btnIrMenu.addEventListener("click", () => {
        window.location.href = "/menu/";
    });

});

// ==========================
// CARRUSEL — AUTOPLAY
// ==========================
document.addEventListener("DOMContentLoaded", () => {

    let bigIndex = 0;
    const slides = document.querySelectorAll(".big-slide");
    const prev = document.querySelector(".big-prev");
    const next = document.querySelector(".big-next");

    if (slides.length === 0) return;

    function showSlide(n) {
        slides.forEach(s => s.style.display = "none");
        slides[n].style.display = "block";
    }

    function nextSlide() {
        bigIndex = (bigIndex + 1) % slides.length;
        showSlide(bigIndex);
    }

    prev.addEventListener("click", () => {
        bigIndex = (bigIndex - 1 + slides.length) % slides.length;
        showSlide(bigIndex);
    });

    next.addEventListener("click", () => {
        nextSlide();
    });

    showSlide(bigIndex);
    setInterval(nextSlide, 4000);
});
