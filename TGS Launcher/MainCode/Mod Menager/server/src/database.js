const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');

class Database {
    constructor() {
        this.users = [];
        this.mods = [];
        this.dbPath = path.join(__dirname, '../config/database.json');
    }

    async initialize() {
        try {
            await this.loadDatabase();
            console.log('📦 Database loaded successfully');
        } catch (error) {
            console.log('📝 Creating new database...');
            await this.createDefaultDatabase();
        }
    }

    async loadDatabase() {
        const data = await fs.readFile(this.dbPath, 'utf8');
        const db = JSON.parse(data);
        this.users = db.users || [];
        this.mods = db.mods || [];
    }

    async saveDatabase() {
        const data = {
            users: this.users,
            mods: this.mods,
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
    }

    async createDefaultDatabase() {
        // Default users from original auth-config.json
        this.users = [
            {
                id: "user-001",
                username: "admin",
                key: "TGS-2024-PREMIUM-001",
                password: await this.hashPassword("TGS_pedro2004"),
                role: "admin",
                active: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: "user-002",
                username: "user",
                key: "LAUNCHER-2024-STANDARD-002",
                password: await this.hashPassword("user123"),
                role: "user",
                active: true,
                createdAt: new Date().toISOString(),
                lastLogin: null
            }
        ];

        // Default mods catalog
        this.mods = [
            {
                id: "mod-001",
                name: "TGS M4 F82",
                category: "veiculos",
                description: "BMW M4 F82 com modificações exclusivas TGS",
                image: "m4f82.png",
                version: "1.0.0",
                size: "45MB",
                downloads: 1250,
                rating: 4.8,
                tags: ["esportivo", "bmw", "alemao"],
                enabled: false,
                createdAt: new Date().toISOString()
            },
            {
                id: "mod-002",
                name: "TGS Advanced Graphics",
                category: "graphics",
                subcategory: "Advanced",
                description: "Pacote gráfico avançado para visual realista",
                image: "TGS_Advanced_logo.png",
                version: "2.1.0",
                size: "128MB",
                downloads: 3420,
                rating: 4.9,
                tags: ["grafico", "realista", "4k"],
                enabled: false,
                createdAt: new Date().toISOString()
            },
            {
                id: "mod-003",
                name: "TGS Realistic Plus",
                category: "graphics",
                subcategory: "realistic-plus",
                description: "Enhanced realistic graphics pack with improved textures",
                image: "TGS_RealisticPlus.png",
                version: "1.5.0",
                size: "89MB",
                downloads: 2180,
                rating: 4.7,
                tags: ["grafico", "texturas", "realismo"],
                enabled: false,
                createdAt: new Date().toISOString()
            }
        ];

        await this.saveDatabase();
        console.log('📝 Default database created with users and mods');
    }

    async hashPassword(password) {
        const bcrypt = require('bcryptjs');
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    async comparePassword(password, hashedPassword) {
        const bcrypt = require('bcryptjs');
        return await bcrypt.compare(password, hashedPassword);
    }

    // User methods
    findUserByKey(key) {
        return this.users.find(user => user.key === key && user.active);
    }

    findUserByUsername(username) {
        return this.users.find(user => user.username === username && user.active);
    }

    findUserById(id) {
        return this.users.find(user => user.id === id && user.active);
    }

    async updateUserLastLogin(userId) {
        const user = this.findUserById(userId);
        if (user) {
            user.lastLogin = new Date().toISOString();
            await this.saveDatabase();
        }
    }

    // Mod methods
    getAllMods() {
        return this.mods;
    }

    getModById(id) {
        return this.mods.find(mod => mod.id === id);
    }

    getModsByCategory(category) {
        return this.mods.filter(mod => mod.category === category);
    }

    async updateModStatus(modId, enabled) {
        const mod = this.getModById(modId);
        if (mod) {
            mod.enabled = enabled;
            await this.saveDatabase();
            return true;
        }
        return false;
    }

    getEnabledMods() {
        return this.mods.filter(mod => mod.enabled);
    }

    // Search methods
    searchMods(query) {
        const searchTerm = query.toLowerCase();
        return this.mods.filter(mod => 
            mod.name.toLowerCase().includes(searchTerm) ||
            mod.description.toLowerCase().includes(searchTerm) ||
            mod.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
}

// Create singleton instance
const database = new Database();

// Export initialize function and database instance
const initializeDatabase = async () => {
    await database.initialize();
    return database;
};

module.exports = {
    initializeDatabase,
    database
};
