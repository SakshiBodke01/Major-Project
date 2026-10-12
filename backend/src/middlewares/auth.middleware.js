const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { sendError } = require('../utils/responseHandler');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. Authorization token missing or malformed.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Invalid or expired authentication token.', 401);
  }
};

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch {
      // Ignored for optional auth
    }
  }
  next();
};

const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required.', 401);
    }
    if (req.user.role !== allowedRole) {
      return sendError(res, `Forbidden: Only users with role '${allowedRole}' are permitted.`, 403);
    }
    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
};
