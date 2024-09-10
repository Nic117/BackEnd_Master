document.addEventListener('DOMContentLoaded', () => {
    const socket = io();
    const messagesHistory = document.getElementById('messages-history');
    const chatMessage = document.getElementById('chat-message');
    const sendButton = document.getElementById('send-button');
    const joinButton = document.getElementById('joinButton');
    const leaveButton = document.getElementById('leaveButton');
    const usersList = document.getElementById('usersDB');
    const userEmail = document.getElementById('user-email').value;
    let userName = localStorage.getItem('userName') || userEmail;

    chatMessage.disabled = true;
    sendButton.disabled = true;

    joinButton.addEventListener("click", joinChat);
    leaveButton.addEventListener("click", leaveChat);

    function joinChat() {
        socket.emit("id", userName);
        chatMessage.disabled = false;
        sendButton.disabled = false;
        joinButton.style.display = "none";
        leaveButton.style.display = "block";
    }

    function leaveChat() {
        joinButton.style.display = "block";
        leaveButton.style.display = "none";
        usersList.innerHTML = "";
        messagesHistory.innerHTML = "";
        chatMessage.disabled = true;
        sendButton.disabled = true;
        location.reload();
    }

    const sendMessage = () => {
        const message = chatMessage.value.trim();
        if (message && userName) {
            socket.emit('newMessage', userName, message);
            chatMessage.value = '';
        }
    };

    sendButton.addEventListener('click', sendMessage);

    socket.on('sendMessage', (name, message, avatar) => {
        if (name && message !== undefined) {
            const className = name === userName ? 'me' : 'others';
            messagesHistory.innerHTML += `
                <div class="msg-${className}">
                    <div class="message-body">
                        <img src="${avatar}" alt="${name}'s avatar" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                        <div class="content">
                            <strong>${name}</strong>
                            <p>${message}</p>
                        </div>
                    </div>
                </div>
            `;
            messagesHistory.scrollTop = messagesHistory.scrollHeight;
        }
    });

    socket.on('previousMessages', (messages) => {
        messages.forEach(msg => {
            if (msg.user && msg.message !== undefined) {
                const className = msg.user === userName ? 'me' : 'others';
                messagesHistory.innerHTML += `
                    <div class="msg-${className}">
                        <div class="message-body">
                            <img src="${msg.avatar}" alt="${msg.user}'s avatar" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover;">
                            <div class="content">
                                <strong>${msg.user}</strong>
                                <p>${msg.message}</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        messagesHistory.scrollTop = messagesHistory.scrollHeight;
    });

    socket.on('newUser', (name) => {
        Swal.fire({
            text: `${name} se conectó`,
            toast: true,
            position: 'top-right'
        });
    });

    socket.on('userDisconnected', (name) => {
        Swal.fire({
            text: `${name} se desconectó`,
            toast: true,
            position: 'top-right'
        });
    });

    socket.on('usersList', (users) => {
        usersList.innerHTML = users.map(user => `<li class="list-group-item" style="background-color: #ffffff00;">${user}</li>`).join('');
    });

    socket.on('reconnect', () => {
        if (userName) {
            socket.emit('id', userName);
        }
    });

    socket.on('connect_error', (error) => {
        Swal.fire({
            title: 'Error de conexión',
            text: error.message,
            icon: 'error'
        });
    });
});
