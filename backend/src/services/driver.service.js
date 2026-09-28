const Driver = require('../models/Driver');
const mongoose = require('mongoose');

const inMemoryDrivers = new Map();

/**
 * Driver Service - Hybrid Dual-Mode Persistence (MongoDB + Fallback)
 */
const createDriver = async (driverData) => {
  if (mongoose.connection.readyState === 1) {
    const driver = new Driver(driverData);
    return await driver.save();
  }

  if (inMemoryDrivers.has(driverData.driverId)) {
    const err = new Error('Driver ID already exists');
    err.code = 11000;
    throw err;
  }

  const driverObj = {
    driverId: driverData.driverId,
    name: driverData.name,
    phone: driverData.phone || null,
    status: driverData.status || 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryDrivers.set(driverData.driverId, driverObj);
  return driverObj;
};

const getDriverById = async (driverId) => {
  if (mongoose.connection.readyState === 1) {
    return await Driver.findOne({ driverId });
  }
  return inMemoryDrivers.get(driverId) || null;
};

const getDrivers = async (page = 1, limit = 20) => {
  if (mongoose.connection.readyState === 1) {
    const skip = (page - 1) * limit;
    const [drivers, total] = await Promise.all([
      Driver.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Driver.countDocuments(),
    ]);

    return {
      drivers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const allDrivers = Array.from(inMemoryDrivers.values());
  const total = allDrivers.length;
  const skip = (page - 1) * limit;
  const paginated = allDrivers.slice(skip, skip + limit);

  return {
    drivers: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

module.exports = {
  createDriver,
  getDriverById,
  getDrivers,
};
