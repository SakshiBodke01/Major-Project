const express = require('express');
const { startTrip, getTrips, getActiveTrips, getTripById, finishTrip } = require('../controllers/trip.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

const startTripSchema = {
  body: {
    tripId: { required: true, type: 'string' },
    driverId: { required: true, type: 'string' },
    startingLocation: { required: true },
  },
};

router.post('/', optionalAuth, validate(startTripSchema), startTrip);
router.get('/', optionalAuth, getTrips);
router.get('/active', optionalAuth, getActiveTrips);
router.get('/:id', optionalAuth, getTripById);
router.patch('/:id/finish', optionalAuth, finishTrip);

module.exports = router;
