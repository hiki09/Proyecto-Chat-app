const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const { Socket } = require('socket.io');
const Message = require('./models/message');

// Configuración de variables de entorno
require('dotenv').config();

// Conexion a la base de datos MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Chat-app';
mongoose.connect(MONGODB_URI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error de conexion a MongoDB:'));

// Configuracion del servidor
app.use(express.static('public'));

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
http.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
