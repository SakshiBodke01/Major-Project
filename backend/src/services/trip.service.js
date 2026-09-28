const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const ScoreSnapshot = require('../models/ScoreSnapshot');
const driverService = require('./driver.service');
const scoreSnapshotService = require('./scoreSnapshot.service');
const mongoose = require('mongoose');

const inMemoryTrips = new Map();

/**
 * Trip Service - Hybrid Dual-Mode Persistence (MongoDB + Fallback)
 */

const startTrip = async (tripData) => {
  const driver = await driverService.getDriverById(tripData.driverId);
  if (!driver) {
    const err = new Error(`Driver not found with ID: ${tripData.driverId}`);
    err.statusCode = 404;
    throw err;
  }

  if (mongoose.connection.readyState === 1) {
    const trip = new Trip({
      tripId: tripData.tripId,
      driverId: tripData.driverId,
      startTime: tripData.startTime || new Date(),
      status: 'ACTIVE',
      startingLocation: tripData.startingLocation,
      finalScore: 100,
      totalAlerts: 0,
    });

    const savedTrip = await trip.save();
    await Driver.findOneAndUpdate({ driverId: tripData.driverId }, { status: 'ON_TRIP' });

    await ScoreSnapshot.create({
      tripId: savedTrip.tripId,
      score: 100,
      timestamp: savedTrip.startTime,
      reason: 'TRIP_START',
    });

    return savedTrip;
  }

  // Fallback mode
  if (inMemoryTrips.has(tripData.tripId)) {
    const err = new Error('Trip ID already exists');
    err.code = 11000;
    throw err;
  }

  const tripObj = {
    tripId: tripData.tripId,
    driverId: tripData.driverId,
    startTime: tripData.startTime || new Date(),
    endTime: null,
    status: 'ACTIVE',
    startingLocation: tripData.startingLocation,
    endingLocation: null,
    finalScore: 100,
    totalAlerts: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryTrips.set(tripData.tripId, tripObj);
  driver.status = 'ON_TRIP';

  await scoreSnapshotService.recordSnapshot({
    tripId: tripObj.tripId,
    score: 100,
    timestamp: tripObj.startTime,
    reason: 'TRIP_START',
  });

  return tripObj;
};

const getTrips = async (page = 1, limit = 50) => {
  if (mongoose.connection.readyState === 1) {
    const skip = (page - 1) * limit;
    const [trips, total] = await Promise.all([
      Trip.find().sort({ startTime: -1 }).skip(skip).limit(limit),
      Trip.countDocuments(),
    ]);

    return {
      trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const allTrips = Array.from(inMemoryTrips.values());
  const total = allTrips.length;
  const skip = (page - 1) * limit;
  const paginated = allTrips.slice(skip, skip + limit);

  return {
    trips: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getActiveTrips = async (page = 1, limit = 20) => {
  if (mongoose.connection.readyState === 1) {
    const skip = (page - 1) * limit;
    const [trips, total] = await Promise.all([
      Trip.find({ status: 'ACTIVE' }).sort({ startTime: -1 }).skip(skip).limit(limit),
      Trip.countDocuments({ status: 'ACTIVE' }),
    ]);

    return {
      trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const activeTrips = Array.from(inMemoryTrips.values()).filter((t) => t.status === 'ACTIVE');
  const total = activeTrips.length;
  const skip = (page - 1) * limit;
  const paginated = activeTrips.slice(skip, skip + limit);

  return {
    trips: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getTripById = async (tripId) => {
  if (mongoose.connection.readyState === 1) {
    return await Trip.findOne({ tripId });
  }
  return inMemoryTrips.get(tripId) || null;
};

const finishTrip = async (tripId, finishData = {}) => {
  const trip = await getTripById(tripId);
  if (!trip) {
    const err = new Error(`Trip not found with ID: ${tripId}`);
    err.statusCode = 404;
    throw err;
  }

  if (trip.status === 'COMPLETED') {
    const err = new Error(`Trip ${tripId} is already completed`);
    err.statusCode = 400;
    throw err;
  }

  if (mongoose.connection.readyState === 1) {
    const dbTrip = await Trip.findOne({ tripId });
    dbTrip.status = 'COMPLETED';
    dbTrip.endTime = finishData.endTime || new Date();
    if (finishData.endingLocation) dbTrip.endingLocation = finishData.endingLocation;
    if (finishData.finalScore !== undefined) dbTrip.finalScore = finishData.finalScore;

    const updatedTrip = await dbTrip.save();
    await Driver.findOneAndUpdate({ driverId: dbTrip.driverId }, { status: 'ACTIVE' });

    await ScoreSnapshot.create({
      tripId: updatedTrip.tripId,
      score: updatedTrip.finalScore,
      timestamp: updatedTrip.endTime,
      reason: 'TRIP_FINISH',
    });

    return updatedTrip;
  }

  // Fallback mode
  trip.status = 'COMPLETED';
  trip.endTime = finishData.endTime || new Date();
  if (finishData.endingLocation) trip.endingLocation = finishData.endingLocation;
  if (finishData.finalScore !== undefined) trip.finalScore = finishData.finalScore;
  trip.updatedAt = new Date();

  const driver = await driverService.getDriverById(trip.driverId);
  if (driver) driver.status = 'ACTIVE';

  await scoreSnapshotService.recordSnapshot({
    tripId: trip.tripId,
    score: trip.finalScore,
    timestamp: trip.endTime,
    reason: 'TRIP_FINISH',
  });

  return trip;
};

module.exports = {
  startTrip,
  getTrips,
  getActiveTrips,
  getTripById,
  finishTrip,
};
