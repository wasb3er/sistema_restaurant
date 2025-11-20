const rolSwitch = document.getElementById("rolSwitch");
const loginTitle = document.getElementById("login-title");
const tipoLogin = document.getElementById("tipoLogin");
const btnLogin = document.getElementById("btnLogin");
const body = document.getElementById("bodyLogin");

// Establecer vista inicial
body.classList.add("empleado-bg");
btnLogin.classList.add("empleado");

rolSwitch.addEventListener("change", () => {
    if (rolSwitch.checked) {
        // Administrador
        loginTitle.textContent = "Login de Administrador";
        tipoLogin.value = "admin";

        btnLogin.classList.remove("empleado");
        btnLogin.classList.add("admin");

        body.classList.remove("empleado-bg");
        body.classList.add("admin-bg");

    } else {
        // Empleado
        loginTitle.textContent = "Login de Empleado";
        tipoLogin.value = "empleado";

        btnLogin.classList.remove("admin");
        btnLogin.classList.add("empleado");

        body.classList.remove("admin-bg");
        body.classList.add("empleado-bg");
    }
});

function showLoginAlert(mensaje) {
    const alertBox = document.getElementById("login-alert");
    alertBox.textContent = mensaje;
    alertBox.classList.remove("oculto");

    setTimeout(() => {
        alertBox.classList.add("show");
    }, 10);

    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.classList.add("oculto"), 300);
    }, 3000);
}
