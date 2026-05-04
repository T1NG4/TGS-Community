const express = require('express');
const cors = require('cors');
const mysql2 = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

// Configurar trust proxy para localtunnel
app.set('trust proxy', true);

// Middleware de segurança
app.use(helmet({
    contentSecurityPolicy: false // Desabilitado para Mercado Pago funcionar
}));

// Rate limiting para auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // máximo 5 tentativas por IP
    message: {
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const recoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // máximo 3 recuperações por email
    message: {
        success: false,
        message: 'Muitas solicitações de recuperação. Tente novamente em 1 hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiting geral para APIs
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requisições por IP
    message: {
        success: false,
        message: 'Muitas requisições. Tente novamente em alguns minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware CORS
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));

// Rate limiting geral
app.use('/api/', generalLimiter);

// Middleware de logs de segurança
app.use('/api/', (req, res, next) => {
    const timestamp = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    const method = req.method;
    const url = req.url;
    
    console.log(`[SECURITY] ${timestamp} - ${ip} - ${method} ${url} - ${userAgent}`);
    
    // Detectar atividades suspeitas
    if (method === 'POST' && (url.includes('login') || url.includes('recover'))) {
        console.log(`[ALERT] Tentativa de auth: ${ip} - ${url}`);
    }
    
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tgs_launcher',
    charset: 'utf8mb4'
};

// Configuração do serviço de email
const emailConfig = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

// Criar transportador de email
const transporter = nodemailer.createTransport(emailConfig);

// Configuração do Mercado Pago
// MercadoPagoConfig, Preference, and Payment já foram importados no topo do arquivo

// Configura o cliente do Mercado Pago
const client = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
    options: {
        integratorId: process.env.MERCADO_PAGO_INTEGRATOR_ID || ''
    }
});

// Inicializa os serviços
const preference = new Preference(client);
const payment = new Payment(client);

// Função para conectar ao banco
async function getConnection() {
    return await mysql2.createConnection(dbConfig);
}

// Função para sanitizar inputs
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim()
        .replace(/[<>]/g, '') // Remove tags HTML
        .replace(/['"]/g, '') // Remove aspas
        .substring(0, 100); // Limita tamanho
}

// Função para validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 100;
}

// Função para validar username
function isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    return usernameRegex.test(username);
}

// Função para validar chave de acesso
function isValidAccessKey(key) {
    const keyRegex = /^TGS-\d{4}-(ADMIN|CREATOR|STANDARD)-[A-Z0-9]{3,6}$/;
    return keyRegex.test(key);
}

// Gerar token aleatório
function generateToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Gerar chave de acesso aleatória
function generateAccessKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const year = new Date().getFullYear();
    const types = ['ADMIN', 'PREMIUM', 'STANDARD', 'BASIC'];
    const type = types[Math.floor(Math.random() * types.length)];
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TGS-${year}-${type}-${random}`;
}

// Gerar senha temporária
function generateTempPassword() {
    return Math.random().toString(36).substring(2, 12) + Math.floor(Math.random() * 100);
}

// Gerar token JWT
function generateAuthToken(user) {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username, 
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
}

// Middleware para validar token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de autenticação não fornecido.' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('JWT verification error:', err && err.message ? err.message : err);
            
            // Se o token expirou, tentar renovar se houver refresh token
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Token expirado. Faça login novamente.',
                    expired: true
                });
            }
            
            return res.status(403).json({ 
                success: false, 
                message: 'Token inválido ou expirado.' 
            });
        }

        req.user = decoded;
        next();
    });
}

// API de login
app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { username, password, accessKey } = req.body;
    
    // Sanitizar inputs
    const sanitizedUsername = sanitizeInput(username);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedAccessKey = sanitizeInput(accessKey || '');
    
    // Validações básicas
    if (!sanitizedUsername || !sanitizedPassword) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nome de usuário e senha são obrigatórios.' 
        });
    }
    
    // Validações de formato
    if (!isValidUsername(sanitizedUsername)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Formato de nome de usuário inválido.' 
        });
    }
    
    // Validar chave de acesso apenas se fornecida
    if (sanitizedAccessKey && !isValidAccessKey(sanitizedAccessKey)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Formato de chave de acesso inválido.' 
        });
    }
    
    if (sanitizedPassword.length < 6 || sanitizedPassword.length > 50) {
        return res.status(400).json({ 
            success: false, 
            message: 'Senha deve ter entre 6 e 50 caracteres.' 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        
        // Buscar usuário pelo username (usando sanitized)
        const [users] = await connection.execute(
            'SELECT id, username, email, password, role, active FROM users WHERE username = ?',
            [sanitizedUsername]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Nome de usuário ou senha incorretos.' 
            });
        }

        const user = users[0];

        if (!user.active) {
            return res.status(401).json({ 
                success: false, 
                message: 'Conta desativada. Entre em contato com o suporte.' 
            });
        }

        // Verificar senha (usando sanitized)
        const passwordMatch = await bcrypt.compare(sanitizedPassword, user.password);
        if (!passwordMatch) {
            // Log de login falho
            await connection.execute(
                'INSERT INTO auth_logs (user_id, action, success, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
                [user.id, 'failed_login', false, req.ip, req.get('User-Agent') || 'Unknown']
            );
            
            return res.status(401).json({ 
                success: false, 
                message: 'Nome de usuário ou senha incorretos.' 
            });
        }

        // Verificar chave de acesso apenas se fornecida (usando sanitized)
        if (sanitizedAccessKey) {
            const [keys] = await connection.execute(
                'SELECT id, code, type, status FROM access_keys WHERE user_id = ? AND code = ? AND status = "active"',
                [user.id, sanitizedAccessKey]
            );

            if (keys.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Chave de acesso inválida ou inativa.' 
                });
            }
        }

        // Atualizar último login e contador
        await connection.execute(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?',
            [user.id]
        );

        // Log de login sucesso
        await connection.execute(
            'INSERT INTO auth_logs (user_id, action, success, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [user.id, 'login', true, req.ip, req.get('User-Agent') || 'Unknown']
        );

        // Log de uso da chave
        await connection.execute(
            'INSERT INTO auth_logs (user_id, action, success, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [user.id, 'key_used', true, req.ip, req.get('User-Agent') || 'Unknown']
        );

        // Gerar token JWT
        const token = generateAuthToken(user);

        // Preparar resposta
        const response = {
            success: true,
            message: 'Login realizado com sucesso!',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };

        // Adicionar chave apenas se fornecida e verificada
        if (sanitizedAccessKey) {
            const [keys] = await connection.execute(
                'SELECT id, code, type, status FROM access_keys WHERE user_id = ? AND code = ? AND status = "active"',
                [user.id, sanitizedAccessKey]
            );
            
            if (keys.length > 0) {
                response.accessKey = {
                    code: keys[0].code,
                    type: keys[0].type
                };
            }
        }

        // Retornar sucesso
        res.json(response);

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao processar login. Tente novamente.' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para solicitar recuperação de dados
app.post('/api/recover', recoveryLimiter, async (req, res) => {
    const { email, type } = req.body;
    
    // Sanitizar inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedType = sanitizeInput(type);
    
    console.log(`[DEBUG] Recuperação solicitada: email=${sanitizedEmail}, type=${sanitizedType}`);
    
    // Validações básicas
    if (!sanitizedEmail || !sanitizedType) {
        return res.status(400).json({
            success: false,
            message: 'Email e tipo são obrigatórios.'
        });
    }
    
    // Validação de formato
    if (!isValidEmail(sanitizedEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Email inválido.'
        });
    }
    
    if (!['password', 'username', 'key'].includes(sanitizedType)) {
        return res.status(400).json({
            success: false,
            message: 'Tipo de recuperação inválido.'
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        
        // Buscar usuário pelo email (usando sanitized)
        const [users] = await connection.execute(
            'SELECT id, username, email FROM users WHERE email = ? AND active = TRUE',
            [sanitizedEmail]
        );
        
        if (users.length === 0) {
            console.log(`[DEBUG] Usuário não encontrado: ${sanitizedEmail}`);
            // Sempre retornar sucesso por segurança
            return res.json({
                success: true,
                message: 'Se o email estiver cadastrado, você receberá um link de recuperação.'
            });
        }
        
        const user = users[0];
        console.log(`[DEBUG] Usuário encontrado: ${user.username} (${user.email})`);
        
        let resetLink, keyLink, mailOptions;
        
        if (type === 'password') {
            // Gerar token para reset de senha
            const token = generateToken();
            const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            
            // Salvar token no banco
            await connection.execute(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiry]
            );
            
            resetLink = `http://localhost:3001/reset-password?token=${token}`;
            
            mailOptions = {
                from: process.env.EMAIL_USER,
                to: sanitizedEmail, // Usando email sanitizado
                subject: 'Redefinição de Senha - TGS Launcher',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #6C63FF; margin: 0;">TGS Launcher</h1>
                            <p style="color: #666; margin: 5px 0;">Redefinição de Senha</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h2 style="color: #333; margin-top: 0;">Olá, ${user.username}!</h2>
                            <p style="color: #666; line-height: 1.6;">
                                Recebemos uma solicitação para redefinir sua senha. 
                                Se você não fez esta solicitação, ignore este email.
                            </p>
                            <p style="color: #666; line-height: 1.6;">
                                Clique no link abaixo para redefinir sua senha:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetLink}" 
                                   style="background: #6C63FF; color: white; padding: 15px 30px; text-decoration: none; 
                                          border-radius: 5px; font-weight: bold; display: inline-block;">
                                    Redefinir Senha
                                </a>
                            </div>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <p style="color: #856404; margin: 0; font-size: 14px;">
                                <strong>Atenção:</strong> Nunca compartilhe este link com outras pessoas.
                            </p>
                        </div>
                    </div>
                `
            };
            
        } else if (type === 'username') {
            // Enviar username diretamente no email
            mailOptions = {
                from: process.env.EMAIL_USER,
                to: sanitizedEmail, // Usando email sanitizado
                subject: 'Recuperação de Nome de Usuário - TGS Launcher',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #6C63FF; margin: 0;">TGS Launcher</h1>
                            <p style="color: #666; margin: 5px 0;">Recuperação de Nome de Usuário</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h2 style="color: #333; margin-top: 0;">Olá!</h2>
                            <p style="color: #666; line-height: 1.6;">
                                Recebemos uma solicitação para recuperar seu nome de usuário. 
                                Se você não fez esta solicitação, ignore este email.
                            </p>
                            <p style="color: #666; line-height: 1.6;">
                                Seu nome de usuário é:
                            </p>
                            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
                                <code style="font-size: 1.2rem; color: #6C63FF; font-weight: bold;">${user.username}</code>
                            </div>
                        </div>
                        
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <p style="color: #1976d2; margin: 0; font-size: 14px;">
                                <strong>Como usar:</strong> Copie o nome de usuário e use-o no aplicativo TGS Launcher.
                            </p>
                        </div>
                        
                        <div style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
                            <p>Se você não solicitou esta recuperação, pode ignorar este email com segurança.</p>
                            <p>O TGS Launcher é um aplicativo desktop e não funciona no navegador.</p>
                        </div>
                    </div>
                `
            };
            
        } else if (type === 'key') {
            // Gerar token para visualizar chaves
            const token = generateToken();
            const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            
            // Salvar token no banco
            await connection.execute(
                'INSERT INTO key_view_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, token, expiry]
            );
            
            keyLink = `http://localhost:3001/view-keys?token=${token}`;
            
            mailOptions = {
                from: process.env.EMAIL_USER,
                to: sanitizedEmail, // Usando email sanitizado
                subject: 'Recuperação de Chaves - TGS Launcher',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #6C63FF; margin: 0;">TGS Launcher</h1>
                            <p style="color: #666; margin: 5px 0;">Recuperação de Chaves</p>
                        </div>
                        
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                            <h2 style="color: #333; margin-top: 0;">Olá, ${user.username}!</h2>
                            <p style="color: #666; line-height: 1.6;">
                                Recebemos uma solicitação para visualizar suas chaves de acesso. 
                                Se você não fez esta solicitação, ignore este email.
                            </p>
                            <p style="color: #666; line-height: 1.6;">
                                Clique no link abaixo para visualizar suas chaves:
                            </p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${keyLink}" 
                                   style="background: #6C63FF; color: white; padding: 15px 30px; text-decoration: none; 
                                          border-radius: 5px; font-weight: bold; display: inline-block;">
                                    Visualizar Chaves
                                </a>
                            </div>
                        </div>
                        
                        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                            <p style="color: #856404; margin: 0; font-size: 14px;">
                                <strong>Atenção:</strong> Nunca compartilhe suas chaves com outras pessoas.
                            </p>
                        </div>
                    </div>
                `
            };
        }
        
        console.log(`[DEBUG] Enviando email para: ${sanitizedEmail}`);
        console.log(`[DEBUG] Config email: ${process.env.EMAIL_USER ? 'OK' : 'NOT SET'}`);
        
        await transporter.sendMail(mailOptions);
        
        console.log(`[DEBUG] Email enviado com sucesso para: ${sanitizedEmail}`);
        
        res.json({
            success: true,
            message: 'Se o email estiver cadastrado, você receberá um link de recuperação.'
        });
        
    } catch (error) {
        console.error('[ERROR] Erro na recuperação:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar solicitação'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para redefinir senha com token
app.post('/api/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;
    
    // Sanitizar inputs
    const sanitizedToken = sanitizeInput(token);
    const sanitizedNewPassword = sanitizeInput(newPassword);
    
    // Validações básicas
    if (!sanitizedToken || !sanitizedNewPassword) {
        return res.status(400).json({
            success: false,
            message: 'Token e nova senha são obrigatórios.'
        });
    }
    
    // Validação de formato da senha
    if (sanitizedNewPassword.length < 6 || sanitizedNewPassword.length > 50) {
        return res.status(400).json({
            success: false,
            message: 'A senha deve ter entre 6 e 50 caracteres'
        });
    }
    
    // Validação de complexidade da senha
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(sanitizedNewPassword)) {
        return res.status(400).json({
            success: false,
            message: 'A senha deve conter letras maiúsculas, minúsculas e números'
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        
        // Validar token (usando sanitized)
        const [tokenRows] = await connection.execute(
            'SELECT user_id, email, expires_at, used FROM password_reset_tokens WHERE token = ?',
            [sanitizedToken]
        );
        
        if (tokenRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        const tokenData = tokenRows[0];
        
        // Verificar se token não expirou
        if (new Date() > new Date(tokenData.expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'Token expirado. Solicite uma nova recuperação de senha.'
            });
        }
        
        // Verificar se token já foi usado
        if (tokenData.used) {
            return res.status(400).json({
                success: false,
                message: 'Token já utilizado. Solicite uma nova recuperação de senha.'
            });
        }
        
        // Hash da nova senha (usando sanitized)
        const hashedPassword = await bcrypt.hash(sanitizedNewPassword, 10);
        
        // Atualizar senha do usuário
        await connection.execute(
            'UPDATE users SET password = ? WHERE id = ?',
            [hashedPassword, tokenData.user_id]
        );
        
        // Marcar token como usado (usando sanitized)
        await connection.execute(
            'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
            [sanitizedToken]
        );
        
        // Log da alteração
        await connection.execute(
            'INSERT INTO auth_logs (user_id, action, ip_address, user_agent, success) VALUES (?, ?, ?, ?, ?)',
            [tokenData.user_id, 'password_change', req.ip, req.get('User-Agent'), true]
        );
        
        res.json({
            success: true,
            message: 'Senha redefinida com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao redefinir senha'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para visualizar chaves via token
app.get('/api/view-keys/:token', async (req, res) => {
    const { token } = req.params;
    
    // Sanitizar token
    const sanitizedToken = sanitizeInput(token);
    
    if (!sanitizedToken) {
        return res.json({
            success: false,
            message: 'Token inválido'
        });
    }
    
    let connection;
    try {
        connection = await getConnection();
        
        // Verificar token na tabela key_view_tokens (usando sanitized)
        const [tokenRows] = await connection.execute(
            'SELECT user_id, expires_at, used FROM key_view_tokens WHERE token = ?',
            [sanitizedToken]
        );
        
        if (tokenRows.length === 0) {
            return res.json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        const tokenData = tokenRows[0];
        
        // Verificar expiração e uso
        if (new Date() > new Date(tokenData.expires_at) || tokenData.used) {
            return res.json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
        
        // Buscar chaves do usuário
        const [keyRows] = await connection.execute(
            'SELECT code, type, status, purchase_date, expiry_date, is_lifetime FROM access_keys WHERE user_id = ? AND status = "active"',
            [tokenData.user_id]
        );
        
        // Marcar token como usado (usando sanitized)
        await connection.execute(
            'UPDATE key_view_tokens SET used = TRUE WHERE token = ?',
            [sanitizedToken]
        );
        
        res.json({
            success: true,
            keys: keyRows
        });
        
    } catch (error) {
        console.error('Erro ao visualizar chaves:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao visualizar chaves'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// --- Mercado Pago Integration -------------------------------------------------
// API para criar preferência de pagamento Mercado Pago
app.post('/api/mercadopago/create-preference', authenticateToken, async (req, res) => {
    const { modelName, price, currency, isGift, giftEmail, modId } = req.body;
    
    // Sanitizar e validar inputs
    if (!modelName || !price) {
        return res.status(400).json({
            success: false,
            message: 'Modelo e preço são obrigatórios.'
        });
    }

    const sanitizedModel = sanitizeInput(modelName);
    const sanitizedPrice = parseFloat(price);
    
    if (isNaN(sanitizedPrice) || sanitizedPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Preço inválido.'
        });
    }
    
    // Forçar BRL como moeda, já que é o único suportado pelo Mercado Pago no Brasil
    const sanitizedCurrency = 'BRL';
    const sanitizedGiftEmail = giftEmail && isValidEmail(giftEmail) ? giftEmail.trim() : '';
    const sanitizedModId = modId ? sanitizeInput(modId) : '';
    
    // Validações básicas
    if (!sanitizedModel || !sanitizedPrice) {
        return res.status(400).json({
            success: false,
            message: 'Dados incompletos para criar preferência.'
        });
    }
    
    if (isNaN(sanitizedPrice) || sanitizedPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Preço inválido.'
        });
    }
    
    if (sanitizedGiftEmail && !isValidEmail(sanitizedGiftEmail)) {
        return res.status(400).json({
            success: false,
            message: 'Email de presente inválido.'
        });
    }

    let connection;
    try {
        connection = await getConnection();
        
        // Buscar informações do usuário
        const [users] = await connection.execute(
            'SELECT id, username, email FROM users WHERE id = ?',
            [req.user.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado.'
            });
        }
        
        const user = users[0];
        
        // Criar registro de pagamento
        const [paymentResult] = await connection.execute(
            'INSERT INTO payments (user_id, amount, model, method, gift_email, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
            [user.id, sanitizedPrice, sanitizedModel, 'mercadopago', sanitizedGiftEmail, 'pending']
        );
        
        const paymentId = paymentResult.insertId;
        
        // Criar preferência no Mercado Pago
        const preferenceData = {
            items: [{
                id: String(paymentId),
                title: `TGS Launcher - ${sanitizedModel}`,
                description: `Plano ${sanitizedModel} do TGS Launcher`,
                quantity: 1,
                currency_id: sanitizedCurrency,
                unit_price: sanitizedPrice
            }],
            payer: {
                name: user.username,
                email: user.email
            },
            payment_methods: {
                excluded_payment_types: [],
                excluded_payment_methods: [],
                installments: 12,
                default_payment_method_id: null,
                // Habilitar métodos de pagamento específicos incluindo Pix
                accepted_payment_methods: [
                    { id: 'pix' },
                    { id: 'credit_card' },
                    { id: 'debit_card' }
                ]
            },
            back_urls: {
                success_url: process.env.MERCADO_PAGO_SUCCESS_URL || 'http://localhost:3001/open-launcher?payment=success',
                failure_url: process.env.MERCADO_PAGO_FAILURE_URL || 'http://localhost:3001/open-launcher?payment=cancel',
                pending_url: process.env.MERCADO_PAGO_PENDING_URL || 'http://localhost:3001/open-launcher?payment=pending'
            },
            notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL || 'http://localhost:3001/api/payment/webhook',
            external_reference: String(paymentId),
            statement_descriptor: 'TGS Launcher',
            binary_mode: true,
            metadata: {
                payment_id: String(paymentId),
                user_id: String(user.id),
                model: sanitizedModel,
                gift_email: sanitizedGiftEmail,
                mod_id: sanitizedModId,
                is_gift: isGift ? 'true' : 'false'
            }
        };

        console.log('Criando preferência no Mercado Pago com os dados:', JSON.stringify(preferenceData, null, 2));
        
        // Criar preferência usando o novo cliente
        const response = await preference.create({ body: preferenceData });
        
        console.log('[MERCADO PAGO] Resposta da API:', JSON.stringify(response, null, 2));
        
        // Tratar diferentes formatos de resposta
        let checkoutUrl;
        if (response.init_point) {
            checkoutUrl = response.init_point;
        } else if (response.sandbox_init_point) {
            checkoutUrl = response.sandbox_init_point;
        } else if (response.body && response.body.init_point) {
            checkoutUrl = response.body.init_point;
        } else if (response.body && response.body.sandbox_init_point) {
            checkoutUrl = response.body.sandbox_init_point;
        } else {
            console.error('[MERCADO PAGO] Estrutura de resposta inesperada:', response);
            throw new Error('Falha ao gerar URL de pagamento - resposta inválida');
        }

        // Salvar a URL da preferência no pagamento
        await connection.execute(
            'UPDATE payments SET mercadopago_preference_id = ? WHERE id = ?',
            [response.id || response.body?.id, paymentId]
        );

        res.json({
            success: true,
            message: 'Checkout criado com sucesso.',
            initPoint: checkoutUrl,
            sandboxInitPoint: checkoutUrl,
            paymentId: paymentId,
            preferenceId: response.id || response.body?.id
        });

    } catch (error) {
        console.error('Erro ao criar preferência Mercado Pago:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar pagamento. Tente novamente.'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para verificar status do pagamento Mercado Pago
app.get('/api/mercadopago/payment-status/:preferenceId', authenticateToken, async (req, res) => {
    const { preferenceId } = req.params;
    
    if (!preferenceId) {
        return res.status(400).json({ 
            success: false, 
            message: 'ID da preferência é obrigatório' 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        
        // Buscar pagamento pelo preference_id
        const [payments] = await connection.execute(
            'SELECT id, status, paid_at, mercadopago_payment_id, created_at FROM payments WHERE mercadopago_preference_id = ? AND user_id = ?',
            [preferenceId, req.user.userId]
        );

        if (payments.length === 0) {
            console.log(`[PAYMENT STATUS] Pagamento não encontrado: ${preferenceId}`);
            return res.status(404).json({ 
                success: false, 
                message: 'Pagamento não encontrado' 
            });
        }

        const payment = payments[0];
        console.log(`[PAYMENT STATUS] Verificando pagamento ${payment.id} - Status atual: ${payment.status}`);
        
        // Se tiver payment_id do Mercado Pago, buscar status atualizado
        let mpStatus = payment.status;
        if (payment.mercadopago_payment_id) {
            try {
                console.log(`[PAYMENT STATUS] Buscando status no Mercado Pago para payment_id: ${payment.mercadopago_payment_id}`);
                const mpPaymentData = await payment.get({ id: payment.mercadopago_payment_id });
                const paymentInfo = mpPaymentData.body || mpPaymentData;
                mpStatus = paymentInfo.status;
                
                console.log(`[PAYMENT STATUS] Status no Mercado Pago: ${mpStatus}`);
                
                // Atualizar status no banco se for diferente
                if (mpStatus !== payment.status) {
                    await connection.execute(
                        'UPDATE payments SET status = ?, paid_at = IF(? = "approved", NOW(), paid_at) WHERE id = ?',
                        [mpStatus, mpStatus, payment.id]
                    );
                    console.log(`[PAYMENT STATUS] Status atualizado no banco: ${payment.status} -> ${mpStatus}`);
                    payment.status = mpStatus;
                }
            } catch (mpError) {
                console.error('Erro ao buscar status no Mercado Pago:', mpError);
                // Continuar com status do banco
            }
        } else {
            console.log(`[PAYMENT STATUS] Pagamento ainda não tem mercadopago_payment_id - Aguardando pagamento`);
        }

        res.json({
            success: true,
            status: mpStatus,
            paid_at: payment.paid_at,
            payment_id: payment.id,
            mercadopago_payment_id: payment.mercadopago_payment_id,
            created_at: payment.created_at
        });

    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao verificar status do pagamento' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Webhook do Mercado Pago
app.post('/api/payment/webhook', express.json(), async (req, res) => {
    console.log('[WEBHOOK] Recebida notificação do Mercado Pago');
    
    try {
        // Responder imediatamente para evitar timeout
        res.status(200).send('OK');
        
        // Verificar se o corpo da requisição está vazio
        if (!req.body) {
            console.error('[WEBHOOK] Erro: Corpo da requisição vazio');
            return;
        }
        
        // Dados já estão parseados pelo express.json()
        const data = req.body;
        console.log(`[WEBHOOK] Dados recebidos: ${JSON.stringify(data, null, 2)}`);
        
        // Validar dados obrigatórios
        if (!data || !data.type) {
            console.error('[WEBHOOK] Dados inválidos recebidos:', data);
            return;
        }
        
        // Processar apenas notificações de pagamento
        if (data.type === 'payment') {
            const paymentId = data.data?.id;
            
            if (!paymentId) {
                console.error('[WEBHOOK] ID de pagamento não encontrado nos dados:', data);
                return;
            }
            
            console.log(`[WEBHOOK] Processando pagamento ID: ${paymentId}`);
            
            try {
                // Buscar informações do pagamento no Mercado Pago
                console.log(`[WEBHOOK] Buscando detalhes do pagamento ${paymentId} no Mercado Pago...`);
                const paymentData = await payment.get({ id: paymentId });
                
                if (!paymentData) {
                    console.error(`[WEBHOOK] Pagamento ${paymentId} não encontrado no Mercado Pago`);
                    return; // Já respondemos OK
                }
                
                console.log(`[WEBHOOK] Dados do pagamento:`, JSON.stringify(paymentData, null, 2));
                
                // Tratar diferentes estruturas de resposta
                const paymentInfo = paymentData.body || paymentData;
                const externalReference = paymentInfo.external_reference;
                const status = paymentInfo.status;
                
                if (externalReference) {
                    const dbPaymentId = externalReference;
                    
                    console.log(`[WEBHOOK] Atualizando pagamento no banco de dados. ID: ${dbPaymentId}, Status: ${status}`);
                    
                    let connection;
                    try {
                        connection = await getConnection();
                        
                        // Atualizar status do pagamento no banco
                        await connection.execute(
                            'UPDATE payments SET status = ?, paid_at = IF(? = "approved", NOW(), paid_at), mercadopago_payment_id = ? WHERE id = ?',
                            [status, status, paymentId, dbPaymentId]
                        );
                        
                        console.log(`[WEBHOOK] Pagamento ${dbPaymentId} atualizado com status: ${status}`);
                        
                        // Se pagamento aprovado, gerar chave de acesso
                        if (status === 'approved') {
                            console.log(`[WEBHOOK] Processando pagamento aprovado: ${dbPaymentId}`);
                            
                            const [payments] = await connection.execute(
                                'SELECT user_id, model, gift_email FROM payments WHERE id = ?',
                                [dbPaymentId]
                            );
                            
                            if (payments.length > 0) {
                                const paymentData = payments[0];
                                const accessKey = generateAccessKey();
                                
                                console.log(`[WEBHOOK] Gerando chave de acesso para o usuário ${paymentData.user_id}`);
                                
                                // Inserir chave de acesso
                                await connection.execute(
                                    'INSERT INTO access_keys (user_id, code, type, status, purchase_date, expiry_date, is_lifetime) VALUES (?, ?, ?, ?, NOW(), ?, ?)',
                                    [
                                        paymentData.user_id, 
                                        accessKey, 
                                        'PREMIUM', 
                                        'active', 
                                        paymentData.model === 'VITALÍCIO' ? '2099-12-31' : 
                                            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                        paymentData.model === 'VITALÍCIO' ? 1 : 0
                                    ]
                                );
                                
                                console.log(`[WEBHOOK] Chave gerada para pagamento ${dbPaymentId}: ${accessKey}`);
                                
                                // Enviar email de confirmação se for presente
                                if (paymentData.gift_email) {
                                    try {
                                        const mailOptions = {
                                            from: process.env.EMAIL_USER,
                                            to: paymentData.gift_email,
                                            subject: '🎁 Presente TGS Launcher - Sua chave de ativação',
                                            html: `
                                                <h2>🎉 Presente Recebido!</h2>
                                                <p>Você recebeu uma assinatura do TGS Launcher como presente!</p>
                                                <p><strong>Plano:</strong> ${paymentData.model}</p>
                                                <p><strong>Chave de Ativação:</strong> ${accessKey}</p>
                                                <p>Para ativar sua assinatura, abra o TGS Launcher e insira esta chave.</p>
                                                <p>Atenciosamente,<br>Equipe TGS Launcher</p>
                                            `
                                        };
                                        
                                        await transporter.sendMail(mailOptions);
                                        console.log(`[WEBHOOK] Email de presente enviado para ${paymentData.gift_email}`);
                                    } catch (emailError) {
                                        console.error(`[WEBHOOK] Erro ao enviar email de presente:`, emailError);
                                    }
                                }
                            } else {
                                console.error(`[WEBHOOK] Pagamento ${dbPaymentId} não encontrado no banco de dados`);
                            }
                        }
                        
                    } catch (dbError) {
                        console.error(`[WEBHOOK] Erro ao processar pagamento ${dbPaymentId} no banco de dados:`, dbError);
                        // Não rejeitamos a requisição para evitar que o Mercado Pago tente novamente imediatamente
                    } finally {
                        if (connection) {
                            await connection.end();
                        }
                    }
                } else {
                    console.error(`[WEBHOOK] Pagamento ${paymentId} sem external_reference`);
                }
                
            } catch (mpError) {
                console.error(`[WEBHOOK] Erro ao buscar detalhes do pagamento ${paymentId}:`, mpError);
                // Se for um erro de pagamento não encontrado, responder 200 para não reenviar
                if (mpError.message && (mpError.message.includes('404') || mpError.message.includes('not_found'))) {
                    console.log(`[WEBHOOK] Pagamento ${paymentId} não encontrado - possivelmente teste`);
                    return; // Já respondemos OK
                }
                // Para outros erros, responder 200 para não causar problemas
                console.log(`[WEBHOOK] Erro processando pagamento ${paymentId}, mas respondendo OK`);
                return; // Já respondemos OK
            }
        } else {
            console.log(`[WEBHOOK] Notificação de tipo não suportado: ${data.type}`);
        }
        
    } catch (error) {
        console.error('[WEBHOOK] Erro inesperado ao processar webhook:', error);
        // Sempre responder com um status válido para evitar 503
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error');
        }
    }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../client')));


// --- end Mercado Pago --------------------------------------------------------

// Rota específica para reset-password
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/reset-password.html'));
});

// Rota específica para view-keys
app.get('/view-keys', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/view-keys.html'));
});

// Rota para abrir launcher
app.get('/open-launcher', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/open-launcher.html'));
});

// Rota principal para login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});
app.get('/api/verify-reset-token/:token', async (req, res) => {
    const { token } = req.params;
    
    let connection;
    try {
        connection = await getConnection();
        
        const [tokenRows] = await connection.execute(
            'SELECT user_id, expires_at, used FROM password_reset_tokens WHERE token = ?',
            [token]
        );
        
        if (tokenRows.length === 0) {
            return res.json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        const tokenData = tokenRows[0];
        
        // Verificar expiração e uso
        if (new Date() > new Date(tokenData.expires_at) || tokenData.used) {
            return res.json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido'
        });
        
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao verificar token'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para carregar mods
app.get('/api/mods', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Buscar todos os mods (simplificado - sem sistema de permissões complexo)
        const [mods] = await connection.execute(`
            SELECT * FROM mods 
            ORDER BY category, name
        `);

        // Buscar categorias
        const [categories] = await connection.execute(`
            SELECT DISTINCT category as name, 
                   LOWER(category) as id,
                   COUNT(*) as mod_count
            FROM mods 
            GROUP BY category
            ORDER BY category
        `);

        res.json({
            success: true,
            mods: mods.map(mod => ({
                ...mod,
                features: mod.features ? JSON.parse(mod.features) : [],
                can_download: true, // Admin pode baixar tudo
                can_use: true       // Admin pode usar tudo
            })),
            categories: categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                icon: getCategoryIcon(cat.name),
                count: cat.mod_count
            }))
        });

    } catch (error) {
        console.error('Erro ao carregar mods:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao carregar mods.' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Obter ícone para tipo de chave
function getCategoryIcon(category) {
    const icons = {
        'vehicles': 'fa-car',
        'weapons': 'fa-gun',
        'maps': 'fa-map',
        'scripts': 'fa-code',
        'graphics': 'fa-palette',
        'audio': 'fa-music',
        'clothing': 'fa-tshirt',
        'interfaces': 'fa-desktop'
    };
    return icons[category.toLowerCase()] || 'fa-folder';
}

// Obter classe CSS para tipo de chave
function getKeyTypeClass(type) {
    const classes = {
        'admin': 'key-admin',
        'creator': 'key-creator', 
        'standard': 'key-standard'
    };
    return classes[type] || 'key-default';
}

// Obter ícone para tipo de chave
function getKeyTypeIcon(type) {
    const icons = {
        'admin': 'fa-crown',
        'creator': 'fa-hammer',
        'standard': 'fa-star'
    };
    return icons[type] || 'fa-key';
}

// API para obter perfil do usuário
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Buscar informações do usuário
        const [userRows] = await connection.execute(
            'SELECT id, username, email, role, active, created_at, last_login, login_count FROM users WHERE id = ?',
            [req.user.userId]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        const user = userRows[0];

        res.json({
            success: true,
            username: user.username,
            email: user.email,
            role: user.role,
            active: user.active,
            created_at: user.created_at,
            last_login: user.last_login,
            login_count: user.login_count
        });

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao carregar perfil' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para gerenciar chaves do usuário
app.get('/api/user/keys', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Buscar todas as chaves do usuário
        const [keys] = await connection.execute(`
            SELECT ak.*, 
                   CASE 
                       WHEN ak.type IN ('admin', 'creator') THEN COUNT(*) OVER (PARTITION BY ak.type)
                       ELSE 0
                   END as same_type_count
            FROM access_keys ak 
            WHERE ak.user_id = ? AND ak.status = 'active'
            ORDER BY 
                CASE ak.type 
                    WHEN 'admin' THEN 1 
                    WHEN 'creator' THEN 2 
                    WHEN 'standard' THEN 3 
                    ELSE 4 
                END,
                ak.created_at DESC
        `, [req.user.userId]);

        // Contar chaves por tipo
        const keyStats = keys.reduce((acc, key) => {
            if (!acc[key.type]) {
                acc[key.type] = 0;
            }
            acc[key.type]++;
            return acc;
        }, {});

        // Verificar limites
        const limits = {
            admin: 1,
            creator: 1,
            standard: 999 // Ilimitado na prática
        };

        const canAdd = {
            admin: (keyStats.admin || 0) < limits.admin,
            creator: (keyStats.creator || 0) < limits.creator,
            standard: true // Sempre pode adicionar standard
        };

        res.json({
            success: true,
            keys: keys,
            stats: keyStats,
            limits: limits,
            canAdd: canAdd
        });

    } catch (error) {
        console.error('Erro ao carregar chaves:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao carregar chaves.' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para adicionar nova chave ao usuário
app.post('/api/user/keys', authenticateToken, async (req, res) => {
    const { keyCode } = req.body;
    
    if (!keyCode) {
        return res.status(400).json({ 
            success: false, 
            message: 'Código da chave é obrigatório.' 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        
        // Verificar se a chave existe e está disponível
        const [keyCheck] = await connection.execute(`
            SELECT ak.*, pt.name as permission_name 
            FROM access_keys ak
            LEFT JOIN permission_types pt ON ak.type = pt.name
            WHERE ak.code = ? AND (ak.user_id = 0 OR ak.user_id IS NULL) AND ak.status = 'active'
        `, [keyCode]);

        if (keyCheck.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Chave inválida, já está em uso ou está inativa.' 
            });
        }

        const key = keyCheck[0];
        const keyType = key.type;

        // Verificar limites por tipo
        if (keyType === 'admin' || keyType === 'creator') {
            const [existingKeys] = await connection.execute(
                'SELECT COUNT(*) as count FROM access_keys WHERE user_id = ? AND type = ? AND status = "active"',
                [req.user.userId, keyType]
            );

            if (existingKeys[0].count >= 1) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Você já possui uma chave ${keyType}. Limite: 1 por conta.` 
                });
            }
        }

        // Vincular chave ao usuário
        await connection.execute(
            'UPDATE access_keys SET user_id = ? WHERE code = ?',
            [req.user.userId, keyCode]
        );

        // Log da operação
        await connection.execute(
            'INSERT INTO auth_logs (user_id, action, success, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [req.user.userId, 'key_used', true, req.ip, req.get('User-Agent') || 'Unknown']
        );

        res.json({ 
            success: true, 
            message: `Chave ${keyType} adicionada com sucesso!`,
            key: {
                code: key.code,
                type: key.type,
                status: key.status,
                purchase_date: key.purchase_date,
                expiry_date: key.expiry_date,
                is_lifetime: key.is_lifetime
            }
        });

    } catch (error) {
        console.error('Erro ao adicionar chave:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao adicionar chave. Tente novamente.' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API para remover chave do usuário
app.delete('/api/user/keys/:keyCode', authenticateToken, async (req, res) => {
    const { keyCode } = req.params;
    
    let connection;
    try {
        connection = await getConnection();
        
        // Verificar se a chave pertence ao usuário
        const [keyCheck] = await connection.execute(
            'SELECT * FROM access_keys WHERE code = ? AND user_id = ?',
            [keyCode, req.user.userId]
        );

        if (keyCheck.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Chave não encontrada ou não pertence a você.' 
            });
        }

        // Desvincular chave (setar user_id como NULL)
        await connection.execute(
            'UPDATE access_keys SET user_id = NULL WHERE code = ? AND user_id = ?',
            [keyCode, req.user.userId]
        );

        // Log da operação
        await connection.execute(
            'INSERT INTO auth_logs (user_id, action, success, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)',
            [req.user.userId, 'key_removed', true, req.ip, req.get('User-Agent') || 'Unknown']
        );

        res.json({ 
            success: true, 
            message: 'Chave removida com sucesso!' 
        });

    } catch (error) {
        console.error('Erro ao remover chave:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao remover chave. Tente novamente.' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// API de criação de conta
app.post('/api/signup', async (req, res) => {
    const { username, email, password, accessKey } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nome de usuário, email e senha são obrigatórios.' 
        });
    }

    if (password.length < 6) {
        return res.status(400).json({ 
            success: false, 
            message: 'A senha deve ter pelo menos 6 caracteres.' 
        });
    }

    let connection;
    try {
        connection = await getConnection();
        
        // Verificar se usuário já existe
        const [existingUsers] = await connection.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nome de usuário ou email já está em uso.' 
            });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Inserir usuário
        const [result] = await connection.execute(
            'INSERT INTO users (username, email, password, role, active) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, 'user', true]
        );

        const userId = result.insertId;

        // Se fornecida chave de acesso, vincular ao usuário
        if (accessKey) {
            // Verificar se a chave existe e não está vinculada
            const [keyCheck] = await connection.execute(
                'SELECT id FROM access_keys WHERE code = ? AND user_id IS NULL AND status = "active"',
                [accessKey]
            );
            
            if (keyCheck.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Chave de acesso inválida ou já está em uso.' 
                });
            }
            
            await connection.execute(
                'UPDATE access_keys SET user_id = ? WHERE code = ?',
                [userId, accessKey]
            );
        }
        // Não gera chave automática - usuário deve adquirir separadamente

        // Enviar email de boas-vindas
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Bem-vindo ao TGS Launcher!',
            text: `Olá ${username},\n\nSua conta foi criada com sucesso!\n\nPara acessar o launcher TGS, você precisará de uma chave de acesso. Se você já possui uma chave, vincule-a na recuperação de conta. Caso contrário, visite nosso site para adquirir uma.\n\nAtenciosamente,\nEquipe TGS`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333;">Bem-vindo ao TGS Launcher!</h2>
                    <p>Olá <strong>${username}</strong>,</p>
                    <p>Sua conta foi criada com sucesso!</p>
                    <p>Para acessar o launcher TGS, você precisará de uma chave de acesso:</p>
                    <ul>
                        <li><strong>Se você já possui uma chave:</strong> Use a recuperação de conta para vinculá-la</li>
                        <li><strong>Se você não tem chave:</strong> Visite nosso site para adquirir uma</li>
                    </ul>
                    <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                        <strong>Próximos passos:</strong><br>
                        1. Adquira uma chave em nosso site<br>
                        2. Use a função "Esqueceu seu acesso?" para vincular a chave<br>
                        3. Faça login com suas credenciais
                    </p>
                    <p>Atenciosamente,<br>Equipe TGS</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ 
            success: true, 
            message: 'Conta criada com sucesso! Verifique seu email para mais informações.' 
        });

    } catch (error) {
        console.error('Erro na criação de conta:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao criar conta. Tente novamente.' 
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Profile endpoint
app.get('/api/auth/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        console.log('🔧 Profile endpoint chamado com token:', token ? 'present' : 'missing');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação ausente'
            });
        }

        // Verificar token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                console.log('🔧 Token verification failed:', err.message);
                return res.status(401).json({ 
                    success: false, 
                    message: 'Token inválido ou expirado.' 
                });
            }

            console.log('🔧 Token decoded:', decoded);

            // Obter dados completos do usuário
            const connection = await getConnection();
            try {
                const [rows] = await connection.execute(
                    'SELECT id, username, role, active, created_at, last_login, login_count, email FROM users WHERE id = ?',
                    [decoded.userId]
                );

                console.log('🔧 User rows from DB:', rows);

                if (rows.length === 0) {
                    return res.status(401).json({
                        success: false,
                        message: 'Usuário não encontrado'
                    });
                }

                const user = rows[0];
                console.log('🔧 User data:', { id: user.id, username: user.username, role: user.role, active: user.active });
                
                // Buscar permissões do usuário (keys ativas)
                const [keyRows] = await connection.execute(
                    'SELECT type FROM access_keys WHERE user_id = ? AND status = "active"',
                    [user.id]
                );
                
                const permissions = keyRows.map(key => key.type);
                console.log('🔧 User permissions:', permissions);
                
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        active: user.active,
                        email: user.email,
                        permissions: permissions,
                        created_at: user.created_at,
                        last_login: user.last_login,
                        login_count: user.login_count
                    }
                });
            } finally {
                await connection.end();
            }
        });
    } catch (error) {
        console.error('Erro no perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter perfil do usuário'
        });
    }
});

// Importar middleware de autenticação
const authMiddleware = require('./middleware/auth');

// Importar rotas admin
const adminRoutes = require('./routes/admin');
console.log('🔧 Rotas admin carregadas:', adminRoutes ? '✅' : '❌');

// Usar rotas admin com middleware de autenticação
app.use('/api/admin', (req, res, next) => {
    console.log('🔧 Requisição para /api/admin:', req.method, req.url);
    next();
}, authMiddleware, adminRoutes);
console.log('🔧 Rotas /api/admin registradas');

// Servir a aplicação cliente
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/login.html'));
});

// Importar rotas de mods
const modsRoutes = require('./routes/mods');

// Registrar rotas de mods com autenticação
app.use('/api/mods', authenticateToken, modsRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor TGS rodando na porta ${PORT}`);
    console.log(`📧 Email configurado: ${process.env.EMAIL_USER ? 'Sim' : 'Não'}`);
    console.log(`🗄️  Database: ${dbConfig.host}:${dbConfig.database}`);
});
