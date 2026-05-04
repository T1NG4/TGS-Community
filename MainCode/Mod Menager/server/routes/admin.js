const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const mysql = require('mysql2/promise');

const router = express.Router();

console.log('🔧 Rotas admin inicializadas');

// Middleware para validar token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de autenticação ausente' 
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('🔧 Token verification failed:', err.message);
            return res.status(401).json({ 
                success: false, 
                message: 'Token inválido ou expirado.' 
            });
        }

        req.user = decoded;
        next();
    });
}

// Configuração do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tgs_launcher',
    charset: 'utf8mb4'
};

// Função para obter conexão
async function getConnection() {
    return await mysql.createConnection(dbConfig);
}

// Rate limiting para admin routes
const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 50, // máximo 50 requisições por IP
    message: { success: false, message: 'Muitas requisições administrativas. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware para verificar se é admin
const verifyAdmin = async (req, res, next) => {
    let connection;
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de autenticação ausente'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Obter dados completos do usuário
        connection = await getConnection();
        const [userRows] = await connection.execute(`
            SELECT id, username, role, active 
            FROM users 
            WHERE id = ?
        `, [decoded.userId]);
        
        if (userRows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        const user = userRows[0];
        
        // Verificar se é admin
        const [keyRows] = await connection.execute(`
            SELECT type FROM access_keys 
            WHERE user_id = ? AND type = 'admin' AND status = 'active'
        `, [user.id]);
        
        console.log(`🔧 Verificando admin para user ${user.id}: keys encontradas = ${keyRows.length}`);
        console.log('🔧 Keys:', keyRows);
        
        if (keyRows.length === 0) {
            // Verificar se o usuário tem role admin como fallback
            if (user.role === 'admin') {
                console.log('🔧 Usuário tem role admin, permitindo acesso');
                req.user = user;
                next();
                return;
            }
            
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: privilégios de administrador necessários'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Erro na verificação de admin:', error);
        return res.status(401).json({
            success: false,
            message: 'Token inválido ou expirado'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

// Obter todos os usuários
router.get('/users', (req, res, next) => {
    console.log('🔧 Rota /users chamada diretamente');
    next();
}, verifyAdmin, adminLimiter, async (req, res) => {
    console.log('🔧 Endpoint /api/admin/users chamado');
    let connection;
    try {
        connection = await getConnection();
        
        const [users] = await connection.execute(`
            SELECT id, username, role, active, created_at, last_login, login_count, email
            FROM users 
            WHERE id != 1
            ORDER BY username
        `);
        
        // Formatar dados dos usuários
        const formattedUsers = await Promise.all(users.map(async (user) => {
            const [keys] = await connection.execute(`
                SELECT code, type, status, purchase_date, expiry_date, is_lifetime, platform_fee
                FROM access_keys 
                WHERE user_id = ? AND status = 'active'
            `, [user.id]);
            
            const permissions = keys.map(key => key.type);
            const status = user.active ? 'active' : 'banned';
            
            // Formatar informações das keys para exibição
            const keyDetails = keys.map(key => ({
                type: key.type,
                code: key.code,
                platformFee: key.platform_fee || 10.00,
                expiryDate: key.expiry_date,
                isLifetime: key.is_lifetime
            }));
            
            return {
                id: user.id,
                username: user.username,
                permissions: permissions,
                status: status,
                keyDetails: keyDetails
            };
        }));

        res.json({
            success: true,
            users: formattedUsers
        });
    } catch (error) {
        console.error('Erro ao obter usuários:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter lista de usuários'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Gerar key creator
router.post('/generate-creator-key', verifyAdmin, adminLimiter, async (req, res) => {
    console.log('🔧 Endpoint /api/admin/generate-creator-key chamado');
    let connection;
    try {
        const { userId, username, platformFee, expiryDate } = req.body;

        if (!userId || !username) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário e nome são obrigatórios'
            });
        }

        // Validar plataforma fee (opcional, default 10%)
        const fee = platformFee !== undefined ? parseFloat(platformFee) : 10.00;
        if (fee < 0 || fee > 100) {
            return res.status(400).json({
                success: false,
                message: 'Taxa da plataforma deve estar entre 0% e 100%'
            });
        }

        // Proteção: não permitir modificar o dono (ID 1)
        if (parseInt(userId) === 1) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: não é permitido modificar a conta do dono'
            });
        }

        // Gerar key única
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        const generatedKey = `TGS-CREATOR-${timestamp}-${random}`;

        connection = await getConnection();
        
        // Inserir key no banco de dados com taxa e validade personalizadas
        await connection.execute(`
            INSERT INTO access_keys (user_id, code, type, status, purchase_date, platform_fee, expiry_date, is_lifetime)
            VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
        `, [
            parseInt(userId), 
            generatedKey, 
            'creator', 
            new Date(), 
            fee,
            expiryDate || null,
            !expiryDate // Se não tem expiry_date, é lifetime
        ]);

        console.log(`[ADMIN] Key creator gerada: ${generatedKey} para usuário ${username} (ID: ${userId}) com taxa ${fee}% por admin ${req.user.username}`);

        res.json({
            success: true,
            key: generatedKey,
            platformFee: fee,
            expiryDate: expiryDate || null,
            message: `Key "creator" gerada com sucesso${expiryDate ? ` (expira em ${expiryDate})` : ' (vitalícia)'}`
        });
    } catch (error) {
        console.error('Erro ao gerar key creator:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao gerar key "creator"'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Adicionar permissão ao usuário
router.post('/add-permission', verifyAdmin, adminLimiter, async (req, res) => {
    try {
        const { userId, permission } = req.body;

        if (!userId || !permission) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário e permissão são obrigatórios'
            });
        }

        // Proteção: não permitir modificar o dono (ID 1)
        if (parseInt(userId) === 1) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: não é permitido modificar a conta do dono'
            });
        }

        // Verificar se permissão é válida
        const validPermissions = ['admin', 'creator', 'standard'];
        if (!validPermissions.includes(permission)) {
            return res.status(400).json({
                success: false,
                message: 'Permissão inválida'
            });
        }

        // Gerar key para a permissão
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9).toUpperCase();
        const generatedKey = `TGS-${permission.toUpperCase()}-${timestamp}-${random}`;

        // Inserir key no banco de dados
        await global.database.insertAccessKey({
            key: generatedKey,
            type: permission,
            userId: parseInt(userId),
            generatedBy: req.user.userId,
            createdAt: new Date()
        });

        console.log(`[ADMIN] Permissão ${permission} adicionada para usuário ID: ${userId} por admin ${req.user.username}`);

        res.json({
            success: true,
            message: `Permissão "${permission}" adicionada com sucesso`
        });
    } catch (error) {
        console.error('Erro ao adicionar permissão:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao adicionar permissão'
        });
    }
});

// Remover permissão de creator
router.post('/remove-creator-permission', verifyAdmin, adminLimiter, async (req, res) => {
    console.log('🔧 Endpoint /api/admin/remove-creator-permission chamado');
    let connection;
    try {
        const { userId, username } = req.body;

        if (!userId || !username) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário e nome são obrigatórios'
            });
        }

        // Proteção: não permitir modificar o dono (ID 1)
        if (parseInt(userId) === 1) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: não é permitido modificar a conta do dono'
            });
        }

        connection = await getConnection();
        
        // Remover todas as keys creator do usuário
        const [result] = await connection.execute(`
            DELETE FROM access_keys 
            WHERE user_id = ? AND type = 'creator'
        `, [parseInt(userId)]);

        console.log(`[ADMIN] Permissão creator removida do usuário ${username} (ID: ${userId}) por admin ${req.user.username}`);

        res.json({
            success: true,
            message: 'Permissão "creator" removida com sucesso'
        });
    } catch (error) {
        console.error('Erro ao remover permissão creator:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao remover permissão "creator"'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Banir usuário
router.post('/ban-user', verifyAdmin, adminLimiter, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário é obrigatório'
            });
        }

        // Proteção: não permitir modificar o dono (ID 1)
        if (parseInt(userId) === 1) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: não é permitido modificar a conta do dono'
            });
        }

        // Não permitir banir a si mesmo
        if (parseInt(userId) === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: 'Você não pode banir a si mesmo'
            });
        }

        // Atualizar status do usuário para banned
        if (global.database && global.database.updateUserStatus) {
            await global.database.updateUserStatus(parseInt(userId), 'banned');
            await global.database.revokeUserKeys(parseInt(userId));
        } else {
            // Fallback direto com MySQL
            const connection = await getConnection();
            await connection.execute(`
                UPDATE users 
                SET active = 0 
                WHERE id = ?
            `, [parseInt(userId)]);
            
            await connection.execute(`
                UPDATE access_keys 
                SET status = 'revoked' 
                WHERE user_id = ?
            `, [parseInt(userId)]);
            
            await connection.end();
        }

        console.log(`[ADMIN] Usuário ID: ${userId} banido por admin ${req.user.username}`);

        res.json({
            success: true,
            message: 'Usuário banido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao banir usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao banir usuário'
        });
    }
});

// Desbanir usuário
router.post('/unban-user', verifyAdmin, adminLimiter, async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'ID do usuário é obrigatório'
            });
        }

        // Proteção: não permitir modificar o dono (ID 1)
        if (parseInt(userId) === 1) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: não é permitido modificar a conta do dono'
            });
        }

        // Atualizar status do usuário para active
        if (global.database && global.database.updateUserStatus) {
            await global.database.updateUserStatus(parseInt(userId), 'active');
        } else {
            // Fallback direto com MySQL
            const connection = await getConnection();
            await connection.execute(`
                UPDATE users 
                SET active = 1 
                WHERE id = ?
            `, [parseInt(userId)]);
            
            await connection.end();
        }

        console.log(`[ADMIN] Usuário ID: ${userId} desbanido por admin ${req.user.username}`);

        res.json({
            success: true,
            message: 'Usuário desbanido com sucesso'
        });
    } catch (error) {
        console.error('Erro ao desbanir usuário:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao desbanir usuário'
        });
    }
});

// Endpoint para creators obterem informações da própria key
router.get('/creator-key-info', authenticateToken, async (req, res) => {
    console.log('🔧 Endpoint /api/admin/creator-key-info chamado');
    let connection;
    try {
        const userId = req.user.userId;
        console.log('🔧 userId no endpoint:', userId);
        console.log('🔧 req.user completo:', req.user);
        
        connection = await getConnection();
        
        // Buscar informações da key creator do usuário incluindo a taxa
        const [keyRows] = await connection.execute(`
            SELECT code, purchase_date, expiry_date, is_lifetime, platform_fee
            FROM access_keys 
            WHERE user_id = ? AND type = 'creator' AND status = 'active'
        `, [userId]);
        
        if (keyRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhuma key creator encontrada'
            });
        }
        
        const keyInfo = keyRows[0];
        
        // Debug completo da chave
        console.log('🔧 Dados completos da chave:', JSON.stringify(keyInfo, null, 2));
        
        // Usar a taxa configurada na chave creator
        let platformFee = parseFloat(keyInfo.platform_fee) || 10.00;
        
        // Admin (ID 1) não tem taxa
        if (userId === 1) {
            platformFee = 0;
        }
        
        console.log('🔧 Taxa da chave para usuário', userId, ':', platformFee, '%');
        console.log('🔧 platform_fee original:', keyInfo.platform_fee);
        console.log('🔧 parseFloat result:', parseFloat(keyInfo.platform_fee));
        console.log('🔧 Key encontrada:', keyInfo.code);
        if (userId === 1) {
            console.log('🔧 Admin (ID 1) - Taxa definida como 0');
        }
        
        res.json({
            success: true,
            keyInfo: {
                platformFee: platformFee,
                expiryDate: keyInfo.expiry_date,
                isLifetime: keyInfo.is_lifetime,
                purchaseDate: keyInfo.purchase_date,
                code: keyInfo.code
            }
        });
        
    } catch (error) {
        console.error('Erro ao obter informações da key creator:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter informações da key creator'
        });
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

module.exports = router;
