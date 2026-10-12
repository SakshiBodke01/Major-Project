const express = require('express');
const {
  createRiskEvent,
  getRiskEvents,
  getRiskEventsByTrip,
  getSummary,
} = require('../controllers/riskEvent.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', optionalAuth, createRiskEvent);
router.get('/', optionalAuth, getRiskEvents);
router.get('/summary', optionalAuth, getSummary);
router.get('/trip/:tripId', optionalAuth, getRiskEventsByTrip);

module.exports = router;
