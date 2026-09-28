const logger = require('../utils/logger');

/**
 * Request Logging Middleware
 * Captures request duration, HTTP method, URL, status code, and client IP.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(
      level,
      `${req.method} ${req.originalUrl} ${statusCode} ${duration}ms - ${req.ip || req.socket.remoteAddress}`
    );
  });

  next();
};

module.exports = requestLogger;
