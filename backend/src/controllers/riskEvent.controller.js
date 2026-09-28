const riskEventService = require('../services/riskEvent.service');
const { sendSuccess } = require('../utils/responseHandler');

const createRiskEvent = async (req, res, next) => {
  try {
    const riskEvent = await riskEventService.createRiskEvent(req.body);
    return sendSuccess(res, riskEvent, 'Risk event recorded successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Event ID already exists';
    }
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

module.exports = {
  createRiskEvent,
  getRiskEventsByTrip,
};
