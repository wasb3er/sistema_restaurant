// ======================================================
// INDEX CLIENTE – CARRUSEL + ORDENAR
// ======================================================

// 1. Carrusel principal
document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".big-slide");
    if (slides.length === 0) return;

    let index = 0;
    const prev = document.querySelector(".big-prev");
    const next = document.querySelector(".big-next");

    function showSlide(n) {
        slides.forEach(s => s.style.display = "none");
        slides[n].style.display = "block";
    }

    function nextSlide() {
        index = (index + 1) % slides.length;
        showSlide(index);
    }

    prev?.addEventListener("click", () => {
        index = (index - 1 + slides.length) % slides.length;
        showSlide(index);
    });

    next?.addEventListener("click", nextSlide);

    showSlide(index);
    setInterval(nextSlide, 4000);
});

// 2. Botón ORDENAR
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("btnOrdenar");

    btn?.addEventListener("click", () => {
        localStorage.removeItem("mesa_id");
        localStorage.removeItem("clienteNombre");
        localStorage.removeItem("clientePersonas");

        window.location.href = "/cliente/mesas/";
    });
});
