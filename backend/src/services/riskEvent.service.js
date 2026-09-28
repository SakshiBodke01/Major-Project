const RiskEvent = require('../models/RiskEvent');
const Trip = require('../models/Trip');
const ScoreSnapshot = require('../models/ScoreSnapshot');
const tripService = require('./trip.service');
const scoreSnapshotService = require('./scoreSnapshot.service');
const mongoose = require('mongoose');

const inMemoryRiskEvents = new Map();

const SEVERITY_POINTS = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 25,
  CRITICAL: 30,
};

/**
 * RiskEvent Service - Hybrid Dual-Mode Persistence (MongoDB + Fallback)
 */
const createRiskEvent = async (eventData) => {
  const trip = await tripService.getTripById(eventData.tripId);
  if (!trip) {
    const err = new Error(`Trip not found with ID: ${eventData.tripId}`);
    err.statusCode = 404;
    throw err;
  }

  const pointsDeducted = eventData.pointsDeducted !== undefined
    ? eventData.pointsDeducted
    : (SEVERITY_POINTS[eventData.severity] || 5);

  let cleanedMetadata = {};
  if (eventData.metadata && typeof eventData.metadata === 'object') {
    for (const [key, val] of Object.entries(eventData.metadata)) {
      if (typeof val === 'string' && (val.startsWith('data:image') || val.length > 500)) {
        continue; // Discard raw video/image base64 content
      }
      cleanedMetadata[key] = val;
    }
  }

  if (mongoose.connection.readyState === 1) {
    const riskEvent = new RiskEvent({
      eventId: eventData.eventId,
      tripId: eventData.tripId,
      driverId: eventData.driverId,
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

    const dbTrip = await Trip.findOne({ tripId: eventData.tripId });
    const newScore = Math.max(0, dbTrip.finalScore - pointsDeducted);
    dbTrip.finalScore = newScore;
    dbTrip.totalAlerts += 1;
    await dbTrip.save();

    await ScoreSnapshot.create({
      tripId: dbTrip.tripId,
      score: newScore,
      timestamp: savedEvent.timestamp,
      reason: `EVENT_${savedEvent.type}`,
    });

    return savedEvent;
  }

  // Fallback mode
  if (inMemoryRiskEvents.has(eventData.eventId)) {
    const err = new Error('Event ID already exists');
    err.code = 11000;
    throw err;
  }

  const eventObj = {
    eventId: eventData.eventId,
    tripId: eventData.tripId,
    driverId: eventData.driverId,
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

  trip.finalScore = Math.max(0, trip.finalScore - pointsDeducted);
  trip.totalAlerts += 1;

  await scoreSnapshotService.recordSnapshot({
    tripId: trip.tripId,
    score: trip.finalScore,
    timestamp: eventObj.timestamp,
    reason: `EVENT_${eventObj.type}`,
  });

  return eventObj;
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
        totalPages: Math.ceil(total / limit),
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

module.exports = {
  createRiskEvent,
  getRiskEventsByTrip,
};
