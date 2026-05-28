const mysql = require('mysql2/promise');

class PasswordHashViewer {
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

    async showPasswordHash(username) {
        try {
            await this.connect();
            
            const [rows] = await this.connection.execute(`
                SELECT id, username, password, role, active, created_at, last_login
                FROM users 
                WHERE username = ?
            `, [username]);
            
            if (rows.length === 0) {
                console.log(`❌ Usuário '${username}' não encontrado`);
                return;
            }
            
            const user = rows[0];
            
            console.log(`\n🔑 INFORMAÇÕES DE SENHA:`);
            console.log(`Username: ${user.username}`);
            console.log(`Role: ${user.role}`);
            console.log(`Status: ${user.active ? '✅ Ativo' : '❌ Inativo'}`);
            console.log(`Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
            console.log(`Último login: ${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}`);
            console.log(`\n🔒 HASH DA SENHA:`);
            console.log(`${user.password}`);
            console.log(`\n⚠️  ATENÇÃO:`);
            console.log(`   • Este é o HASH da senha, não a senha original`);
            console.log(`   • Não é possível "descriptografar" um hash bcrypt`);
            console.log(`   • Para mudar a senha, use: node reset-password.js reset ${username} <nova_senha>`);
            
            // Mostrar chaves do usuário
            const [keyRows] = await this.connection.execute(`
                SELECT code, type, status, purchase_date, expiry_date, is_lifetime
                FROM access_keys 
                WHERE user_id = ?
                ORDER BY created_at DESC
            `, [user.id]);
            
            if (keyRows.length > 0) {
                console.log(`\n🔑 CHAVES DE ACESSO:`);
                keyRows.forEach((key, index) => {
                    const status = key.status === 'active' ? '✅ Ativa' : `❌ ${key.status}`;
                    const expiry = key.is_lifetime ? 'Vitalícia' : 
                                  (key.expiry_date ? new Date(key.expiry_date).toLocaleDateString('pt-BR') : 'Não definida');
                    console.log(`   ${index + 1}. ${key.code} (${key.type}) - ${status} - Expira: ${expiry}`);
                });
            }
            
        } catch (error) {
            console.error('❌ Erro ao buscar hash:', error.message);
        } finally {
            await this.disconnect();
        }
    }

    async listAllUsers() {
        try {
            await this.connect();
            
            const [rows] = await this.connection.execute(`
                SELECT id, username, role, active, created_at, last_login
                FROM users 
                ORDER BY username
            `);
            
            console.log('\n📋 TODOS OS USUÁRIOS:');
            console.log('ID | Username | Role | Status | Último Login');
            console.log('---|----------|------|--------|---------------');
            
            rows.forEach(user => {
                const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Nunca';
                const status = user.active ? '✅ Ativo' : '❌ Inativo';
                console.log(`${user.id} | ${user.username.padEnd(8)} | ${user.role.padEnd(4)} | ${status} | ${lastLogin}`);
            });
            
            console.log(`\n💡 Para ver o hash de um usuário específico:`);
            console.log(`   node show-password-hash.js <username>`);
            
        } catch (error) {
            console.error('❌ Erro ao listar usuários:', error.message);
        } finally {
            await this.disconnect();
        }
    }
}

// CLI Interface
async function main() {
    const viewer = new PasswordHashViewer();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
🔍 VISUALIZADOR DE HASH DE SENHAS

Comandos disponíveis:

📋 Listar todos usuários:
  node show-password-hash.js list

🔍 Ver hash da senha:
  node show-password-hash.js <username>

Exemplos:
  node show-password-hash.js list
  node show-password-hash.js tigas
  node show-password-hash.js admin
        `);
        return;
    }
    
    const username = args[0];
    
    if (username === 'list') {
        await viewer.listAllUsers();
    } else {
        await viewer.showPasswordHash(username);
    }
}

if (require.main === module) {
    main();
}

module.exports = PasswordHashViewer;
