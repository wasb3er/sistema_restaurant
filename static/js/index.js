document.addEventListener("DOMContentLoaded", () => {

//BOTÓN DE INICIO
  const btnInicio = document.querySelector("#inicio button");
  if (btnInicio) {
    btnInicio.addEventListener("click", mostrarFormulario);
  }

  function mostrarFormulario() {
    document.getElementById("inicio").style.display = "none";
    document.getElementById("formulario").style.display = "block";
  }

  //FORMULARIO
  const datosForm = document.getElementById("datosForm");
let clienteNombre = localStorage.getItem("clienteNombre") || "";
let clientePersonas = localStorage.getItem("clientePersonas") || 1;

//Si ya hay datos guardados, los mostramos directamente
if (clienteNombre) {
  const resumen = document.getElementById("resumen");
  if (resumen) {
    resumen.textContent = `${clienteNombre} - ${clientePersonas} persona(s)`;
  }
}

//Envío de formulario
if (datosForm) {
  datosForm.addEventListener("submit", function (e) {
    e.preventDefault();

    clienteNombre = document.getElementById("nombre").value.trim();
    clientePersonas = document.getElementById("personas").value.trim();

    if (!clienteNombre) {
      alert("⚠️ Por favor ingresa tu nombre antes de continuar.");
      return;
    }

    //Guardar los datos en localStorage
    localStorage.setItem("clienteNombre", clienteNombre);
    localStorage.setItem("clientePersonas", clientePersonas);

    //Mostrar el resumen y pasar al menú
    const resumen = document.getElementById("resumen");
    if (resumen) {
      resumen.textContent = `${clienteNombre} - ${clientePersonas} persona(s)`;
    }

    document.getElementById("formulario").style.display = "none";
    document.getElementById("menu").style.display = "block";
  });
}

//PISOS
  const primerPiso = document.getElementById("primer-piso");
  const segundoPiso = document.getElementById("segundo-piso");

  const btnPiso1 = document.getElementById("btnPiso1");
  const btnPiso2 = document.getElementById("btnPiso2");

  if (btnPiso1 && btnPiso2 && primerPiso && segundoPiso) {
    btnPiso1.addEventListener("click", () => {
      primerPiso.style.display = "grid";
      segundoPiso.style.display = "none";
      actualizarTemporizadoresVisibles(primerPiso);
    });

    btnPiso2.addEventListener("click", () => {
      primerPiso.style.display = "none";
      segundoPiso.style.display = "grid";
      actualizarTemporizadoresVisibles(segundoPiso);
    });
  }

  const mesas = document.querySelectorAll(".mesa");
  let timers = {};
  let mesaSeleccionada = null;

  if (mesas.length > 0) {
    mesas.forEach(mesa => {
      const timerEl = mesa.querySelector(".timer");
      timerEl.style.display = "none";
    });

    mesas.forEach(mesa => {
      mesa.addEventListener("click", () => toggleMesa(mesa));
    });
  }

  function toggleMesa(mesa) {
    const id = mesa.id;
    const statusEl = mesa.querySelector(".status");
    const timerEl = mesa.querySelector(".timer");

    if (mesaSeleccionada && mesaSeleccionada !== mesa) {
      alert("⚠️ Solo puede seleccionar una mesa");
      return;
    }

    if (mesa.classList.contains("ocupada")) {
      mesa.classList.remove("ocupada");
      mesa.classList.add("disponible");
      statusEl.textContent = "Disponible";
      timerEl.style.display = "none";

      if (timers[id]) {
        clearInterval(timers[id].interval);
        delete timers[id];
      }

      mesaSeleccionada = null;
      const acciones = document.getElementById("acciones");
      if (acciones) acciones.style.display = "none";
    } else {
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

      mesaSeleccionada = mesa;
      const acciones = document.getElementById("acciones");
      if (acciones) acciones.style.display = "block";
    }
  }

  function actualizarTiempo(id, timerEl) {
    const start = timers[id]?.start;
    if (!start) return;

    const now = new Date();
    const diff = Math.floor((now - start) / 1000);

    const horas = String(Math.floor(diff / 3600)).padStart(2, "0");
    const minutos = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
    const segundos = String(diff % 60).padStart(2, "0");

    timerEl.textContent = `${horas}:${minutos}:${segundos}`;
  }

  function actualizarTemporizadoresVisibles(piso) {
    piso.querySelectorAll(".mesa.ocupada").forEach(mesa => {
      const timerEl = mesa.querySelector(".timer");
      timerEl.style.display = "block";
      actualizarTiempo(mesa.id, timerEl);
    });
  }

//BOTÓN IR AL MENÚ
  const btnIrMenu = document.getElementById("btnIrMenu");
  if (btnIrMenu) {
    btnIrMenu.addEventListener("click", () => {
      window.location.href = "/menu/";
    });
  }

//CARRITO DE COMPRAS
  let carrito = [];

  window.agregarAlCarrito = function (id, nombre, precio) {
    const productoExistente = carrito.find(p => p.id === id);
    if (productoExistente) {
      productoExistente.cantidad += 1;
    } else {
      carrito.push({ id, nombre, precio, cantidad: 1 });
    }
    actualizarCarrito();
  };

  function actualizarCarrito() {
    const lista = document.getElementById("carrito-lista");
    const totalEl = document.getElementById("total");
    if (!lista || !totalEl) return;

    lista.innerHTML = "";
    let total = 0;

    carrito.forEach(item => {
      total += item.precio * item.cantidad;
      const li = document.createElement("li");
      li.textContent = `${item.nombre} x${item.cantidad} - $${item.precio * item.cantidad}`;
      lista.appendChild(li);
    });

    totalEl.textContent = total.toFixed(2);
  }

//CONFIRMAR PEDIDO 
  window.confirmarPedido = function () {
  if (carrito.length === 0) {
    alert("🛒 Tu carrito está vacío");
    return;
  }

  if (!clienteNombre) {
    alert("⚠️ Debes ingresar tus datos primero.");
    return;
  }

//Datos del pedido que se enviarán al backend
  const pedidoData = {
    nombre: clienteNombre,
    personas: clientePersonas,
    platillos: carrito   //Cambiado "carrito" => "platillos" para que coincida con Django
  };

  fetch("/crear_pedido/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCookie("csrftoken"),
    },
    body: JSON.stringify(pedidoData),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert(`Pedido #${data.pedido_id} registrado correctamente. Total: $${data.total}`);
        carrito = [];
        actualizarCarrito();
      } else {
        alert(`Error: ${data.error}`);
      }
    })
    .catch(err => console.error("Error al crear el pedido:", err));
};

//TOKEN CSRF
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

});
