const socket = io();
const userTableBody = document.getElementById("userTableBody");
const searchInput = document.getElementById("searchInput");

function getUsers() {
    socket.emit("getUsers", (users) => {
        emptyTable();
        showUsers(users);
    });
}

function emptyTable() {
    userTableBody.innerHTML = "";
}

function showUsers(users) {
    users.forEach((user) => {
        const row = createTableRow(user);
        userTableBody.appendChild(row);
    });
}

socket.on("users", (users) => {
    emptyTable();
    showUsers(users);
});

function createTableRow(user) {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${user.first_name} ${user.last_name}</td>
    <td>${user.email}</td>
    <td>${user._id}</td>
    <td>${user.rol}</td>
    <td>${user.last_connection ? new Date(user.last_connection).toLocaleString() : "Nunca"}</td>
    <td style="text-align: right;">
    <div class="btn-group">
    <button class="btn btn-editar" onClick="updateUserRole('${user._id}')">Cambiar Rol</button>
    <button class="btn btn-eliminar" onClick="deleteUser('${user._id}')">Eliminar</button>
    </div></td>
`;
    return row;
}

function updateUserRole(userId) {
    socket.emit("updateUserRole", userId);
}

function deleteUser(userId) {
    Swal.fire({
        title: "Eliminar usuario",
        text: "¿Estás seguro de que quieres eliminar este usuario?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            document.getElementById("loadingSpinner").style.display = "block";
            fetch(`api/users/${userId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("Success:", data);

                    Toastify({
                        text: "Usuario eliminado exitosamente",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        style: {
                            background: "#96c93d",
                        },
                    }).showToast();
                    document.getElementById("loadingSpinner").style.display = "none";
                    getUsers();
                })
                .catch((error) => {
                    console.error("Error:", error);
                    document.getElementById("loadingSpinner").style.display = "none";
                });
        }
    });
}

searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const rows = userTableBody.getElementsByTagName("tr");
    Array.from(rows).forEach((row) => {
        const name = row.cells[0].textContent.toLowerCase();
        const email = row.cells[1].textContent.toLowerCase();
        if (name.includes(filter) || email.includes(filter)) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
});

socket.on("userRoleUpdated", (user) => {
    Toastify({
        text: `Rol del usuario ${user.first_name} ${user.last_name} actualizado`,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: "#96c93d",
        },
    }).showToast();
});

getUsers();

document.getElementById("deleteInactiveUsers").addEventListener("click", function () {
    Swal.fire({
        title: "Eliminar usuarios inactivos",
        text: "¿Estás seguro de que quieres eliminar todos los usuarios inactivos?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
    }).then((result) => {
        if (result.isConfirmed) {
            fetch("api/users", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    console.log("Success:", data);
                    Toastify({
                        text: "Usuarios inactivos eliminados exitosamente",
                        duration: 3000,
                        gravity: "top",
                        position: "right",
                        style: {
                            background: "#96c93d",
                        },
                    }).showToast();
                    getUsers();
                })
                .catch((error) => {
                    console.error("Error:", error);
                });
        }
    });
});