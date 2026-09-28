const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Basic Authentication controller placeholder
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return sendError(res, 'Username and password are required', 400);
    }

    // Placeholder credential check (Production should query DB and compare hashed password)
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { userId: 'admin_1', username: 'admin', role: 'FLEET_MANAGER' },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return sendSuccess(
        res,
        { token, user: { username: 'admin', role: 'FLEET_MANAGER' } },
        'Login successful'
      );
    }

    return sendError(res, 'Invalid credentials', 401);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
