const socket = io();
const chatForm = document.getElementById('chat-form');
const chatMessages = document.getElementById('messages');
const usernameInput = document.getElementById('username');
const joinChatButton = document.getElementById('join-chat');

let username = '';

// Manejar el ingreso al chat
joinChatButton.addEventListener('click', () => {
    if (usernameInput.value.trim()) {
        username = usernameInput.value;
        usernameInput.disabled = true;
        joinChatButton.disabled = true;
        socket.emit('user joined', username);
        
        // Mostrar mensaje de bienvenida
        addMessage({
            username: 'Sistema',
            text: `Bienvenido ${username} al chat!`,
            time: new Date().toLocaleTimeString()
        });
    }
});

// Enviar mensaje
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const msg = e.target.elements.msg.value;
    
    if (!username) {
        alert('Por favor, ingresa tu nombre primero');
        return;
    }

    if (msg.trim()) {
        // Emitir mensaje al servidor
        socket.emit('chat message', {
            username,
            text: msg
        });

        // Agregar mensaje a la interfaz
        addMessage({
            username,
            text: msg,
            time: new Date().toLocaleTimeString(),
            outgoing: true
        });

        // Limpiar input y dar foco
        e.target.elements.msg.value = '';
        e.target.elements.msg.focus();
    }
});

// Escuchar mensajes
socket.on('chat message', (message) => {
    addMessage({
        ...message,
        time: new Date().toLocaleTimeString(),
        incoming: true
    });
});

// Función para agregar mensajes al DOM
function addMessage({ username, text, time, incoming, outgoing }) {
    const div = document.createElement('div');
    div.classList.add('message');
    
    if (incoming) div.classList.add('incoming');
    if (outgoing) div.classList.add('outgoing');
    
    div.innerHTML = `
        <div class="meta">
            <span class="username">${username}</span>
            <span class="time">${time}</span>
        </div>
        <p class="text">${text}</p>
    `;
    
    chatMessages.appendChild(div);
    
    // Scroll al último mensaje
    chatMessages.scrollTop = chatMessages.scrollHeight;
} 