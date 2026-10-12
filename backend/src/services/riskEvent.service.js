const RiskEvent = require('../models/RiskEvent');
const Trip = require('../models/Trip');
const ScoreSnapshot = require('../models/ScoreSnapshot');
const tripService = require('./trip.service');
const driverService = require('./driver.service');
const scoreSnapshotService = require('./scoreSnapshot.service');
const liveStreamService = require('./liveStream.service');
const mongoose = require('mongoose');

// Pure dynamic in-memory store (zero dummy risk events)
const inMemoryRiskEvents = new Map();

const SEVERITY_POINTS = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 25,
  CRITICAL: 30,
};

/**
 * RiskEvent Service - Hybrid Dual-Mode Persistence with Manager Scoping
 */
const createRiskEvent = async (eventData) => {
  let driver = await driverService.getDriverById(eventData.driverId);
  if (!driver) {
    driver = await driverService.createDriver(
      {
        driverId: eventData.driverId,
        name: `Driver ${eventData.driverId}`,
        password: 'driver123',
        managerId: 'MGR-001',
        status: 'ON_TRIP',
      },
      'MGR-001'
    );
  }

  let trip = await tripService.getTripById(eventData.tripId);
  if (!trip) {
    trip = await tripService.startTrip({
      tripId: eventData.tripId,
      driverId: eventData.driverId,
      managerId: driver.managerId || 'MGR-001',
      startingLocation: {
        latitude: eventData.latitude || 37.7749,
        longitude: eventData.longitude || -122.4194,
        address: 'Live Edge GPS',
      },
      startTime: eventData.timestamp || new Date(),
    });
  }

  const managerId = eventData.managerId || trip?.managerId || driver?.managerId || 'MGR-001';

  const pointsDeducted =
    eventData.pointsDeducted !== undefined
      ? eventData.pointsDeducted
      : SEVERITY_POINTS[eventData.severity] || 5;

  let cleanedMetadata = {};
  if (eventData.metadata && typeof eventData.metadata === 'object') {
    for (const [key, val] of Object.entries(eventData.metadata)) {
      if (typeof val === 'string' && (val.startsWith('data:image') || val.length > 500)) {
        continue;
      }
      cleanedMetadata[key] = val;
    }
  }

  if (mongoose.connection.readyState === 1) {
    const riskEvent = new RiskEvent({
      eventId: eventData.eventId,
      tripId: eventData.tripId,
      driverId: eventData.driverId,
      managerId,
      type: eventData.type,
      severity: eventData.severity || 'MEDIUM',
      pointsDeducted,
      timestamp: eventData.timestamp || new Date(),
      latitude: eventData.latitude,
      longitude: eventData.longitude,
      confidence: eventData.confidence || null,
      metadata: cleanedMetadata,
    });

    const savedEvent = await riskEvent.save();

    let newScore = 100;
    if (trip) {
      const dbTrip = await Trip.findOne({ tripId: eventData.tripId });
      if (dbTrip) {
        dbTrip.finalScore = Math.max(0, dbTrip.finalScore - pointsDeducted);
        dbTrip.totalAlerts += 1;
        await dbTrip.save();
        newScore = dbTrip.finalScore;

        await ScoreSnapshot.create({
          tripId: dbTrip.tripId,
          score: dbTrip.finalScore,
          timestamp: savedEvent.timestamp,
          reason: `EVENT_${savedEvent.type}`,
        });
      }
    }

    liveStreamService.broadcast('risk_event', {
      event: savedEvent,
      tripId: eventData.tripId,
      driverId: eventData.driverId,
      managerId,
      newScore,
      type: eventData.type,
      severity: savedEvent.severity,
      pointsDeducted,
    });

    return savedEvent;
  }

  // Fallback mode
  if (inMemoryRiskEvents.has(eventData.eventId)) {
    const err = new Error('RiskEvent ID already exists');
    err.code = 11000;
    throw err;
  }

  const eventObj = {
    eventId: eventData.eventId,
    tripId: eventData.tripId,
    driverId: eventData.driverId,
    managerId,
    type: eventData.type,
    severity: eventData.severity || 'MEDIUM',
    pointsDeducted,
    timestamp: eventData.timestamp || new Date(),
    latitude: eventData.latitude,
    longitude: eventData.longitude,
    confidence: eventData.confidence || null,
    metadata: cleanedMetadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryRiskEvents.set(eventData.eventId, eventObj);

  let updatedScore = 100;
  if (trip) {
    trip.finalScore = Math.max(0, trip.finalScore - pointsDeducted);
    trip.totalAlerts += 1;
    updatedScore = trip.finalScore;

    await scoreSnapshotService.recordSnapshot({
      tripId: trip.tripId,
      score: trip.finalScore,
      timestamp: eventObj.timestamp,
      reason: `EVENT_${eventObj.type}`,
    });
  }

  liveStreamService.broadcast('risk_event', {
    event: eventObj,
    tripId: eventData.tripId,
    driverId: eventData.driverId,
    managerId,
    newScore: updatedScore,
    type: eventData.type,
    severity: eventObj.severity,
    pointsDeducted,
  });

  return eventObj;
};

const getRiskEvents = async (page = 1, limit = 50, managerId = null) => {
  let driverIds = [];
  if (managerId) {
    driverIds = await driverService.getDriverIdsByManager(managerId);
  }

  if (mongoose.connection.readyState === 1) {
    const filter = managerId
      ? { $or: [{ managerId }, { driverId: { $in: driverIds } }] }
      : {};
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      RiskEvent.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit),
      RiskEvent.countDocuments(filter),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  let allEvents = Array.from(inMemoryRiskEvents.values());
  if (managerId) {
    allEvents = allEvents.filter(
      (e) => e.managerId === managerId || driverIds.includes(e.driverId)
    );
  }

  const total = allEvents.length;
  const skip = (page - 1) * limit;
  const paginated = allEvents.slice(skip, skip + limit);

  return {
    events: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getRiskEventsByTrip = async (tripId, page = 1, limit = 20) => {
  if (mongoose.connection.readyState === 1) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      RiskEvent.find({ tripId }).sort({ timestamp: -1 }).skip(skip).limit(limit),
      RiskEvent.countDocuments({ tripId }),
    ]);

    return {
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  const filtered = Array.from(inMemoryRiskEvents.values()).filter((e) => e.tripId === tripId);
  const total = filtered.length;
  const skip = (page - 1) * limit;
  const paginated = filtered.slice(skip, skip + limit);

  return {
    events: paginated,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getSummary = async (managerId = null) => {
  let driverIds = [];
  if (managerId) {
    driverIds = await driverService.getDriverIdsByManager(managerId);
  }

  let events = [];
  if (mongoose.connection.readyState === 1) {
    const filter = managerId
      ? { $or: [{ managerId }, { driverId: { $in: driverIds } }] }
      : {};
    events = await RiskEvent.find(filter).lean();
  } else {
    events = Array.from(inMemoryRiskEvents.values());
    if (managerId) {
      events = events.filter((e) => e.managerId === managerId || driverIds.includes(e.driverId));
    }
  }

  const breakdown = {
    drowsiness: 0,
    distraction: 0,
    phone: 0,
    yawning: 0,
  };

  for (const e of events) {
    const t = (e.type || '').toUpperCase();
    if (t.includes('DROWS')) breakdown.drowsiness++;
    else if (t.includes('PHONE')) breakdown.phone++;
    else if (t.includes('YAWN')) breakdown.yawning++;
    else breakdown.distraction++;
  }

  return {
    totalEvents: events.length,
    breakdown,
  };
};

module.exports = {
  createRiskEvent,
  getRiskEvents,
  getRiskEventsByTrip,
  getSummary,
};
