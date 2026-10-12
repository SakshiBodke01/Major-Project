const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const ScoreSnapshot = require('../models/ScoreSnapshot');
const driverService = require('./driver.service');
const scoreSnapshotService = require('./scoreSnapshot.service');
const liveStreamService = require('./liveStream.service');
const mongoose = require('mongoose');

// Pure dynamic in-memory store (zero dummy trips)
const inMemoryTrips = new Map();

/**
 * Trip Service - Hybrid Dual-Mode Persistence with Manager Scoping
 */

const startTrip = async (tripData) => {
  let driver = await driverService.getDriverById(tripData.driverId);
  if (!driver) {
    // If driver started on phone without prior creation, auto-link to MGR-001
    driver = await driverService.createDriver(
      {
        driverId: tripData.driverId,
        name: `Driver ${tripData.driverId}`,
        password: 'driver123',
        managerId: 'MGR-001',
        status: 'ON_TRIP',
      },
      'MGR-001'
    );
  }

  const managerId = driver.managerId || tripData.managerId || 'MGR-001';

  if (mongoose.connection.readyState === 1) {
    const trip = new Trip({
      tripId: tripData.tripId,
      driverId: tripData.driverId,
      managerId,
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

    liveStreamService.broadcast('trip_update', {
      eventType: 'trip_update',
      type: 'TRIP_START',
      trip: savedTrip,
      tripId: savedTrip.tripId,
      driverId: tripData.driverId,
      managerId,
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
    managerId,
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

  liveStreamService.broadcast('trip_update', {
    eventType: 'trip_update',
    type: 'TRIP_START',
    trip: tripObj,
    tripId: tripObj.tripId,
    driverId: tripData.driverId,
    managerId,
  });

  return tripObj;
};

const getTrips = async (page = 1, limit = 50, managerId = null) => {
  let driverIds = [];
  if (managerId) {
    driverIds = await driverService.getDriverIdsByManager(managerId);
  }

  if (mongoose.connection.readyState === 1) {
    const filter = managerId
      ? { $or: [{ managerId }, { driverId: { $in: driverIds } }] }
      : {};
    const skip = (page - 1) * limit;
    const [trips, total] = await Promise.all([
      Trip.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit),
      Trip.countDocuments(filter),
    ]);

    return {
      trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  let allTrips = Array.from(inMemoryTrips.values());
  if (managerId) {
    allTrips = allTrips.filter(
      (t) => t.managerId === managerId || driverIds.includes(t.driverId)
    );
  }

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

const getActiveTrips = async (page = 1, limit = 20, managerId = null) => {
  let driverIds = [];
  if (managerId) {
    driverIds = await driverService.getDriverIdsByManager(managerId);
  }

  if (mongoose.connection.readyState === 1) {
    const filter = {
      status: 'ACTIVE',
      ...(managerId ? { $or: [{ managerId }, { driverId: { $in: driverIds } }] } : {}),
    };
    const skip = (page - 1) * limit;
    const [trips, total] = await Promise.all([
      Trip.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit),
      Trip.countDocuments(filter),
    ]);

    return {
      trips,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  let activeTrips = Array.from(inMemoryTrips.values()).filter((t) => t.status === 'ACTIVE');
  if (managerId) {
    activeTrips = activeTrips.filter(
      (t) => t.managerId === managerId || driverIds.includes(t.driverId)
    );
  }

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

  if (mongoose.connection.readyState === 1) {
    const updatedTrip = await Trip.findOneAndUpdate(
      { tripId },
      {
        status: 'COMPLETED',
        endTime: finishData.endTime || new Date(),
        endingLocation: finishData.endingLocation || null,
        finalScore: finishData.finalScore !== undefined ? finishData.finalScore : trip.finalScore,
      },
      { new: true }
    );

    await Driver.findOneAndUpdate({ driverId: trip.driverId }, { status: 'ACTIVE' });

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
