const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');

// Registro
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ 
                message: 'El usuario o email ya existe' 
            });
        }

        // Crear nuevo usuario
        const user = new User({
            username,
            email,
            password // La contraseña se encripta en el modelo
        });

        await user.save();

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            message: 'Error al registrar usuario',
            error: error.message 
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Buscar usuario
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Actualizar estado
        user.status = 'online';
        await user.save();

        // Generar token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'tu_secreto_seguro',
            { expiresIn: '24h' }
        );

        // Enviar respuesta con cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        });

        res.json({
            message: 'Login exitoso',
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ 
            message: 'Error al iniciar sesión',
            error: error.message 
        });
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        // Actualizar estado del usuario
        await User.findByIdAndUpdate(req.user.userId, { status: 'offline' });
        
        res.clearCookie('token');
        res.json({ message: 'Logout exitoso' });
    } catch (err) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router; 