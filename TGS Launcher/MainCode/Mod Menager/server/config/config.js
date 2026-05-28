module.exports = {
    server: {
        port: 3000,
        host: 'localhost'
    },
    
    jwt: {
        secret: process.env.JWT_SECRET || 'tgs-super-secret-jwt-key-change-in-production',
        expiresIn: '24h'
    },
    
    auth: {
        requireKey: true,
        requirePassword: true,
        sessionTimeout: 3600000, // 1 hour in milliseconds
        maxAttempts: 3,
        lockoutDuration: 300000, // 5 minutes in milliseconds
        bcryptRounds: 12
    },
    
    database: {
        path: './config/database.json',
        backupInterval: 3600000 // 1 hour
    },
    
    security: {
        rateLimitWindow: 15 * 60 * 1000, // 15 minutes
        rateLimitMax: 100,
        corsOrigins: ['http://localhost:3000', 'file://']
    },
    
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: './logs/server.log'
    }
};
