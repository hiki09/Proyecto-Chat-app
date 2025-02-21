const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const path = require('path');
const { Socket } = require('socket.io');
const Message = require('./models/message');
const checkAuth = require('./middleware/checkAuth');

// Configuración de variables de entorno
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de autenticación
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta del chat
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Configuracion del servidor
app.use(checkAuth);

// Conexión a MongoDB con manejo de errores
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/Chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexion a MongoDB:'));

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Error en el servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Manejo de conexiones Socket.IO
io.on('connection', (socket) => {
    console.log('Usuario conectado');

    socket.on('user joined', (username) => {
        // Notificar a todos que un usuario se unió
        socket.broadcast.emit('chat message', {
            username: 'Sistema',
            text: `${username} se ha unido al chat`
        });
    });

    socket.on('chat message', async (message) => {
        try {
            // Guardar mensaje en la base de datos
            const newMessage = new Message({
                username: message.username,
                text: message.text,
                timestamp: new Date()
            });
            await newMessage.save();

            // Emitir mensaje a todos excepto al remitente
            socket.broadcast.emit('chat message', message);
        } catch (error) {
            console.error('Error al guardar mensaje:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });
});

// Inicio del servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('\x1b[36m%s\x1b[0m', '🚀 Servidor iniciado correctamente');
    console.log('\x1b[33m%s\x1b[0m', `📱 Accede al chat en: http://localhost:${PORT}`);
    console.log('\x1b[32m%s\x1b[0m', '✨ Presiona Ctrl + Click en el enlace para abrir en el navegador');
});
