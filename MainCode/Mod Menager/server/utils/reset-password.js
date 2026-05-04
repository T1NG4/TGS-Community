const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

class PasswordManager {
    constructor() {
        this.connection = null;
    }

    async connect() {
        this.connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tgs_launcher'
        });
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
        }
    }

    async listUsers() {
        try {
            await this.connect();
            
            const [rows] = await this.connection.execute(`
                SELECT id, username, role, active, created_at, last_login, login_count
                FROM users 
                ORDER BY username
            `);
            
            console.log('\n📋 USUÁRIOS CADASTRADOS:');
            console.log('ID | Username | Role | Status | Último Login');
            console.log('---|----------|------|--------|---------------');
            
            rows.forEach(user => {
                const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca';
                const status = user.active ? '✅ Ativo' : '❌ Inativo';
                console.log(`${user.id} | ${user.username.padEnd(8)} | ${user.role.padEnd(4)} | ${status} | ${lastLogin}`);
            });
            
            return rows;
        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error.message);
        } finally {
            await this.disconnect();
        }
    }

    async resetPassword(username, newPassword) {
        try {
            await this.connect();
            
            // Verificar se usuário existe
            const [userRows] = await this.connection.execute(
                'SELECT id, username FROM users WHERE username = ?',
                [username]
            );
            
            if (userRows.length === 0) {
                console.log(`❌ Usuário '${username}' não encontrado`);
                return false;
            }
            
            // Hash da nova senha
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            // Atualizar senha
            await this.connection.execute(
                'UPDATE users SET password = ? WHERE username = ?',
                [hashedPassword, username]
            );
            
            console.log(`✅ Senha do usuário '${username}' atualizada com sucesso!`);
            console.log(`🔑 Nova senha: ${newPassword}`);
            console.log(`⚠️  Guarde esta senha em local seguro!`);
            
            // Log da alteração
            await this.connection.execute(
                'INSERT INTO auth_logs (user_id, action, success, error_message) VALUES (?, ?, ?, ?)',
                [userRows[0].id, 'password_change', true, `Senha alterada pelo administrador`]
            );
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao resetar senha:', error.message);
            return false;
        } finally {
            await this.disconnect();
        }
    }

    async createUser(userData) {
        try {
            await this.connect();
            
            const { username, password, role = 'user', email = null } = userData;
            
            // Verificar se usuário já existe
            const [existing] = await this.connection.execute(
                'SELECT id FROM users WHERE username = ?',
                [username]
            );
            
            if (existing.length > 0) {
                console.log(`❌ Usuário '${username}' já existe`);
                return false;
            }
            
            // Hash da senha
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Criar usuário
            const [result] = await this.connection.execute(`
                INSERT INTO users (username, password, role, email, active)
                VALUES (?, ?, ?, ?, TRUE)
            `, [username, hashedPassword, role, email]);
            
            console.log(`✅ Usuário '${username}' criado com sucesso!`);
            console.log(`🔑 Senha: ${password}`);
            console.log(`👤 Role: ${role}`);
            console.log(`📧 Email: ${email || 'Não informado'}`);
            console.log(`⚠️  Guarde a senha em local seguro!`);
            
            return result.insertId;
        } catch (error) {
            console.error('❌ Erro ao criar usuário:', error.message);
            return false;
        } finally {
            await this.disconnect();
        }
    }

    async createAccessKey(userId, keyCode, keyType = 'basic', isLifetime = false) {
        try {
            await this.connect();
            
            // Verificar se usuário existe
            const [userRows] = await this.connection.execute(
                'SELECT username FROM users WHERE id = ?',
                [userId]
            );
            
            if (userRows.length === 0) {
                console.log(`❌ Usuário ID ${userId} não encontrado`);
                return false;
            }
            
            // Verificar se chave já existe
            const [existingKey] = await this.connection.execute(
                'SELECT id FROM access_keys WHERE code = ?',
                [keyCode]
            );
            
            if (existingKey.length > 0) {
                console.log(`❌ Chave '${keyCode}' já existe`);
                return false;
            }
            
            // Criar chave
            await this.connection.execute(`
                INSERT INTO access_keys (user_id, code, type, status, is_lifetime)
                VALUES (?, ?, ?, 'active', ?)
            `, [userId, keyCode, keyType, isLifetime]);
            
            console.log(`✅ Chave criada com sucesso!`);
            console.log(`👤 Usuário: ${userRows[0].username} (ID: ${userId})`);
            console.log(`🔑 Chave: ${keyCode}`);
            console.log(`📦 Tipo: ${keyType}`);
            console.log(`⏰ Vitalícia: ${isLifetime ? 'Sim' : 'Não'}`);
            
            return true;
        } catch (error) {
            console.error('❌ Erro ao criar chave:', error.message);
            return false;
        } finally {
            await this.disconnect();
        }
    }

    async showUserInfo(username) {
        try {
            await this.connect();
            
            // Dados do usuário
            const [userRows] = await this.connection.execute(`
                SELECT id, username, role, active, email, created_at, last_login, login_count
                FROM users 
                WHERE username = ?
            `, [username]);
            
            if (userRows.length === 0) {
                console.log(`❌ Usuário '${username}' não encontrado`);
                return;
            }
            
            const user = userRows[0];
            
            console.log(`\n👤 INFORMAÇÕES DO USUÁRIO:`);
            console.log(`ID: ${user.id}`);
            console.log(`Username: ${user.username}`);
            console.log(`Role: ${user.role}`);
            console.log(`Status: ${user.active ? '✅ Ativo' : '❌ Inativo'}`);
            console.log(`Email: ${user.email || 'Não informado'}`);
            console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
            console.log(`Último login: ${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}`);
            console.log(`Contador de logins: ${user.login_count}`);
            
            // Chaves do usuário
            const [keyRows] = await this.connection.execute(`
                SELECT code, type, status, purchase_date, expiry_date, is_lifetime
                FROM access_keys 
                WHERE user_id = ?
                ORDER BY created_at DESC
            `, [user.id]);
            
            if (keyRows.length > 0) {
                console.log(`\n🔑 CHAVES DE ACESSO (${keyRows.length}):`);
                console.log('Código | Tipo | Status | Expiração');
                console.log('--------|------|--------|----------');
                
                keyRows.forEach(key => {
                    const status = key.status === 'active' ? '✅ Ativa' : `❌ ${key.status}`;
                    const expiry = key.is_lifetime ? 'Vitalícia' : 
                                  (key.expiry_date ? new Date(key.expiry_date).toLocaleDateString('pt-BR') : 'Não definida');
                    console.log(`${key.code} | ${key.type} | ${status} | ${expiry}`);
                });
            } else {
                console.log(`\n🔑 Nenhuma chave de acesso encontrada`);
            }
            
            // Logs recentes
            const [logRows] = await this.connection.execute(`
                SELECT action, success, created_at, error_message
                FROM auth_logs 
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 10
            `, [user.id]);
            
            if (logRows.length > 0) {
                console.log(`\n📋 LOGS RECENTES:`);
                console.log('Ação | Sucesso | Data/Hora');
                console.log('-----|--------|----------');
                
                logRows.forEach(log => {
                    const success = log.success ? '✅' : '❌';
                    const date = new Date(log.created_at).toLocaleString('pt-BR');
                    console.log(`${log.action} | ${success} | ${date}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar informações:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// CLI Interface
async function main() {
    const manager = new PasswordManager();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🔧 GERENCIADOR DE SENHAS TGS

Comandos disponíveis:

📋 Listar usuários:
  node reset-password.js list

👤 Ver informações do usuário:
  node reset-password.js info <username>

🔑 Resetar senha:
  node reset-password.js reset <username> <nova_senha>

➕ Criar usuário:
  node reset-password.js create <username> <senha> [role] [email]

🔑 Criar chave de acesso:
  node reset-password.js key <user_id> <key_code> [type] [lifetime]

Exemplos:
  node reset-password.js list
  node reset-password.js info tigas
  node reset-password.js reset tigas nova123
  node reset-password.js create ana senha123 user ana@email.com
  node reset-password.js key 1 TGS-2024-PREMIUM-001 premium true
        `);
        return;
    }
    
    const command = args[0];
    
    try {
        switch (command) {
            case 'list':
                await manager.listUsers();
                break;
                
            case 'info':
                if (args.length < 2) {
                    console.log('❌ Uso: node reset-password.js info <username>');
                    return;
                }
                await manager.showUserInfo(args[1]);
                break;
                
            case 'reset':
                if (args.length < 3) {
                    console.log('❌ Uso: node reset-password.js reset <username> <nova_senha>');
                    return;
                }
                await manager.resetPassword(args[1], args[2]);
                break;
                
            case 'create':
                if (args.length < 3) {
                    console.log('❌ Uso: node reset-password.js create <username> <senha> [role] [email]');
                    return;
                }
                await manager.createUser({
                    username: args[1],
                    password: args[2],
                    role: args[3] || 'user',
                    email: args[4] || null
                });
                break;
                
            case 'key':
                if (args.length < 3) {
                    console.log('❌ Uso: node reset-password.js key <user_id> <key_code> [type] [lifetime]');
                    return;
                }
                await manager.createAccessKey(
                    parseInt(args[1]),
                    args[2],
                    args[3] || 'basic',
                    args[4] === 'true'
                );
                break;
                
            default:
                console.log(`❌ Comando desconhecido: ${command}`);
                console.log('Use "node reset-password.js" para ver comandos disponíveis');
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = PasswordManager;
