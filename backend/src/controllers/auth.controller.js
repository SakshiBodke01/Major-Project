const jwt = require('jsonwebtoken');
const config = require('../config/env');
const managerService = require('../services/manager.service');
const driverService = require('../services/driver.service');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Role-Based Authentication Controller
 * Strictly handles two roles:
 * 1. MANAGER - Website / Web Dashboard only
 * 2. DRIVER  - Android Edge Application only
 */
const login = async (req, res, next) => {
  try {
    const { username, password, driverId, role } = req.body;
    const identifier = username || driverId;

    if (!identifier || !password) {
      return sendError(res, 'User identifier (username / driverId) and password are required', 400);
    }

    // Explicit role check requested by client
    const targetRole = role ? role.toUpperCase() : null;

    // 1. Try MANAGER authentication
    const manager = await managerService.authenticateManager(identifier, password);
    if (manager) {
      if (targetRole === 'DRIVER') {
        return sendError(res, 'Access denied. Managers cannot log in to the Driver mobile application.', 403);
      }

      const token = jwt.sign(
        {
          managerId: manager.managerId,
          username: manager.username,
          name: manager.name,
          role: 'MANAGER',
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return sendSuccess(
        res,
        {
          token,
          user: {
            managerId: manager.managerId,
            username: manager.username,
            name: manager.name,
            role: 'MANAGER',
            department: manager.department,
          },
        },
        'Manager login successful'
      );
    }

    // 2. Try DRIVER authentication
    const driver = await driverService.authenticateDriver(identifier, password);
    if (driver) {
      if (targetRole === 'MANAGER') {
        return sendError(res, 'Access denied. Drivers are not authorized to access the Manager Web Portal.', 403);
      }

      const token = jwt.sign(
        {
          driverId: driver.driverId,
          name: driver.name,
          managerId: driver.managerId,
          role: 'DRIVER',
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      return sendSuccess(
        res,
        {
          token,
          user: {
            driverId: driver.driverId,
            username: driver.driverId,
            name: driver.name,
            managerId: driver.managerId,
            role: 'DRIVER',
            status: driver.status,
          },
        },
        'Driver login successful'
      );
    }

    return sendError(res, 'Invalid credentials. Please verify your ID and password.', 401);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
};
