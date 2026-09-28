const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const logger = require('./utils/logger');

let server;

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP Server
    server = app.listen(config.port, () => {
      logger.info(`DriveGuard AI Backend running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    logger.error(`Failed to start backend server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const handleGracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown sequence...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed. Terminating active database connections...');
      await disconnectDB();
      logger.info('Graceful shutdown completed cleanly. Exiting.');
      process.exit(0);
    });

    // Force shutdown if cleanup takes longer than 10s
    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000);
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

// Register Process Signal Handlers
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

// Register Global Exception & Rejection Handlers
process.on('uncaughtException', (error) => {
  logger.error(`[Uncaught Exception]: ${error.message}`, { stack: error.stack });
  handleGracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error(`[Unhandled Rejection]: ${reason}`);
  handleGracefulShutdown('unhandledRejection');
});

startServer();
