-- =====================================================
-- TGS LAUNCHER DATABASE - EXECUTE ESTE ARQUIVO NO HEIDISQL
-- HeidiSQL Compatible - MySQL 8.0+
-- =====================================================

-- 🎯 INSTRUÇÕES:
-- 1. Abra HeidiSQL
-- 2. Conecte-se ao MySQL
-- 3. File → Open SQL File → selecione este arquivo
-- 4. Execute (F9)
-- 5. Pronto! Sistema criado ✅

-- 🔑 DADOS DE ACESSO APÓS INSTALAÇÃO:
-- Username: admin
-- Password: admin123
-- Email: tigas300300@gmail.com

-- 🎮 CHAVES DE TESTE DISPONÍVEIS:
-- Admin: TGS-2024-ADMIN-002
-- Admin+Creator: TGS-2024-ADMIN-CREATOR
-- Creator: TGS-2024-CREATOR-001
-- Standard: TGS-2024-STANDARD-001
-- Standard (expira 30d): TGS-2024-STANDARD-EXP1

-- 📊 TIPOS DE CHAVES (APENAS 3):
-- 🏆 Admin (1 por conta) - Acesso total
-- 🔨 Creator (1 por conta) - Acesso de criador
-- ⭐ Standard (ilimitado) - Acesso padrão

-- Criar database se não existir
CREATE DATABASE IF NOT EXISTS tgs_launcher 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Usar o database
USE tgs_launcher;

-- =====================================================
-- CREATE TABLES
-- =====================================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT 'Nome de usuário único',
    password VARCHAR(255) NOT NULL COMMENT 'Senha hash (bcrypt)',
    role ENUM('admin', 'user', 'moderator') DEFAULT 'user' COMMENT 'Função do usuário',
    active BOOLEAN DEFAULT TRUE COMMENT 'Usuário ativo/inativo',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT 'Email único obrigatório',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    last_login TIMESTAMP NULL COMMENT 'Último login',
    login_count INT DEFAULT 0 COMMENT 'Contador de logins',
    notes TEXT NULL COMMENT 'Observações administrativas',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (active)
) ENGINE=InnoDB;

-- Tabela de chaves de acesso
CREATE TABLE IF NOT EXISTS access_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL COMMENT 'ID do usuário proprietário',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Código da chave (ex: TGS-2024-STANDARD-001)',
    type ENUM('admin', 'creator', 'standard') NOT NULL COMMENT 'Tipo da chave',
    status ENUM('active', 'expired', 'suspended', 'revoked') DEFAULT 'active' COMMENT 'Status da chave',
    purchase_date DATE NULL COMMENT 'Data da compra',
    expiry_date DATE NULL COMMENT 'Data de expiração (NULL = lifetime)',
    platform_fee DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Taxa da plataforma (%) para creator keys',
    is_lifetime BOOLEAN DEFAULT FALSE COMMENT 'Chave vitalícia?',
    max_devices INT DEFAULT 3 COMMENT 'Máximo de dispositivos simultâneos',
    current_devices INT DEFAULT 0 COMMENT 'Dispositivos atualmente em uso',
    notes TEXT NULL COMMENT 'Notas da chave',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_code (code),
    INDEX idx_type (type),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- Tabela de tipos de permissões
CREATE TABLE IF NOT EXISTS permission_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(20) UNIQUE NOT NULL COMMENT 'admin, creator, standard, etc',
    description TEXT NOT NULL COMMENT 'Descrição do tipo',
    display_order INT DEFAULT 0 COMMENT 'Ordem de exibição',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de recursos
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL COMMENT 'maps, weapons, vehicles, etc',
    description TEXT NOT NULL COMMENT 'Descrição do recurso',
    category VARCHAR(20) DEFAULT 'general' COMMENT 'Categoria do recurso',
    display_order INT DEFAULT 0 COMMENT 'Ordem de exibição',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Tabela de permissões
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_type_id INT NOT NULL,
    resource_id INT NOT NULL,
    access_level ENUM('none', 'basic', 'standard', 'all', 'specific') NOT NULL DEFAULT 'none',
    specific_items TEXT NULL COMMENT 'Items específicos (JSON array) quando access_level = specific',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (permission_type_id) REFERENCES permission_types(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    UNIQUE KEY unique_permission (permission_type_id, resource_id),
    INDEX idx_type_resource (permission_type_id, resource_id)
) ENGINE=InnoDB;

-- Tabela de dispositivos
CREATE TABLE IF NOT EXISTS user_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id VARCHAR(100) NOT NULL COMMENT 'Identificador único do dispositivo',
    device_name VARCHAR(100) NULL COMMENT 'Nome do dispositivo',
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Última atividade',
    ip_address VARCHAR(45) NULL COMMENT 'IP do dispositivo',
    user_agent TEXT NULL COMMENT 'User agent do navegador/cliente',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Dispositivo ativo?',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_device (user_id, device_id),
    INDEX idx_user_active (user_id, is_active)
) ENGINE=InnoDB;

-- Tabela de tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID do usuário',
    token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Token de recuperação',
    email VARCHAR(100) NOT NULL COMMENT 'Email para onde foi enviado',
    expires_at TIMESTAMP NOT NULL COMMENT 'Data de expiração',
    used BOOLEAN DEFAULT FALSE COMMENT 'Token já utilizado?',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used)
) ENGINE=InnoDB;

-- Tabela de tokens de visualização de chaves
CREATE TABLE IF NOT EXISTS key_view_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID do usuário',
    token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Token de visualização',
    expires_at TIMESTAMP NOT NULL COMMENT 'Data de expiração',
    used BOOLEAN DEFAULT FALSE COMMENT 'Token já utilizado?',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_used (used)
) ENGINE=InnoDB;

-- Tabela de logs de autenticação
CREATE TABLE IF NOT EXISTS auth_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    access_key_code VARCHAR(50) NULL,
    action ENUM('login', 'logout', 'failed_login', 'key_used', 'password_change', 'key_removed') NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT NULL COMMENT 'Mensagem de erro (se houver)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_action (user_id, action),
    INDEX idx_created_at (created_at),
    INDEX idx_success (success)
) ENGINE=InnoDB;

-- Tabela de mods
CREATE TABLE IF NOT EXISTS mods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mod_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'ID único do mod (ex: mod-001)',
    name VARCHAR(100) NOT NULL COMMENT 'Nome do mod',
    description TEXT NOT NULL COMMENT 'Descrição detalhada',
    category VARCHAR(30) NOT NULL COMMENT 'Categoria do mod',
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    size VARCHAR(20) NOT NULL DEFAULT '0 MB',
    download_url VARCHAR(500) NULL COMMENT 'URL para download',
    image_url VARCHAR(500) NULL COMMENT 'URL da imagem/preview',
    icon VARCHAR(10) NULL COMMENT 'Emoji/ícone do mod',
    features JSON NULL COMMENT 'Features do mod (array)',
    requirements JSON NULL COMMENT 'Requisitos para usar o mod',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Mod disponível?',
    is_premium BOOLEAN DEFAULT FALSE COMMENT 'Mod premium?',
    download_count INT DEFAULT 0 COMMENT 'Contador de downloads',
    rating DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Avaliação média (0-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_premium (is_premium)
) ENGINE=InnoDB;

-- =====================================================
-- ATUALIZAÇÕES DA TABELA ACCESS_KEYS
-- =====================================================

-- Adicionar campo platform_fee para taxas personalizadas por creator
ALTER TABLE access_keys 
ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(5,2) DEFAULT 10.00 COMMENT 'Taxa da plataforma (%) para creator keys';

-- Garantir que todas as keys existentes tenham platform_fee definido
UPDATE access_keys 
SET platform_fee = 10.00 
WHERE platform_fee IS NULL AND type = 'creator';

-- Atualizar nome da key creator do admin (ID 1)
UPDATE access_keys 
SET code = 'TGS-2024-CREATOR-001' 
WHERE user_id = 1 AND type = 'creator' AND status = 'active';

-- Atualizar taxa da key creator do admin (ID 1) para 0%
UPDATE access_keys 
SET platform_fee = 0.00 
WHERE user_id = 1 AND type = 'creator' AND status = 'active';

-- =====================================================
-- ATUALIZAÇÕES DA TABELA MODS
-- =====================================================

-- Atualizar tabela mods para incluir campos de creator, status e preço
ALTER TABLE mods 
ADD COLUMN IF NOT EXISTS creator_id INT NULL COMMENT 'ID do usuário criador',
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'published') DEFAULT 'draft' COMMENT 'Status do mod',
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'Preço do mod',
ADD COLUMN IF NOT EXISTS free BOOLEAN DEFAULT TRUE COMMENT 'Mod gratuito?',
ADD COLUMN IF NOT EXISTS images JSON NULL COMMENT 'Imagens do mod (array)';

-- Adicionar índices para performance
ALTER TABLE mods 
ADD INDEX IF NOT EXISTS idx_creator (creator_id),
ADD INDEX IF NOT EXISTS idx_status (status),
ADD INDEX IF NOT EXISTS idx_price (price);

-- Adicionar chave estrangeira para creator_id (compatível com MariaDB)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.table_constraints 
     WHERE constraint_schema = DATABASE() 
     AND constraint_name = 'fk_mods_creator' 
     AND table_name = 'mods') > 0,
    'SELECT "Chave estrangeira fk_mods_creator já existe" as message;',
    'ALTER TABLE mods ADD CONSTRAINT fk_mods_creator FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE SET NULL;'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Inserir mods de exemplo se a tabela estiver vazia
INSERT IGNORE INTO mods (
    mod_id, name, description, category, version, size, 
    icon, features, creator_id, status, price, free, download_count
) VALUES 
('mod-01', 'TGS M4 F82', 'Veículo esportivo BMW M4 F82 com modificações personalizadas', 'vehicles', '1.0.0', '45.2 MB', 
 '🚗', '["Motor V8 TwinTurbo", "Suspensão esportiva", "Body kit carbono", "Rodas 20\']', 1, 'published', 25.00, FALSE, 145),

('mod-02', 'TGS Weapon Pack', 'Pacote de armas personalizadas com alta qualidade', 'weapons', '2.1.0', '12.8 MB', 
 '🔫', '["Pistolas custom", "Rifles precisão", "Sons realistas", "Animações melhoradas"]', 1, 'published', 15.00, FALSE, 89),

('mod-03', 'TGS Graphics Ultra', 'Pacote gráfico 4K com texturas realistas', 'graphics', '3.0.0', '2.1 GB', 
 '🎨', '["Texturas 4K", "Lighting melhorado", "Shaders avançados", "Otimização performance"]', 1, 'draft', 35.00, FALSE, 0),

('mod-04', 'TGS Vehicle Pack', 'Pacote com 20 veículos variados', 'vehicles', '1.5.0', '890 MB', 
 '🚗', '["20 veículos", "Modelos HD", "Customização completa", "Performance otimizada"]', 1, 'draft', 45.00, FALSE, 0);

-- =====================================================
-- UPDATES E MANUTENÇÃO
-- =====================================================

-- Atualizar email do admin para tigas300300@gmail.com
UPDATE users 
SET email = 'tigas300300@gmail.com' 
WHERE username = 'admin';

-- Tabela de estados dos mods por usuário
CREATE TABLE IF NOT EXISTS user_mod_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mod_id VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT FALSE COMMENT 'Mod ativado pelo usuário?',
    is_installed BOOLEAN DEFAULT FALSE COMMENT 'Mod instalado?',
    install_path VARCHAR(500) NULL COMMENT 'Caminho de instalação',
    priority_order INT DEFAULT 0 COMMENT 'Ordem de prioridade (quando ativo)',
    last_used TIMESTAMP NULL COMMENT 'Última vez que foi usado',
    settings JSON NULL COMMENT 'Configurações personalizadas do usuário',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_mod (user_id, mod_id),
    INDEX idx_user_enabled (user_id, is_enabled),
    INDEX idx_user_priority (user_id, priority_order)
) ENGINE=InnoDB;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Tipos de permissão (apenas 3 tipos)
INSERT INTO permission_types (name, description, display_order) VALUES
('admin', 'Acesso total administrativo', 1),
('creator', 'Acesso de criador de conteúdo', 2),
('standard', 'Acesso padrão', 3)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Recursos disponíveis
INSERT INTO resources (name, description, category, display_order) VALUES
('maps', 'Mapas e terrenos', 'content', 1),
('weapons', 'Armas e equipamentos', 'content', 2),
('vehicles', 'Veículos', 'content', 3),
('scripts', 'Scripts e funcionalidades', 'content', 4),
('graphics', 'Melhorias gráficas', 'visual', 5),
('audio', 'Áudios e sons', 'visual', 6),
('performance', 'Otimizações de performance', 'system', 7),
('interface', 'Interface e HUD', 'visual', 8)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Permissões padrão
INSERT INTO permissions (permission_type_id, resource_id, access_level, specific_items) 
SELECT pt.id, r.id, 
    CASE 
        WHEN pt.name = 'admin' THEN 'all'
        WHEN pt.name = 'creator' THEN 'all'
        WHEN pt.name = 'standard' THEN 'standard'
        ELSE 'none'
    END,
    NULL
FROM permission_types pt, resources r
ON DUPLICATE KEY UPDATE access_level = VALUES(access_level);

-- Mods padrão
INSERT INTO mods (mod_id, name, description, category, version, size, icon, features, is_premium) VALUES
('mod-01', 'TGS M4 F82', 'Veículo esportivo BMW M4 F82 com modificações personalizadas', 'vehicles', '1.0.0', '45.2 MB', '🚗', 
 JSON_ARRAY('Motor V8 TwinTurbo', 'Suspensão esportiva', 'Body kit carbono', 'Rodas 20"'), FALSE),
('mod-02', 'TGS Weapon Pack', 'Pacote de armas militares com alta qualidade', 'weapons', '2.1.0', '12.8 MB', '🔫',
 JSON_ARRAY('AK-47 Custom', 'Desert Eagle Gold', 'Sniper Rifle', 'Tactical Gear'), FALSE),
('mod-03', 'TGS Graphics Ultra', 'Pacote gráfico 4K com texturas realistas', 'graphics', '3.0.0', '128.5 MB', '🎨',
 JSON_ARRAY('Texturas 4K', 'Lighting melhorado', 'Reflections realistas', 'Weather system'), TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description);

-- Usuário admin padrão (senha: admin123)
INSERT INTO users (username, email, password, role, active) VALUES
('admin', 'tigas300300@gmail.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', TRUE)
ON DUPLICATE KEY UPDATE email = VALUES(email), password = VALUES(password);

-- Dar permissão de creator também para o admin (ID 1)
INSERT INTO access_keys (user_id, code, type, status, is_lifetime, purchase_date) VALUES
(1, 'TGS-2024-ADMIN-CREATOR', 'creator', 'active', TRUE, CURDATE())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Chave admin padrão
INSERT INTO access_keys (user_id, code, type, status, is_lifetime) 
SELECT u.id, 'TGS-2024-ADMIN-001', 'admin', 'active', TRUE 
FROM users u WHERE u.username = 'admin'
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- =====================================================
-- INSERT SAMPLE KEYS
-- =====================================================

-- Desabilitar verificação de chave estrangeira temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Chaves Admin (disponíveis para uso)
INSERT INTO access_keys (user_id, code, type, status, is_lifetime, purchase_date) VALUES
(0, 'TGS-2024-ADMIN-002', 'admin', 'active', TRUE, CURDATE())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Chaves Creator (disponíveis para uso)  
INSERT INTO access_keys (user_id, code, type, status, is_lifetime, purchase_date) VALUES
(0, 'TGS-2024-CREATOR-001', 'creator', 'active', TRUE, CURDATE()),
(0, 'TGS-2024-CREATOR-002', 'creator', 'active', TRUE, CURDATE()),
(0, 'TGS-2024-CREATOR-003', 'creator', 'active', TRUE, CURDATE())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Chaves Standard (disponíveis para uso)
INSERT INTO access_keys (user_id, code, type, status, is_lifetime, purchase_date) VALUES
(0, 'TGS-2024-STANDARD-001', 'standard', 'active', TRUE, CURDATE()),
(0, 'TGS-2024-STANDARD-002', 'standard', 'active', TRUE, CURDATE()),
(0, 'TGS-2024-STANDARD-003', 'standard', 'active', TRUE, CURDATE()),
(0, 'TGS-2024-STANDARD-004', 'standard', 'active', TRUE, CURDATE()),
(0, 'TGS-2024-STANDARD-005', 'standard', 'active', TRUE, CURDATE())
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Chaves Standard com expiração (para teste)
INSERT INTO access_keys (user_id, code, type, status, is_lifetime, purchase_date, expiry_date) VALUES
(0, 'TGS-2024-STANDARD-EXP1', 'standard', 'active', FALSE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY)),
(0, 'TGS-2024-STANDARD-EXP2', 'standard', 'active', FALSE, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY))
ON DUPLICATE KEY UPDATE status = VALUES(status);

-- Reabilitar verificação de chave estrangeira
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- CREATE VIEWS
-- =====================================================

-- View de usuários com chaves ativas
CREATE OR REPLACE VIEW users_with_keys AS
SELECT 
    u.id,
    u.username,
    u.role,
    u.active,
    u.created_at,
    u.last_login,
    COUNT(ak.id) as total_keys,
    COUNT(CASE WHEN ak.status = 'active' THEN 1 END) as active_keys,
    GROUP_CONCAT(ak.code ORDER BY ak.code SEPARATOR ', ') as key_codes
FROM users u
LEFT JOIN access_keys ak ON u.id = ak.user_id
GROUP BY u.id, u.username, u.role, u.active, u.created_at, u.last_login;

-- View de chaves com permissões
CREATE OR REPLACE VIEW keys_with_permissions AS
SELECT 
    ak.id,
    ak.code,
    ak.type,
    ak.status,
    ak.is_lifetime,
    ak.expiry_date,
    u.username,
    JSON_OBJECT(
        'maps', (SELECT access_level FROM permissions p JOIN permission_types pt ON p.permission_type_id = pt.id JOIN resources r ON p.resource_id = r.id WHERE pt.name = ak.type AND r.name = 'maps'),
        'weapons', (SELECT access_level FROM permissions p JOIN permission_types pt ON p.permission_type_id = pt.id JOIN resources r ON p.resource_id = r.id WHERE pt.name = ak.type AND r.name = 'weapons'),
        'vehicles', (SELECT access_level FROM permissions p JOIN permission_types pt ON p.permission_type_id = pt.id JOIN resources r ON p.resource_id = r.id WHERE pt.name = ak.type AND r.name = 'vehicles'),
        'scripts', (SELECT access_level FROM permissions p JOIN permission_types pt ON p.permission_type_id = pt.id JOIN resources r ON p.resource_id = r.id WHERE pt.name = ak.type AND r.name = 'scripts'),
        'graphics', (SELECT access_level FROM permissions p JOIN permission_types pt ON p.permission_type_id = pt.id JOIN resources r ON p.resource_id = r.id WHERE pt.name = ak.type AND r.name = 'graphics'),
        'audio', (SELECT access_level FROM permissions p JOIN permission_types pt ON p.permission_type_id = pt.id JOIN resources r ON p.resource_id = r.id WHERE pt.name = ak.type AND r.name = 'audio')
    ) as permissions
FROM access_keys ak
LEFT JOIN users u ON ak.user_id = u.id
WHERE ak.status = 'active';

-- View de estatísticas do sistema
CREATE OR REPLACE VIEW system_stats AS
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM users WHERE active = TRUE) as active_users,
    (SELECT COUNT(*) FROM access_keys) as total_keys,
    (SELECT COUNT(*) FROM access_keys WHERE status = 'active') as active_keys,
    (SELECT COUNT(*) FROM access_keys WHERE user_id = 0) as available_keys,
    (SELECT COUNT(*) FROM mods) as total_mods,
    (SELECT COUNT(*) FROM mods WHERE is_active = TRUE) as active_mods;

-- =====================================================
-- CLEAN OLD TYPES
-- =====================================================

-- Remover chaves dos tipos antigos (se existir)
DELETE FROM access_keys WHERE type IN ('vip', 'basic', 'premium', 'test');

-- Remover permission_types antigos (se existir)
DELETE FROM permission_types WHERE name IN ('vip', 'basic', 'premium', 'test');

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

SELECT 'Database TGS Launcher criado com sucesso!' as status;
SELECT 'Tipos de chaves disponíveis:' as info;
SELECT DISTINCT type FROM access_keys ORDER BY type;
SELECT 'Permission types configurados:' as info;
SELECT name, description FROM permission_types ORDER BY display_order;
SELECT 'Chaves de exemplo criadas:' as info;
SELECT code, type, status FROM access_keys WHERE code LIKE 'TGS-2024-%' ORDER BY type, code;

-- Tabela de registros de pagamento (Mercado Pago)
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    mod_id INT NOT NULL,
    preference_id VARCHAR(255) NOT NULL,
    payment_id VARCHAR(255),
    transaction_code VARCHAR(255),
    external_reference VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'BRL',
    model_name VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected', 'cancelled', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (mod_id) REFERENCES mods(id) ON DELETE CASCADE,
    INDEX idx_user_mod (user_id, mod_id),
    INDEX idx_preference (preference_id),
    INDEX idx_payment_id (payment_id),
    INDEX idx_transaction_code (transaction_code),
    INDEX idx_external_ref (external_reference),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabela payment_records criada para registros de pagamento!' as status;

-- =====================================================
-- Tabela de pagamentos (Mercado Pago)
-- =====================================================

CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'ID do usuário',
    amount DECIMAL(10,2) NOT NULL COMMENT 'Valor do pagamento',
    model VARCHAR(100) NOT NULL COMMENT 'Modelo do plano (Mensal, Trimestral, etc)',
    method VARCHAR(50) NOT NULL COMMENT 'Método de pagamento (mercadopago)',
    gift_email VARCHAR(100) NULL COMMENT 'Email para presente',
    status ENUM('pending', 'approved', 'rejected', 'cancelled', 'refunded') DEFAULT 'pending' COMMENT 'Status do pagamento',
    mercadopago_preference_id VARCHAR(255) NULL COMMENT 'ID da preferência Mercado Pago',
    mercadopago_payment_id VARCHAR(255) NULL COMMENT 'ID do pagamento Mercado Pago',
    paid_at TIMESTAMP NULL COMMENT 'Data do pagamento',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_mercadopago_preference (mercadopago_preference_id),
    INDEX idx_mercadopago_payment (mercadopago_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabela payments criada com sucesso!' as status;

-- =====================================================
-- VERIFICAÇÃO FINAL - GARANTIR COLUNA TRANSACTION_CODE
-- =====================================================

-- Verificar se a coluna existe (para bancos já existentes)
SET @columnExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'tgs_launcher'
    AND TABLE_NAME = 'payment_records'
    AND COLUMN_NAME = 'transaction_code'
);

-- Adicionar coluna se não existir (para atualizações)
SET @sql = IF(@columnExists = 0, 
    'ALTER TABLE payment_records ADD COLUMN transaction_code VARCHAR(255) NULL AFTER payment_id',
    'SELECT ''Coluna transaction_code já existe'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Adicionar índice se não existir
SET @indexExists = (
    SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'tgs_launcher'
    AND TABLE_NAME = 'payment_records'
    AND INDEX_NAME = 'idx_transaction_code'
);

SET @sql = IF(@indexExists = 0,
    'ALTER TABLE payment_records ADD INDEX idx_transaction_code (transaction_code)',
    'SELECT ''Índice idx_transaction_code já existe'' as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Database TGS Launcher atualizado com sucesso!' as final_status;
SELECT 'Tabelas disponíveis:' as info;
SHOW TABLES;
SELECT 'Tudo pronto para produção!' as info;
