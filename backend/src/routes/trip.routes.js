const express = require('express');
const { startTrip, getActiveTrips, getTripById, finishTrip } = require('../controllers/trip.controller');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

const startTripSchema = {
  body: {
    tripId: { required: true, type: 'string' },
    driverId: { required: true, type: 'string' },
    startingLocation: { required: true },
  },
};

router.post('/', validate(startTripSchema), startTrip);
router.get('/active', getActiveTrips);
router.get('/:id', getTripById);
router.patch('/:id/finish', finishTrip);

module.exports = router;
