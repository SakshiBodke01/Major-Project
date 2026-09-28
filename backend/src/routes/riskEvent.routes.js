const express = require('express');
const { createRiskEvent, getRiskEventsByTrip } = require('../controllers/riskEvent.controller');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

const createRiskEventSchema = {
  body: {
    eventId: { required: true, type: 'string' },
    tripId: { required: true, type: 'string' },
    driverId: { required: true, type: 'string' },
    type: { required: true, type: 'string' },
    severity: { required: true, type: 'string' },
    latitude: { required: true, type: 'number' },
    longitude: { required: true, type: 'number' },
  },
};

router.post('/', validate(createRiskEventSchema), createRiskEvent);
router.get('/trip/:tripId', getRiskEventsByTrip);

module.exports = router;
