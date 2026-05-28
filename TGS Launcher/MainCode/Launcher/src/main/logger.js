const winston = require('winston');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

const logsDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tgs-launcher' },
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

logger.getLogs = async () => {
  try {
    const combinedLogPath = path.join(logsDir, 'combined.log');
    const errorLogPath = path.join(logsDir, 'error.log');

    const combinedLogs = fs.existsSync(combinedLogPath)
      ? fs.readFileSync(combinedLogPath, 'utf8')
      : '';
    const errorLogs = fs.existsSync(errorLogPath)
      ? fs.readFileSync(errorLogPath, 'utf8')
      : '';

    return {
      combined: combinedLogs,
      error: errorLogs,
    };
  } catch (error) {
    logger.error('Failed to read logs', error);
    throw error;
  }
};

module.exports = logger;