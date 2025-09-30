document.addEventListener("DOMContentLoaded", () => {

  // Elementos pisos
  const primerPiso = document.getElementById("primer-piso");
  const segundoPiso = document.getElementById("segundo-piso");

  // Botones de piso
  document.getElementById("btnPiso1").addEventListener("click", () => {
    primerPiso.style.display = "grid";
    segundoPiso.style.display = "none";
    actualizarTemporizadoresVisibles(primerPiso);
  });

  document.getElementById("btnPiso2").addEventListener("click", () => {
    primerPiso.style.display = "none";
    segundoPiso.style.display = "grid";
    actualizarTemporizadoresVisibles(segundoPiso);
  });

  const mesas = document.querySelectorAll(".mesa");

  // Objeto para guardar temporizadores y tiempos de inicio
  let timers = {};

  // Inicializar temporizadores ocultos
  mesas.forEach(mesa => {
    const timerEl = mesa.querySelector(".timer");
    timerEl.style.display = "none";
  });

  mesas.forEach(mesa => {
    mesa.addEventListener("click", () => toggleMesa(mesa));
  });

  function toggleMesa(mesa) {
    const id = mesa.id;
    const statusEl = mesa.querySelector(".status");
    const timerEl  = mesa.querySelector(".timer");

    if (mesa.classList.contains("disponible")) {
      // Cambiar a ocupada
      mesa.classList.remove("disponible");
      mesa.classList.add("ocupada");
      statusEl.textContent = "Ocupada";

      //temporizador
      timerEl.style.display = "block";

      //Guardar hora de inicio y arrancar temporizador
      timers[id]?.interval && clearInterval(timers[id].interval);
      timers[id] = {
        start: new Date(),
        interval: setInterval(() => actualizarTiempo(id, timerEl), 1000)
      };
      actualizarTiempo(id, timerEl); //mostrar tiempo inmediatamente
    } else {
      //Cambiar a disponible
      mesa.classList.remove("ocupada");
      mesa.classList.add("disponible");
      statusEl.textContent = "Disponible";

      //Ocultar temporizador
      timerEl.style.display = "none";

      if (timers[id]) {
        clearInterval(timers[id].interval);
        delete timers[id];
      }
    }
  }

  function actualizarTiempo(id, timerEl) {
    const start = timers[id]?.start;
    if (!start) return;

    const now = new Date();
    const diff = Math.floor((now - start) / 1000);

    const horas = String(Math.floor(diff / 3600)).padStart(2,"0");
    const minutos = String(Math.floor((diff % 3600) / 60)).padStart(2,"0");
    const segundos = String(diff % 60).padStart(2,"0");

    timerEl.textContent = `${horas}:${minutos}:${segundos}`;
  }

  //Actualizar temporizadores visibles al cambiar de piso
  function actualizarTemporizadoresVisibles(piso) {
    piso.querySelectorAll(".mesa.ocupada").forEach(mesa => {
      const timerEl = mesa.querySelector(".timer");
      timerEl.style.display = "block";
      actualizarTiempo(mesa.id, timerEl);
    });
  }

});
