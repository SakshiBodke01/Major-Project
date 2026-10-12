const RiskEvent = require('../models/RiskEvent');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const mongoose = require('mongoose');

/**
 * Analytics Service - Server-side Aggregation with Hybrid Dual-Mode Persistence
 */

const getAnalyticsOverview = async (filters = {}) => {
  const { startDate, endDate, driverId, managerId } = filters;
  const driverService = require('./driver.service');
  let managerDriverIds = [];
  if (managerId) {
    managerDriverIds = await driverService.getDriverIdsByManager(managerId);
  }

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  if (mongoose.connection.readyState === 1) {
    // Mongo DB Aggregation Pipelines
    const tripMatch = {};
    const eventMatch = {};
    const driverMatch = {};

    if (driverId) {
      tripMatch.driverId = driverId;
      eventMatch.driverId = driverId;
      driverMatch.driverId = driverId;
    } else if (managerId) {
      tripMatch.$or = [{ managerId }, { driverId: { $in: managerDriverIds } }];
      eventMatch.$or = [{ managerId }, { driverId: { $in: managerDriverIds } }];
      driverMatch.managerId = managerId;
    }

    if (start || end) {
      tripMatch.startTime = {};
      eventMatch.timestamp = {};
      if (start) {
        tripMatch.startTime.$gte = start;
        eventMatch.timestamp.$gte = start;
      }
      if (end) {
        tripMatch.startTime.$lte = end;
        eventMatch.timestamp.$lte = end;
      }
    }

    const [trips, events, drivers] = await Promise.all([
      Trip.find(tripMatch).lean(),
      RiskEvent.find(eventMatch).lean(),
      Driver.find(driverMatch).lean(),
    ]);

    return computeAnalyticsResult(trips, events, drivers);
  }

  // Hybrid Fallback Mode (Reading from service memory maps/collections if available)
  const tripService = require('./trip.service');
  const riskEventService = require('./riskEvent.service');

  const [tripsRes, driversRes] = await Promise.all([
    tripService.getTrips(1, 1000, managerId),
    driverService.getDrivers(managerId, 1, 1000),
  ]);

  // Gather fallback trips & drivers
  let trips = tripsRes.trips || [];
  let drivers = driversRes.drivers || [];

  // Filter trips
  if (driverId) {
    trips = trips.filter(t => t.driverId === driverId);
  }
  if (start) {
    trips = trips.filter(t => new Date(t.startTime) >= start);
  }
  if (end) {
    trips = trips.filter(t => new Date(t.startTime) <= end);
  }

  // Fetch events for trips
  let events = [];
  for (const t of trips) {
    const evRes = await riskEventService.getRiskEventsByTrip(t.tripId, 1, 1000);
    if (evRes.events) {
      events.push(...evRes.events);
    }
  }

  if (driverId) {
    drivers = drivers.filter(d => d.driverId === driverId);
  }

  return computeAnalyticsResult(trips, events, drivers);
};

const computeAnalyticsResult = (trips, events, drivers) => {
  const totalTrips = trips.length;
  const activeTrips = trips.filter(t => t.status === 'ACTIVE' || t.status === 'MONITORING').length;
  const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;
  const totalRiskEvents = events.length;

  // Event Type Distribution
  const eventTypeDistribution = {
    DROWSINESS: 0,
    PHONE: 0,
    DISTRACTION: 0,
    YAWNING: 0,
  };

  const severityDistribution = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  events.forEach((evt) => {
    const rawType = (evt.type || evt.eventType || 'DISTRACTION').toUpperCase();
    if (rawType.includes('DROWS')) eventTypeDistribution.DROWSINESS += 1;
    else if (rawType.includes('PHONE')) eventTypeDistribution.PHONE += 1;
    else if (rawType.includes('YAWN')) eventTypeDistribution.YAWNING += 1;
    else eventTypeDistribution.DISTRACTION += 1;

    const sev = (evt.severity || 'MEDIUM').toUpperCase();
    if (severityDistribution[sev] !== undefined) {
      severityDistribution[sev] += 1;
    } else {
      severityDistribution.MEDIUM += 1;
    }
  });

  // Calculate Average Trip Final Score (per-trip)
  const avgTripScore = totalTrips > 0
    ? Math.round(trips.reduce((acc, t) => acc + (t.finalScore ?? t.currentScore ?? 100), 0) / totalTrips)
    : 100;

  // Calculate Average Driver Safety Rating (per-driver)
  const driverMap = new Map();
  drivers.forEach(d => {
    driverMap.set(d.driverId, {
      driverId: d.driverId,
      name: d.name || d.driverId,
      status: d.status || 'ACTIVE',
      safetyRating: d.safetyRating !== undefined ? d.safetyRating : 100,
      tripCount: 0,
      eventCount: 0,
    });
  });

  trips.forEach(t => {
    if (!driverMap.has(t.driverId)) {
      driverMap.set(t.driverId, {
        driverId: t.driverId,
        name: t.driverId,
        status: 'ACTIVE',
        safetyRating: t.finalScore ?? 100,
        tripCount: 0,
        eventCount: 0,
      });
    }
    const entry = driverMap.get(t.driverId);
    entry.tripCount += 1;
  });

  events.forEach(e => {
    if (driverMap.has(e.driverId)) {
      driverMap.get(e.driverId).eventCount += 1;
    }
  });

  const driverList = Array.from(driverMap.values());
  const avgFleetScore = driverList.length > 0
    ? Math.round(driverList.reduce((acc, d) => acc + d.safetyRating, 0) / driverList.length)
    : 100;

  // High-Risk Driver Identification (< 70 rating or highest alert counts)
  const highRiskDrivers = driverList
    .filter(d => d.safetyRating < 75 || d.eventCount > 2)
    .sort((a, b) => a.safetyRating - b.safetyRating);

  // Time-Series Safety Score Trends (group by date)
  const trendMap = new Map();
  trips.forEach(t => {
    const d = new Date(t.startTime || t.createdAt || Date.now());
    const dateKey = d.toISOString().split('T')[0];
    if (!trendMap.has(dateKey)) {
      trendMap.set(dateKey, { date: dateKey, totalScore: 0, tripCount: 0, eventCount: 0 });
    }
    const item = trendMap.get(dateKey);
    item.totalScore += (t.finalScore ?? 100);
    item.tripCount += 1;
  });

  events.forEach(e => {
    const d = new Date(e.timestamp || e.createdAt || Date.now());
    const dateKey = d.toISOString().split('T')[0];
    if (trendMap.has(dateKey)) {
      trendMap.get(dateKey).eventCount += 1;
    }
  });

  const scoreTrends = Array.from(trendMap.values())
    .map(item => ({
      date: item.date,
      avgScore: Math.round(item.totalScore / (item.tripCount || 1)),
      tripCount: item.tripCount,
      eventCount: item.eventCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    summary: {
      totalTrips,
      activeTrips,
      completedTrips,
      totalRiskEvents,
      avgFleetScore,
      avgTripScore,
      driverCount: driverList.length,
      sampleSizeNote: totalTrips < 5
        ? `Note: Small sample size (${totalTrips} trip(s), ${totalRiskEvents} risk event(s)).`
        : `Aggregated across ${totalTrips} trip(s), ${totalRiskEvents} risk event(s), and ${driverList.length} driver(s).`,
    },
    eventTypeDistribution,
    severityDistribution,
    highRiskDrivers,
    scoreTrends,
    driverRoster: driverList,
  };
};

module.exports = {
  getAnalyticsOverview,
};
