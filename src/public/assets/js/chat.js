Swal.fire({
    title: "Ingrese su nombre",
    input: "text",
    inputValidator: (value) => {
        return !value && "Debe ingresar un nombre";
    },
    allowOutsideClick: false,
}).then((datos) => {
    const socket = io();
    let name = datos.value;
    document.title = `Chat de ${name}`;


    let inputMessage = document.getElementById("mensaje");
    let divMessage = document.getElementById("mensajes");
    inputMessage.focus();

    socket.emit("id", name);
    socket.on("newUser", name => {
        Swal.fire({
            text: `Se conectó ${name}`,
            toast: true,
            position: "top-right"
        })
    });

    socket.on("previousMessages", (messages) => {
        messages.forEach(m => {
            let className = m.user === name ? "me" : "others";
            divMessage.innerHTML += `
        <div class="msg ${className}">
        <strong>${m.user}</strong>
        <p>${m.message}</p>
        </div>
        `;
            divMessage.scrollTop = divMessage.scrollHeight;
        });
    });

    socket.on("sendMessage", (name, message) => {
        let className = name === name ? "me" : "others";
        divMessage.innerHTML += `
    <div class="msg">
        <div class="${className}">
        <strong>${name}</strong>
        <p>${message}</p>
        </div>
    </div>
    `;
        divMessage.scrollTop = divMessage.scrollHeight;
    });

    socket.on("userDisconnected", (userName) => {
        Swal.fire({
            text: `${userName} se desconectó`,
            toast: true,
            position: "top-right"
        })
    });
    
    

    inputMessage.addEventListener("keyup", (e) => {
        e.preventDefault();
        if (e.code === "Enter" && e.target.value.trim().length > 0) {
            socket.emit("newMessage", name, e.target.value.trim());
            e.target.value = "";
            e.target.focus();
        }
    });
});