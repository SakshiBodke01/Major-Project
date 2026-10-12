const Driver = require('../models/Driver');
const mongoose = require('mongoose');

// Pure dynamic in-memory store (zero dummy drivers)
const inMemoryDrivers = new Map();

/**
 * Driver Service - Hybrid Dual-Mode Persistence with Manager Scoping
 */
const createDriver = async (driverData, managerId) => {
  const effectiveManagerId = managerId || driverData.managerId;
  if (!effectiveManagerId) {
    const err = new Error('A managerId is required to create a driver.');
    err.statusCode = 400;
    throw err;
  }

  const payload = {
    driverId: driverData.driverId,
    name: driverData.name,
    password: driverData.password || 'driver123',
    managerId: effectiveManagerId,
    role: 'DRIVER',
    phone: driverData.phone || null,
    licenseNumber: driverData.licenseNumber || null,
    safetyRating: typeof driverData.safetyRating === 'number' ? driverData.safetyRating : 100,
    status: driverData.status || 'ACTIVE',
  };

  if (mongoose.connection.readyState === 1) {
    const driver = new Driver(payload);
    const saved = await driver.save();
    inMemoryDrivers.set(saved.driverId, saved.toObject ? saved.toObject() : saved);
    return saved;
  }

  if (inMemoryDrivers.has(payload.driverId)) {
    const err = new Error(`Driver ID '${payload.driverId}' already exists`);
    err.code = 11000;
    err.statusCode = 409;
    throw err;
  }

  const driverObj = {
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryDrivers.set(payload.driverId, driverObj);
  return driverObj;
};

const getDriverById = async (driverId) => {
  if (mongoose.connection.readyState === 1) {
    const doc = await Driver.findOne({ driverId });
    if (doc) return doc;
  }
  return inMemoryDrivers.get(driverId) || null;
};

const getDrivers = async (managerId = null, page = 1, limit = 20) => {
  if (mongoose.connection.readyState === 1) {
    const query = managerId ? { managerId } : {};
    const skip = (page - 1) * limit;
    const [drivers, total] = await Promise.all([
      Driver.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Driver.countDocuments(query),
    ]);

    return {
      drivers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  let allDrivers = Array.from(inMemoryDrivers.values());
  if (managerId) {
    allDrivers = allDrivers.filter((d) => d.managerId === managerId);
  }

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

const getDriverIdsByManager = async (managerId) => {
  if (!managerId) return [];
  if (mongoose.connection.readyState === 1) {
    const docs = await Driver.find({ managerId }).select('driverId').lean();
    return docs.map((d) => d.driverId);
  }
  return Array.from(inMemoryDrivers.values())
    .filter((d) => d.managerId === managerId)
    .map((d) => d.driverId);
};

const authenticateDriver = async (driverId, password) => {
  let driver = null;
  if (mongoose.connection.readyState === 1) {
    driver = await Driver.findOne({ driverId });
  }
  if (!driver) {
    driver = inMemoryDrivers.get(driverId);
  }
  if (!driver) return null;

  // Simple string comparison for driver password
  if (driver.password && driver.password !== password) {
    return null;
  }
  return driver;
};

module.exports = {
  createDriver,
  getDriverById,
  getDrivers,
  getDriverIdsByManager,
  authenticateDriver,
};
