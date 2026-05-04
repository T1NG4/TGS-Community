const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

class MySQLDatabase {
    constructor() {
        this.connection = null;
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tgs_launcher',
            charset: 'utf8mb4',
            timezone: '+00:00'
        };
    }

    async initialize() {
        try {
            await this.connect();
            console.log('📦 MySQL Database connected successfully');
        } catch (error) {
            console.error('❌ Failed to connect to MySQL:', error.message);
            throw error;
        }
    }

    async connect() {
        try {
            this.connection = await mysql.createConnection(this.config);
            
            // Test connection
            await this.connection.execute('SELECT 1');
            
            // Handle disconnection
            this.connection.on('error', (err) => {
                if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                    console.log('🔄 Database connection lost, reconnecting...');
                    this.connect();
                } else {
                    console.error('❌ Database error:', err);
                }
            });
            
        } catch (error) {
            console.error('❌ MySQL connection error:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    // ===== USER METHODS =====
    
    async findUserByUsername(username) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT id, username, password, role, active, created_at, last_login, login_count, email, notes
                FROM users 
                WHERE username = ? AND active = TRUE
            `, [username]);
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by username:', error);
            throw error;
        }
    }

    async findUserByKey(keyCode) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT 
                    u.id, u.username, u.password, u.role, u.active, u.created_at, u.last_login, u.login_count,
                    ak.id as key_id, ak.code, ak.type, ak.status, ak.expiry_date, ak.is_lifetime
                FROM users u
                JOIN access_keys ak ON u.id = ak.user_id
                WHERE ak.code = ? AND ak.status = 'active' AND u.active = TRUE
            `, [keyCode]);
            
            if (rows.length === 0) {
                return null;
            }

            const row = rows[0];
            
            // Check if key is expired
            if (!row.is_lifetime && row.expiry_date) {
                const expiryDate = new Date(row.expiry_date);
                if (expiryDate < new Date()) {
                    // Mark key as expired
                    await this.connection.execute(
                        'UPDATE access_keys SET status = ? WHERE id = ?',
                        ['expired', row.key_id]
                    );
                    return null;
                }
            }

            // Get permissions for this key type
            const [permissionRows] = await this.connection.execute(`
                SELECT r.name as resource_name, p.access_level
                FROM permissions p
                JOIN permission_types pt ON p.permission_type_id = pt.id
                JOIN resources r ON p.resource_id = r.id
                WHERE pt.name = ?
            `, [row.type]);

            // Build permissions object
            const permissions = {};
            permissionRows.forEach(perm => {
                permissions[perm.resource_name] = perm.access_level;
            });

            // Build user object with keys
            const user = {
                id: row.id,
                username: row.username,
                password: row.password,
                role: row.role,
                active: row.active,
                createdAt: row.created_at,
                lastLogin: row.last_login,
                keys: [{
                    code: row.code,
                    type: row.type,
                    status: row.status,
                    expiryDate: row.expiry_date,
                    isLifetime: row.is_lifetime,
                    resources: permissions
                }]
            };

            const key = {
                code: row.code,
                type: row.type,
                status: row.status,
                expiryDate: row.expiry_date,
                isLifetime: row.is_lifetime,
                resources: permissions
            };

            return { user, key };
        } catch (error) {
            console.error('Error finding user by key:', error);
            throw error;
        }
    }

    async updateUserLastLogin(userId) {
        try {
            await this.connection.execute(`
                UPDATE users 
                SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1
                WHERE id = ?
            `, [userId]);
        } catch (error) {
            console.error('Error updating user last login:', error);
            throw error;
        }
    }

    async logAuthEvent(userId, keyCode, action, ipAddress, userAgent, success = true, errorMessage = null) {
        try {
            await this.connection.execute(`
                INSERT INTO auth_logs (user_id, access_key_code, action, ip_address, user_agent, success, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [userId, keyCode, action, ipAddress, userAgent, success, errorMessage]);
        } catch (error) {
            console.error('Error logging auth event:', error);
            // Don't throw error for logging
        }
    }

    // ===== MOD METHODS =====
    
    async getAllMods() {
        try {
            const [rows] = await this.connection.execute(`
                SELECT mod_id as id, name, description, category, version, size, 
                       icon, features, is_premium, is_active, download_url, image_url
                FROM mods 
                WHERE is_active = TRUE
                ORDER BY category, name
            `);
            
            return rows.map(row => ({
                ...row,
                features: row.features ? JSON.parse(row.features) : [],
                enabled: false // Default state, will be updated per user
            }));
        } catch (error) {
            console.error('Error getting all mods:', error);
            throw error;
        }
    }

    async getModsByCategory(category) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT mod_id as id, name, description, category, version, size, 
                       icon, features, is_premium, is_active, download_url, image_url
                FROM mods 
                WHERE category = ? AND is_active = TRUE
                ORDER BY name
            `, [category]);
            
            return rows.map(row => ({
                ...row,
                features: row.features ? JSON.parse(row.features) : [],
                enabled: false
            }));
        } catch (error) {
            console.error('Error getting mods by category:', error);
            throw error;
        }
    }

    async getModById(modId) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT mod_id as id, name, description, category, version, size, 
                       icon, features, is_premium, is_active, download_url, image_url
                FROM mods 
                WHERE mod_id = ? AND is_active = TRUE
            `, [modId]);
            
            if (rows.length === 0) return null;
            
            const row = rows[0];
            return {
                ...row,
                features: row.features ? JSON.parse(row.features) : [],
                enabled: false
            };
        } catch (error) {
            console.error('Error getting mod by ID:', error);
            throw error;
        }
    }

    async searchMods(query) {
        try {
            const searchTerm = `%${query}%`;
            const [rows] = await this.connection.execute(`
                SELECT mod_id as id, name, description, category, version, size, 
                       icon, features, is_premium, is_active, download_url, image_url
                FROM mods 
                WHERE (name LIKE ? OR description LIKE ?) AND is_active = TRUE
                ORDER BY name
            `, [searchTerm, searchTerm]);
            
            return rows.map(row => ({
                ...row,
                features: row.features ? JSON.parse(row.features) : [],
                enabled: false
            }));
        } catch (error) {
            console.error('Error searching mods:', error);
            throw error;
        }
    }

    async getUserModStates(userId) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT mod_id, is_enabled, is_installed, priority_order, settings
                FROM user_mod_states 
                WHERE user_id = ?
            `, [userId]);
            
            const states = {};
            rows.forEach(row => {
                states[row.mod_id] = {
                    enabled: row.is_enabled,
                    installed: row.is_installed,
                    priority: row.priority_order,
                    settings: row.settings ? JSON.parse(row.settings) : {}
                };
            });
            
            return states;
        } catch (error) {
            console.error('Error getting user mod states:', error);
            throw error;
        }
    }

    async updateModState(userId, modId, enabled, settings = {}) {
        try {
            await this.connection.execute(`
                INSERT INTO user_mod_states (user_id, mod_id, is_enabled, settings, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                is_enabled = VALUES(is_enabled),
                settings = VALUES(settings),
                updated_at = CURRENT_TIMESTAMP
            `, [userId, modId, enabled, JSON.stringify(settings)]);
            
            return true;
        } catch (error) {
            console.error('Error updating mod state:', error);
            throw error;
        }
    }

    // ===== ADMIN METHODS =====
    
    async getSystemStats() {
        try {
            const [rows] = await this.connection.execute('SELECT * FROM system_stats');
            const stats = {};
            rows.forEach(row => {
                stats[row.metric] = row.value;
            });
            return stats;
        } catch (error) {
            console.error('Error getting system stats:', error);
            throw error;
        }
    }

    async getUsersWithKeys() {
        try {
            const [rows] = await this.connection.execute('SELECT * FROM users_with_keys ORDER BY username');
            return rows;
        } catch (error) {
            console.error('Error getting users with keys:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const hashedPassword = await this.hashPassword(userData.password);
            
            const [result] = await this.connection.execute(`
                INSERT INTO users (username, password, role, active, email, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                userData.username,
                hashedPassword,
                userData.role || 'user',
                userData.active !== undefined ? userData.active : true,
                userData.email || null,
                userData.notes || null
            ]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async createAccessKey(keyData) {
        try {
            const [result] = await this.connection.execute(`
                INSERT INTO access_keys (user_id, code, type, status, purchase_date, expiry_date, is_lifetime, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                keyData.userId,
                keyData.code,
                keyData.type,
                keyData.status || 'active',
                keyData.purchaseDate || null,
                keyData.expiryDate || null,
                keyData.isLifetime || false,
                keyData.notes || null
            ]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error creating access key:', error);
            throw error;
        }
    }

    // ===== UTILITY METHODS =====
    
    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    async testConnection() {
        try {
            if (!this.connection) {
                await this.connect();
            }
            
            await this.connection.execute('SELECT 1');
            return true;
        } catch (error) {
            console.error('Database connection test failed:', error);
            return false;
        }
    }

    // ===== ADMIN METHODS =====
    
    async getAllUsers() {
        try {
            const [rows] = await this.connection.execute(`
                SELECT id, username, role, active, created_at, last_login, login_count, email
                FROM users 
                ORDER BY username
            `);
            
            return rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }
    
    async findUserById(userId) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT id, username, role, active, created_at, last_login, login_count, email
                FROM users 
                WHERE id = ?
            `, [userId]);
            
            return rows[0] || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }
    
    async getUserKeys(userId) {
        try {
            const [rows] = await this.connection.execute(`
                SELECT code, type, status, purchase_date, expiry_date, is_lifetime
                FROM access_keys 
                WHERE user_id = ? AND status = 'active'
            `, [userId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting user keys:', error);
            throw error;
        }
    }
    
    async insertAccessKey(keyData) {
        try {
            const { key, type, userId, generatedBy, createdAt } = keyData;
            
            const [result] = await this.connection.execute(`
                INSERT INTO access_keys (user_id, code, type, status, purchase_date, is_lifetime)
                VALUES (?, ?, ?, 'active', ?, TRUE)
            `, [userId, key, type, createdAt]);
            
            return result.insertId;
        } catch (error) {
            console.error('Error inserting access key:', error);
            throw error;
        }
    }
    
    async updateUserStatus(userId, status) {
        try {
            const [result] = await this.connection.execute(`
                UPDATE users 
                SET active = ? 
                WHERE id = ?
            `, [status === 'active' ? 1 : 0, userId]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating user status:', error);
            throw error;
        }
    }
    
    async revokeUserKeys(userId) {
        try {
            const [result] = await this.connection.execute(`
                UPDATE access_keys 
                SET status = 'revoked' 
                WHERE user_id = ? AND status = 'active'
            `, [userId]);
            
            return result.affectedRows;
        } catch (error) {
            console.error('Error revoking user keys:', error);
            throw error;
        }
    }

    // ===== TRANSACTION METHODS =====
    
    async transaction(callback) {
        const connection = await mysql.createConnection(this.config);
        
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            await connection.end();
        }
    }
}

module.exports = MySQLDatabase;
