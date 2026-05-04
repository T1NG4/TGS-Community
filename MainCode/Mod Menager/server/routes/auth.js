const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

const router = express.Router();

// Enhanced rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { accessKey, username, password } = req.body;

        // Validation
        if (!accessKey || !username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Find user by access key
        const result = await global.database.findUserByKey(accessKey);
        if (!result) {
            return res.status(401).json({
                success: false,
                message: 'Chave de acesso inválida'
            });
        }

        const { user, key } = result;

        // Verify username
        if (user.username !== username) {
            return res.status(401).json({
                success: false,
                message: 'Nome de usuário incorreto'
            });
        }

        // Verify password
        const isPasswordValid = await global.database.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Senha incorreta'
            });
        }

        // Check if user is active
        if (!user.active) {
            return res.status(401).json({
                success: false,
                message: 'Usuário desativado'
            });
        }

        // Update last login
        await global.database.updateUserLastLogin(user.id);

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        // Return user data without password
        const userResponse = {
            id: user.id,
            username: user.username,
            role: user.role,
            keys: user.keys,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        };

        res.json({
            success: true,
            message: 'Login realizado com sucesso',
            user: userResponse,
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Token validation endpoint
router.get('/validate', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Get user from database
        const user = await global.database.findUserByUsername(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Return user data without password
        const userResponse = {
            id: user.id,
            username: user.username,
            role: user.role,
            keys: user.keys,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
        };

        res.json({
            success: true,
            user: userResponse
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        console.error('Token validation error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        // Verify old token
        const decoded = jwt.verify(token, config.jwt.secret, { ignoreExpiration: true });
        
        // Get user from database
        const user = await global.database.findUserByUsername(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Generate new token
        const newToken = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            success: true,
            token: newToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

// Logout endpoint (for future session management)
router.post('/logout', async (req, res) => {
    try {
        // In a real implementation, you might want to invalidate the token
        // For now, we'll just return success
        res.json({
            success: true,
            message: 'Logout realizado com sucesso'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

module.exports = router;
