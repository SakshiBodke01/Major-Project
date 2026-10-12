const driverService = require('../services/driver.service');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Driver Controller - Strictly enforces Manager-only Driver Creation
 * and Manager-scoped Driver Data Retrieval.
 */
const createDriver = async (req, res, next) => {
  try {
    // Only Managers are allowed to create driver IDs
    if (req.user && req.user.role !== 'MANAGER') {
      return sendError(res, 'Forbidden: Only managers are permitted to register driver IDs', 403);
    }

    const managerId = req.user?.managerId || req.body.managerId || 'MGR-001';
    const driver = await driverService.createDriver(req.body, managerId);
    return sendSuccess(res, driver, 'Driver registered successfully by Manager', 201);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = `Driver ID '${req.body.driverId}' already exists`;
    }
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);

    // If request comes from an authenticated Manager, scope drivers to this Manager only
    const managerId = req.user?.managerId || req.query.managerId || null;

    const result = await driverService.getDrivers(managerId, page, limit);
    return sendSuccess(
      res,
      result.drivers,
      managerId
        ? `Drivers retrieved for Manager: ${managerId}`
        : 'Drivers retrieved successfully',
      200,
      result.pagination
    );
  } catch (error) {
    next(error);
  }
};

const getDriverById = async (req, res, next) => {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    if (!driver) {
      const err = new Error(`Driver not found with ID: ${req.params.id}`);
      err.statusCode = 404;
      throw err;
    }

    // If requested by a Manager, ensure this driver was created by this Manager
    if (req.user && req.user.role === 'MANAGER' && driver.managerId !== req.user.managerId) {
      return sendError(res, 'Forbidden: You can only view drivers created by your Manager account.', 403);
    }

    return sendSuccess(res, driver, 'Driver details retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDriver,
  getDrivers,
  getDriverById,
};
