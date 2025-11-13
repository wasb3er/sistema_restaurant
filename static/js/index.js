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

  window.agregarAlCarrito = function (id, nombre, precio, imagen) {
  const productoExistente = carrito.find(p => p.id === id);
  if (productoExistente) {
    productoExistente.cantidad += 1;
  } else {
    carrito.push({ id, nombre, precio, imagen, cantidad: 1 });
  }
  actualizarCarrito();
};

window.eliminarDelCarrito = function (id) {
  const producto = carrito.find(p => p.id === id);
  if (!producto) return;

  if (producto.cantidad > 1) {
    producto.cantidad -= 1;
  } else {
    carrito = carrito.filter(p => p.id !== id);
  }
  actualizarCarrito();
};

function actualizarCarrito() {
  const lista = document.getElementById("carrito-lista");
  const totalEl = document.getElementById("total");
  const carritoLateral = document.getElementById("carrito-lateral");

  if (!lista || !totalEl || !carritoLateral) return;

  lista.innerHTML = "";
  let total = 0;

  carrito.forEach(item => {
    total += item.precio * item.cantidad;

    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center justify-content-between";

    //Usa la ruta exacta de Django (ya guardada en BD)
    const imgUrl = item.imagen
      ? `/media/${item.imagen}`
      : '/static/img/placeholder.png';

    li.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${imgUrl}" 
             alt="${item.nombre}" 
             width="60" height="60" 
             class="me-3 rounded border"
             onerror="this.src='/static/img/placeholder.png'">
        <div>
          <h6 class="mb-0">${item.nombre}</h6>
          <small class="text-muted">
            x${item.cantidad} — $${(item.precio * item.cantidad).toFixed(2)}
          </small>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger" 
              onclick="eliminarDelCarrito(${item.id})">
        🗑️
      </button>
    `;

    lista.appendChild(li);
  });

  totalEl.textContent = total.toFixed(2);

  //Mostrar u ocultar carrito según haya productos
  if (carrito.length > 0) {
    carritoLateral.classList.remove("d-none");
  } else {
    carritoLateral.classList.add("d-none");
  }
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

  //Cargar lista de platillos dinámicamente
async function cargarPlatillos() {
  const tabla = document.getElementById("tabla-platillos");
  if (!tabla) return; //Si no estás en menu.html, salir

  try {
    const res = await fetch("/api/platillos/");
    const data = await res.json();
    tabla.innerHTML = "";

    data.platillos.forEach(p => {
  const fila = document.createElement("tr");
  fila.id = `platillo-${p.id}`;

  //Detectar si el usuario es staff leyendo una variable global de Django
  const isStaff = window.USER_IS_STAFF === true || window.USER_IS_STAFF === "true";

const esAdminMenu = window.location.pathname.includes("/admin-menu/");

fila.innerHTML = `
  <td>${p.nombre}</td>
  <td>${p.descripcion || ""}</td>
  <td>$${p.precio}</td>
  <td id="cantidad-${p.id}">${p.cantidad}</td>
  <td>
    ${!esAdminMenu ? `
      <button onclick="agregarAlCarrito(${p.id}, '${p.nombre}', ${p.precio})">Agregar</button>
    ` : ""}
    ${isStaff ? `
      <button onclick="editarPlatillo(${p.id}, '${p.nombre}', '${p.descripcion || ""}', ${p.precio}, ${p.cantidad})">Editar</button>
      
    ` : ""}
  </td>
`;
  tabla.appendChild(fila);
});
  } catch (err) {
    console.error("Error al cargar platillos:", err);
  }
}

//crear
const formCrear = document.getElementById("form-crear");
if (formCrear) {
  formCrear.addEventListener("submit", async e => {
    e.preventDefault();
    // const datos = Object.fromEntries(new FormData(formCrear).entries());
    const formData = new FormData(formCrear); //permite enviar imágenes
    try {
      const res = await fetch("/api/platillos/crear/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"), //sin Content-Type
        },
        body: formData, //FormData se envía directo, NO JSON
      });

      const data = await res.json();
      if (data.success) {
        alert("Platillo agregado correctamente");
        formCrear.reset();
        cargarPlatillos();
      } else {
        alert("Error al agregar platillo: " + (data.error || ""));
      }
    } catch (err) {
      console.error("Error al crear platillo:", err);
    }
  });
}

//editar
window.editarPlatillo = async function (id, nombre, descripcion, precio, cantidad) {
  const nuevoNombre = prompt("Nuevo nombre:", nombre);
  if (!nuevoNombre) return;

  const nuevaDescripcion = prompt("Nueva descripción:", descripcion);
  const nuevoPrecio = prompt("Nuevo precio:", precio);
  const nuevaCantidad = prompt("Nueva cantidad:", cantidad);

  //Crear input para elegir imagen (no bloquea con confirm/prompt)
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  const formCrear = document.getElementById("form-crear");
  formCrear.appendChild(input);

  input.addEventListener("change", async () => {
    const file = input.files[0];
    const formData = new FormData();
    formData.append("nombre", nuevoNombre);
    formData.append("descripcion", nuevaDescripcion);
    formData.append("precio", nuevoPrecio);
    formData.append("cantidad", nuevaCantidad);
    if (file) formData.append("imagen", file);

    try {
      const res = await fetch(`/api/platillos/${id}/editar/`, {
        method: "POST",
        headers: { "X-CSRFToken": getCookie("csrftoken") },
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        alert("Platillo actualizado correctamente con nueva imagen");
        cargarPlatillos();
      } else {
        alert("Error: " + (data.error || "")); 
      }
    } catch (err) {
      console.error("Error al editar platillo:", err);
    } finally {
      input.remove(); // eliminar input del DOM
    }
  });

  //Agregar pequeña pregunta visual antes de abrir el file dialog
  const deseaCambiar = confirm("¿Deseas cambiar también la imagen del platillo?");
  if (deseaCambiar) {
    input.click(); // el click ahora sí se considera “user action”
  } else {
    //Si no cambia imagen → PUT normal
    try {
      const res = await fetch(`/api/platillos/${id}/editar/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          nombre: nuevoNombre,
          descripcion: nuevaDescripcion,
          precio: nuevoPrecio, //corregido aquí
          cantidad: nuevaCantidad,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Platillo actualizado correctamente");
        cargarPlatillos();
      } else {
        alert("Error al editar platillo: " + (data.error || "")); 
      }
    } catch (err) {
      console.error("Error al editar platillo:", err);
    }
  }
};



//borrado
window.eliminarPlatillo = async function (id) {
  if (!confirm("¿Seguro que deseas eliminar este platillo?")) return;
  try {
    const res = await fetch(`/api/platillos/${id}/eliminar/`, {
      method: "DELETE",
      headers: {"X-CSRFToken": getCookie("csrftoken")},
    });
    const data = await res.json();

    if (data.success) {
      alert("Platillo eliminado correctamente");
      cargarPlatillos();
    } else {
      alert("Error al eliminar platillo: " + (data.error || ""));
    }
  } catch (err) {
    console.error("Error al eliminar platillo:", err);
  }
};

//Cargar los platillos automáticamente al entrar en menu.html
if (document.getElementById("tabla-platillos")) {
  cargarPlatillos();
}
});
