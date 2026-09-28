const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

const READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let hasConnectedOnce = false;

// Setup event listeners for connection monitoring
mongoose.connection.on('connected', () => {
  hasConnectedOnce = true;
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  // Only log runtime connection errors after an active connection was established
  if (hasConnectedOnce && mongoose.connection.readyState === 1) {
    logger.error(`MongoDB runtime connection error: ${err.message}`);
  }
});

mongoose.connection.on('disconnected', () => {
  if (hasConnectedOnce) {
    logger.warn('MongoDB connection lost/disconnected');
  }
});

/**
 * Clean Database Module for MongoDB connection management
 * Seamlessly supports Hybrid Dual-Mode: Live MongoDB or In-Memory Persistence in development
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 1500, // 1.5s timeout for fast initial probe
    });
    logger.info(`MongoDB Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    if (config.nodeEnv === 'production') {
      logger.error(`MongoDB Initial Connection Error: ${error.message}`);
      process.exit(1);
    } else {
      logger.info('ℹ️  No local MongoDB detected. Running seamlessly in In-Memory Dual Mode.');
    }
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('MongoDB connection closed cleanly');
    }
  } catch (error) {
    logger.error(`Error closing MongoDB connection: ${error.message}`);
  }
};

const getDBStatus = () => {
  const readyStateCode = mongoose.connection.readyState;
  const statusString = READY_STATES[readyStateCode] || 'unknown';

  return {
    status: statusString,
    mode: readyStateCode === 1 ? 'mongodb' : 'in-memory-fallback',
    readyState: readyStateCode,
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    isConnected: readyStateCode === 1,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getDBStatus,
};
