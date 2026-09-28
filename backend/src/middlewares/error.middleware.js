const config = require('../config/env');
const logger = require('../utils/logger');
const { sendError } = require('../utils/responseHandler');

/**
 * Centralized Error Handling Middleware
 * Prevents stack trace leakage in production and guarantees uniform JSON output.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl}: ${err.message}`, {
    stack: err.stack,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational || config.nodeEnv !== 'production'
    ? err.message
    : 'Internal Server Error';

  const errors = err.errors || (config.nodeEnv !== 'production' && err.stack ? [err.stack] : null);

  return sendError(res, message, statusCode, errors);
};

module.exports = errorHandler;
