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

    socket.on('disconnect', () => {
        console.log('Usuario desconectado');
    });

    socket.on('chat message', (msg) => {
        const message = new Message({ content: msg, sender: socket.id });
        message.save();
        io.emit('chat message', msg);
    });
});

// Inicio del servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
