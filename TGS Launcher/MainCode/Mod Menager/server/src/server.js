const app = require('./app');
const config = require('../config/config');
const MySQLDatabase = require('./mysql-database');

const startServer = async () => {
    try {
        // Initialize MySQL database
        const db = new MySQLDatabase();
        await db.initialize();
        console.log('📦 MySQL Database initialized successfully');
        
        // Make database available globally
        global.database = db;
        
        // Start the server
        const PORT = process.env.PORT || config.server.port;
        app.listen(PORT, () => {
            console.log(`🚀 TGS Authentication Server running on port ${PORT}`);
            console.log(`📡 API available at http://localhost:${PORT}/api`);
            console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`🔐 Authentication endpoints:`);
            console.log(`   POST /api/auth/login - User login`);
            console.log(`   GET  /api/auth/validate - Token validation`);
            console.log(`📦 Mods endpoints:`);
            console.log(`   GET  /api/mods - Get mods catalog`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start the server
startServer();
