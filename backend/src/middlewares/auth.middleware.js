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

module.exports = {
  authenticate,
};
