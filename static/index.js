document.addEventListener("DOMContentLoaded", () => {

  //Botón de inicio
  const btnInicio = document.querySelector("#inicio button");
  btnInicio.addEventListener("click", mostrarFormulario); // <-- muestra el formulario primero

  // FORMULARIO: mostrar y manejar datos
  function mostrarFormulario() {
    document.getElementById("inicio").style.display = "none";
    document.getElementById("formulario").style.display = "block";
  }

  document.getElementById("datosForm").addEventListener("submit", function(e){
    e.preventDefault(); // Evita refrescar la página
    let nombre = document.getElementById("nombre").value;
    let personas = document.getElementById("personas").value;

    // Mostrar datos en el menú
    document.getElementById("resumen").textContent = `${nombre} - ${personas} persona(s)`;

    // Mostrar menú y ocultar formulario
    document.getElementById("formulario").style.display = "none";
    document.getElementById("menu").style.display = "block";
  });

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

  // 👉 Guardar la mesa seleccionada
  let mesaSeleccionada = null;

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

    // Si ya hay una mesa seleccionada distinta
    if (mesaSeleccionada && mesaSeleccionada !== mesa) {
      alert("⚠️ Solo puede seleccionar una mesa");
      return;
    }

    // Si hace clic en la misma mesa seleccionada → liberar
    if (mesa.classList.contains("ocupada")) {
      mesa.classList.remove("ocupada");
      mesa.classList.add("disponible");
      statusEl.textContent = "Disponible";
      timerEl.style.display = "none";

      if (timers[id]) {
        clearInterval(timers[id].interval);
        delete timers[id];
      }

      mesaSeleccionada = null; // 👉 ya no hay mesa elegida
      document.getElementById("acciones").style.display = "none"; // ocultar botón Ir al Menú
    } else {
      // Si no hay mesa seleccionada → ocupar
      mesa.classList.remove("disponible");
      mesa.classList.add("ocupada");
      statusEl.textContent = "Ocupada";
      timerEl.style.display = "block";

      timers[id]?.interval && clearInterval(timers[id].interval);
      timers[id] = {
        start: new Date(),
        interval: setInterval(() => actualizarTiempo(id, timerEl), 1000)
      };
      actualizarTiempo(id, timerEl);

      mesaSeleccionada = mesa; // 👉 guardar la mesa seleccionada
      document.getElementById("acciones").style.display = "block"; // mostrar botón Ir al Menú
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

  //Mostrar menú principal (oculta inicio y muestra mesas)
  function mostrarMenu() {
    document.getElementById("inicio").style.display = "none";
    document.getElementById("menu").style.display = "block";
  }

  document.getElementById("datosForm").addEventListener("submit", function(e){
   e.preventDefault(); // Evita refrescar la página 
    document.getElementById("formulario").style.display = "none";
    document.getElementById("menu").style.display = "block";
  }); 

  //agregamos el botón "Ir al Menú"
  const btnIrMenu = document.getElementById("btnIrMenu");
  if (btnIrMenu) {
    btnIrMenu.addEventListener("click", () => {
      window.location.href = "/menu/"; //redirige al menú
    });
  }

});
