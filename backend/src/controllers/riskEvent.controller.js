const riskEventService = require('../services/riskEvent.service');
const { sendSuccess } = require('../utils/responseHandler');

const createRiskEvent = async (req, res, next) => {
  try {
    const raw = req.body || {};
    const normalizedPayload = {
      ...raw,
      eventId: raw.eventId || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tripId: raw.tripId || 'TRIP-DEFAULT',
      driverId: raw.driverId || 'DRV-UNKNOWN',
      type: (raw.type || raw.eventType || 'DISTRACTION').toUpperCase(),
      severity: (raw.severity || 'MEDIUM').toUpperCase(),
      latitude: raw.latitude !== undefined ? Number(raw.latitude) : Number(raw.location?.latitude || 0),
      longitude: raw.longitude !== undefined ? Number(raw.longitude) : Number(raw.location?.longitude || 0),
    };

    const riskEvent = await riskEventService.createRiskEvent(normalizedPayload);
    return sendSuccess(res, riskEvent, 'Risk event recorded successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Event ID already exists';
    }
    next(error);
  }
};

const getRiskEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const managerId = req.user?.managerId || req.query.managerId || null;
    const result = await riskEventService.getRiskEvents(page, limit, managerId);
    return sendSuccess(res, result.events, 'Risk events retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getRiskEventsByTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const result = await riskEventService.getRiskEventsByTrip(tripId, page, limit);
    return sendSuccess(res, result.events, 'Risk events retrieved for trip', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const managerId = req.user?.managerId || req.query.managerId || null;
    const summary = await riskEventService.getSummary(managerId);
    return sendSuccess(res, summary, 'Risk summary retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRiskEvent,
  getRiskEvents,
  getRiskEventsByTrip,
  getSummary,
};
