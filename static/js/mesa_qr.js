// ======================================================
// FLUJO QR – VERSIÓN COMPATIBLE CON FLUJO C
// PASOS: formulario → mesas → pin
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    console.log("mesa_qr.js CARGADO — flujo clásico activo");

    // ======================================================
    // POPUP SUAVE
    // ======================================================
    function mostrarPopup(mensaje) {
        const popup = document.getElementById("popup-alert");
        const texto = document.getElementById("popup-texto");

        if (!popup || !texto) {
            alert(mensaje);
            return;
        }

        texto.textContent = mensaje;
        popup.classList.add("mostrar");

        setTimeout(() => popup.classList.remove("mostrar"), 3000);
    }



    // ======================================================
    // 1) CARGAR ESTADO VISUAL DE MESAS DESDE BACKEND
    // ======================================================
    async function cargarEstadoMesas() {
        try {
            const resp = await fetch("/api/mesas/");
            const data = await resp.json();

            if (!data.mesas) return;

            data.mesas.forEach((m) => {
                const mesaDOM = document.querySelector(`.mesa[data-mesa-id="${m.numero}"]`);
                if (!mesaDOM) return;

                const estado = (m.estado || "").trim().toLowerCase();
                const ocupada = estado === "ocupada";

                const status = mesaDOM.querySelector(".status");

                if (ocupada) {
                    mesaDOM.dataset.bloqueada = "1";
                    mesaDOM.classList.add("ocupada");
                    mesaDOM.classList.remove("disponible");
                    if (status) status.textContent = "Ocupada";

                } else {
                    mesaDOM.dataset.bloqueada = "0";
                    mesaDOM.classList.add("disponible");
                    mesaDOM.classList.remove("ocupada");
                    if (status) status.textContent = "Disponible";
                }
            });

        } catch (err) {
            console.error("Error cargando estado de mesas:", err);
        }
    }

    cargarEstadoMesas();
    // Opcional si quieres refresco cada 5 segundos:
    // setInterval(cargarEstadoMesas, 5000);



    // ======================================================
    // 2) CLICK EN MESA → ENVIAR FORMULARIO SI ESTÁ DISPONIBLE
    // ======================================================
    document.querySelectorAll(".mesa").forEach((mesa) => {
        mesa.addEventListener("click", (e) => {

            if (mesa.dataset.bloqueada === "1") {
                e.preventDefault();
                mostrarPopup("Esta mesa ya tiene un pedido activo.");
                return;
            }

            // Mesa disponible → enviamos su propio formulario
            console.log("Mesa seleccionada:", mesa.dataset.mesaId);

            mesa.submit();  // ← Cada mesa ES un formulario independiente
        });
    });



    // ======================================================
    // 3) CONTROL DE PISOS (VISUAL)
    // ======================================================
    const btnPiso1 = document.getElementById("btnPiso1");
    const btnPiso2 = document.getElementById("btnPiso2");

    const piso1 = document.getElementById("primer-piso");
    const piso2 = document.getElementById("segundo-piso");

    btnPiso1?.addEventListener("click", () => {
        piso1.classList.remove("oculto");
        piso2.classList.add("oculto");
        btnPiso1.classList.add("activo");
        btnPiso2.classList.remove("activo");
    });

    btnPiso2?.addEventListener("click", () => {
        piso2.classList.remove("oculto");
        piso1.classList.add("oculto");
        btnPiso2.classList.add("activo");
        btnPiso1.classList.remove("activo");
    });

});
