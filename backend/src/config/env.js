const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/driver_monitoring_db',
  jwtSecret: process.env.JWT_SECRET || 'fallback_dev_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  logLevel: process.env.LOG_LEVEL || 'info',
};

// Validate critical configuration in production
if (config.nodeEnv === 'production') {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production mode');
  }
  if (!process.env.MONGO_URI) {
    throw new Error('FATAL: MONGO_URI environment variable is required in production mode');
  }
}

module.exports = config;
