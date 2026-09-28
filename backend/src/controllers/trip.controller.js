const tripService = require('../services/trip.service');
const { sendSuccess } = require('../utils/responseHandler');

const startTrip = async (req, res, next) => {
  try {
    const trip = await tripService.startTrip(req.body);
    return sendSuccess(res, trip, 'Trip started successfully', 201);
  } catch (error) {
    if (error.code === 11000) {
      error.statusCode = 409;
      error.message = 'Trip ID already exists';
    }
    next(error);
  }
};

const getActiveTrips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const result = await tripService.getActiveTrips(page, limit);
    return sendSuccess(res, result.trips, 'Active trips retrieved successfully', 200, result.pagination);
  } catch (error) {
    next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) {
      const err = new Error(`Trip not found with ID: ${req.params.id}`);
      err.statusCode = 404;
      throw err;
    }
    return sendSuccess(res, trip, 'Trip details retrieved');
  } catch (error) {
    next(error);
  }
};

const finishTrip = async (req, res, next) => {
  try {
    const trip = await tripService.finishTrip(req.params.id, req.body);
    return sendSuccess(res, trip, 'Trip completed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startTrip,
  getActiveTrips,
  getTripById,
  finishTrip,
};
