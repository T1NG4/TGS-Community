const express = require('express');
const router = express.Router();
const mysql2 = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tgs_launcher',
    charset: 'utf8mb4'
};

// Função para conectar ao banco de dados
async function getConnection() {
    try {
        const connection = await mysql2.createConnection(dbConfig);
        return connection;
    } catch (error) {
        console.error('Erro ao conectar ao banco de dados:', error);
        throw error;
    }
}

// GET /api/mods/all - Todos os mods (para Creator Menu)
router.get('/all', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Parâmetros de filtro
        const { category, enabled, search } = req.query;
        
        let query = `
            SELECT 
                m.*,
                u.username as creator_name,
                CASE WHEN m.status = 'published' AND m.is_active = 1 THEN 1 ELSE 0 END as enabled
            FROM mods m
            LEFT JOIN users u ON m.creator_id = u.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filtro por categoria
        if (category && category !== 'all') {
            query += ' AND m.category = ?';
            params.push(category);
        }
        
        // Filtro por enabled/disabled
        if (enabled === 'true') {
            query += ' AND m.status = ? AND m.is_active = ?';
            params.push('published', 1);
        } else if (enabled === 'false') {
            query += ' AND (m.status = ? OR m.is_active = ?)';
            params.push('draft', 0);
        }
        
        // Filtro por busca
        if (search) {
            query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        // Ordenação
        query += ' ORDER BY m.created_at DESC';
        
        const [rows] = await connection.execute(query, params);
        
        // Formatar dados para compatibilidade com frontend
        const mods = rows.map(mod => ({
            id: mod.mod_id,
            name: mod.name,
            description: mod.description,
            category: mod.category,
            version: mod.version,
            size: mod.size,
            enabled: mod.enabled === 1,
            status: mod.status,
            features: mod.features ? JSON.parse(mod.features) : [],
            image: mod.image_url || `../midias/products/${mod.category}/${mod.name}/${mod.name}_1.png`,
            icon: mod.icon || '',
            creatorId: mod.creator_id,
            creatorName: mod.creator_name || 'Unknown',
            price: mod.price ? mod.price.toString() : '0.00',
            downloads: mod.download_count || 0
        }));
        
        res.json({
            success: true,
            mods,
            total: mods.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar todos os mods:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar mods'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// GET /api/mods - Mods publicados (para catálogo geral)
router.get('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        // Parâmetros de filtro
        const { category, enabled, search } = req.query;
        
        let query = `
            SELECT 
                m.*,
                u.username as creator_name,
                1 as enabled
            FROM mods m
            LEFT JOIN users u ON m.creator_id = u.id
            WHERE m.status = 'published' AND m.is_active = 1
        `;
        
        const params = [];
        
        // Filtro por categoria
        if (category && category !== 'all') {
            query += ' AND m.category = ?';
            params.push(category);
        }
        
        // Filtro por busca
        if (search) {
            query += ' AND (m.name LIKE ? OR m.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        // Ordenação
        query += ' ORDER BY m.download_count DESC, m.created_at DESC';
        
        const [rows] = await connection.execute(query, params);
        
        // Formatar dados para compatibilidade com frontend
        const mods = rows.map(mod => ({
            id: mod.mod_id,
            name: mod.name,
            description: mod.description,
            category: mod.category,
            version: mod.version,
            size: mod.size,
            enabled: true,
            status: mod.status,
            features: mod.features ? JSON.parse(mod.features) : [],
            image: mod.image_url || `../midias/products/${mod.category}/${mod.name}/${mod.name}_1.png`,
            icon: mod.icon || '',
            creatorId: mod.creator_id,
            creatorName: mod.creator_name || 'Unknown',
            price: mod.price ? mod.price.toString() : '0.00',
            downloads: mod.download_count || 0
        }));
        
        res.json({
            success: true,
            mods,
            total: mods.length
        });
        
    } catch (error) {
        console.error('Erro ao buscar mods publicados:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar mods'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// Get mod by ID
router.get('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        const { id } = req.params;
        
        // Mods padrão do sistema
        const mods = [
            {
                id: 'mod-01',
                name: 'TGS M4 F82',
                description: 'Veículo esportivo BMW M4 F82 com modificações personalizadas',
                category: 'vehicles',
                version: '1.0.0',
                size: '45.2 MB',
                enabled: false,
                status: 'published',
                features: ['Motor V8 TwinTurbo', 'Suspensão esportiva', 'Body kit carbono', 'Rodas 20"'],
                image: '../midias/products/veiculos/TGS M4 F82/m4f82_1.png',
                icon: '🚗',
                creatorId: 1,
                creatorName: 'TGS Admin',
                price: '25.00',
                downloads: 145
            },
            {
                id: 'mod-02', 
                name: 'TGS Weapon Pack',
                description: 'Pacote de armas militares com alta qualidade',
                category: 'weapons',
                version: '2.1.0',
                size: '12.8 MB',
                enabled: false,
                status: 'published',
                features: ['AK-47 Custom', 'Desert Eagle Gold', 'Sniper Rifle', 'Tactical Gear'],
                image: '../midias/products/weapons/weapon_pack_1.png',
                icon: '🔫',
                creatorId: 1,
                creatorName: 'TGS Admin',
                price: '15.00',
                downloads: 89
            },
            {
                id: 'mod-03',
                name: 'TGS Graphics Ultra',
                description: 'Pacote gráfico 4K com texturas realistas',
                category: 'graphics',
                version: '3.0.0',
                size: '128.5 MB',
                enabled: false,
                status: 'draft',
                features: ['Texturas 4K', 'Lighting melhorado', 'Reflections realistas', 'Weather system'],
                image: '../midias/products/graphics/graphics_ultra_1.png',
                icon: '🎨',
                creatorId: 1,
                creatorName: 'TGS Admin',
                price: '35.00',
                downloads: 234
            },
            {
                id: 'mod-04',
                name: 'TGS Vehicle Pack',
                description: 'Pacote exclusivo de veículos de luxo',
                category: 'vehicles',
                version: '1.5.0',
                size: '256.3 MB',
                enabled: false,
                status: 'draft',
                features: ['20 veículos exclusivos', 'Customização completa', 'Sons realistas', 'Performance otimizada'],
                image: '../midias/products/veiculos/vehicle_pack_1.png',
                icon: '🚙',
                creatorId: 2,
                creatorName: 'Creator Test',
                price: '45.00',
                downloads: 12
            }
        ];
        
        const mod = mods.find(m => m.id === id);

        if (!mod) {
            return res.status(404).json({
                success: false,
                message: 'Mod não encontrado'
            });
        }

        res.json({
            success: true,
            mod
        });

    } catch (error) {
        console.error('Get mod error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao carregar mod'
        });
    }
});

// Toggle mod status (enable/disable)
router.post('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Status do mod deve ser booleano'
            });
        }

        // Em produção, aqui você salvaria o estado do mod
        // Por enquanto, apenas retorna sucesso
        console.log(`Mod ${id} ${enabled ? 'enabled' : 'disabled'}`);

        res.json({
            success: true,
            message: `Mod ${id} ${enabled ? 'ativado' : 'desativado'} com sucesso`
        });

    } catch (error) {
        console.error('Toggle mod error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar mod'
        });
    }
});

// Toggle mod publication status
router.patch('/:id/publish', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'published' ou 'draft'

        if (!['published', 'draft'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status deve ser "published" ou "draft"'
            });
        }

        // Em produção, aqui você atualizaria o status no banco de dados
        // Por enquanto, apenas retorna sucesso
        console.log(`Mod ${id} status changed to ${status}`);

        res.json({
            success: true,
            message: `Mod ${id} ${status === 'published' ? 'publicado' : 'despublicado'} com sucesso`,
            status: status
        });

    } catch (error) {
        console.error('Toggle mod publication error:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do mod'
        });
    }
});

// POST /api/mods - Criar novo mod
router.post('/', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const { 
            name, 
            description, 
            category, 
            version = '1.0.0',
            size = '0 MB',
            price = 0,
            free = true,
            status = 'draft',
            features = [],
            images = [],
            icon = '📦',
            creatorId 
        } = req.body;
        
        // Validação básica
        if (!name || !description || !category || !creatorId) {
            return res.status(400).json({
                success: false,
                message: 'Campos obrigatórios: name, description, category, creatorId'
            });
        }
        
        // Gerar mod_id único
        const [modCount] = await connection.execute('SELECT COUNT(*) as count FROM mods');
        const nextId = modCount[0].count + 1;
        const modId = `mod-${String(nextId).padStart(3, '0')}`;
        
        // Inserir no banco de dados
        const query = `
            INSERT INTO mods (
                mod_id, name, description, category, version, size, 
                price, free, status, features, images, icon, creator_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(query, [
            modId, name, description, category, version, size,
            price, free, status, 
            JSON.stringify(features), JSON.stringify(images), icon, creatorId
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Mod criado com sucesso',
            mod: {
                id: modId,
                name,
                description,
                category,
                version,
                size,
                price: price.toString(),
                free,
                status,
                features,
                images,
                icon,
                creatorId
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar mod:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar mod'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /api/mods/:id - Atualizar mod (com controle de permissão)
router.put('/:id', async (req, res) => {
    console.log('🔧 PUT /api/mods/:id chamado com ID:', req.params.id);
    console.log('🔧 Body recebido:', req.body);
    
    let connection;
    try {
        connection = await getConnection();
        
        const { id } = req.params;
        const { 
            name, 
            description, 
            category, 
            version,
            size,
            price,
            free,
            status,
            features,
            images,
            icon,
            creatorId // ID do usuário que está tentando editar
        } = req.body;
        
        // Verificar se o mod existe e pertence ao creator
        console.log('🔍 Verificando mod no banco com mod_id:', id);
        const [modRows] = await connection.execute(
            'SELECT creator_id FROM mods WHERE mod_id = ?',
            [id]
        );
        
        console.log('🔍 Mod encontrado no banco:', modRows.length > 0 ? 'SIM' : 'NÃO');
        
        if (modRows.length === 0) {
            console.log('❌ Mod não encontrado no banco');
            return res.status(404).json({
                success: false,
                message: 'Mod não encontrado'
            });
        }
        
        const mod = modRows[0];
        console.log('🔍 Creator do mod:', mod.creator_id, 'Creator do usuário:', creatorId);
        
        // Verificar permissão (só o creator pode editar, mas admin pode editar qualquer mod)
        if (mod.creator_id !== creatorId && mod.creator_id !== null) {
            console.log('❌ Permissão negada: creator_id não bate');
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: você só pode editar seus próprios mods'
            });
        }
        
        console.log('✅ Permissão concedida para edição');
        
        // Atualizar no banco de dados
        console.log('🔧 Atualizando mod no banco...');
        
        // Debug para identificar campos undefined
        const params = [
            name || '', 
            description || '', 
            category || '', 
            version || '1.0.0', 
            size || '0 MB',
            price || '0.00', 
            free || false, 
            status || 'draft', 
            JSON.stringify(features || []), 
            JSON.stringify(images || []), 
            icon || '', 
            creatorId,
            status || 'draft', // Para o CASE do is_active
            id
        ];
        
        console.log('🔍 Parâmetros SQL:', params.map((p, i) => `${i}: ${typeof p} = ${p}`));
        
        const query = `
            UPDATE mods SET 
                name = ?, description = ?, category = ?, version = ?, size = ?,
                price = ?, free = ?, status = ?, features = ?, images = ?, icon = ?,
                creator_id = COALESCE(creator_id, ?),
                is_active = CASE WHEN ? = 'published' THEN 1 ELSE is_active END,
                updated_at = CURRENT_TIMESTAMP
            WHERE mod_id = ?
        `;
        
        await connection.execute(query, params);
        
        res.json({
            success: true,
            message: 'Mod atualizado com sucesso',
            mod: {
                id,
                name,
                description,
                category,
                version,
                size,
                price: price.toString(),
                free,
                status,
                features,
                images,
                icon,
                creatorId
            }
        });
        
        console.log('✅ Mod atualizado com sucesso:', { id, status });
        
    } catch (error) {
        console.error('Erro ao atualizar mod:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar mod'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// DELETE /api/mods/:id - Excluir mod (com controle de permissão)
router.delete('/:id', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const { id } = req.params;
        const { creatorId } = req.query; // ID do usuário que está tentando excluir
        
        // Verificar se o mod existe e pertence ao creator
        const [modRows] = await connection.execute(
            'SELECT creator_id FROM mods WHERE mod_id = ?',
            [id]
        );
        
        if (modRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mod não encontrado'
            });
        }
        
        const mod = modRows[0];
        
        // Verificar permissão (só o creator pode excluir)
        if (mod.creator_id !== parseInt(creatorId)) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: você só pode excluir seus próprios mods'
            });
        }
        
        // Excluir do banco de dados
        await connection.execute('DELETE FROM mods WHERE mod_id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Mod excluído com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao excluir mod:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir mod'
        });
    } finally {
        if (connection) await connection.end();
    }
});

// PATCH /api/mods/:id/publish - Alterar status de publicação
router.patch('/:id/publish', async (req, res) => {
    let connection;
    try {
        connection = await getConnection();
        
        const { id } = req.params;
        const { status, creatorId } = req.body; // 'published' ou 'draft'
        
        if (!['published', 'draft'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status deve ser "published" ou "draft"'
            });
        }
        
        // Verificar se o mod existe e pertence ao creator
        const [modRows] = await connection.execute(
            'SELECT creator_id FROM mods WHERE mod_id = ?',
            [id]
        );
        
        if (modRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Mod não encontrado'
            });
        }
        
        const mod = modRows[0];
        
        // Verificar permissão (só o creator pode alterar status)
        if (mod.creator_id !== creatorId) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado: você só pode alterar status de seus próprios mods'
            });
        }
        
        // Atualizar status
        await connection.execute(
            'UPDATE mods SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE mod_id = ?',
            [status, id]
        );
        
        res.json({
            success: true,
            message: `Mod ${id} ${status === 'published' ? 'publicado' : 'despublicado'} com sucesso`,
            status: status
        });
        
    } catch (error) {
        console.error('Erro ao alterar status do mod:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar status do mod'
        });
    } finally {
        if (connection) await connection.end();
    }
});

module.exports = router;
