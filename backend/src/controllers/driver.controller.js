const driverService = require('../services/driver.service');
const { sendSuccess } = require('../utils/responseHandler');

const createDriver = async (req, res, next) => {
  try {
    const driver = await driverService.createDriver(req.body);
    return sendSuccess(res, driver, 'Driver registered successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Driver ID already exists';
    }
    next(error);
  }
};

const getDrivers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const result = await driverService.getDrivers(page, limit);
    return sendSuccess(res, result.drivers, 'Drivers retrieved successfully', 200, result.pagination);
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
