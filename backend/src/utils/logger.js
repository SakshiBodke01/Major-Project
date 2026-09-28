const winston = require('winston');
const config = require('../config/env');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'dms-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, stack }) => {
          return `[${timestamp}] [${level}] [${service}]: ${stack || message}`;
        })
      ),
    }),
  ],
});

module.exports = logger;
