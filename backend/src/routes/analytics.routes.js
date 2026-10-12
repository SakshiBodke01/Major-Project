const express = require('express');
const { getAnalyticsOverview } = require('../controllers/analytics.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/overview', optionalAuth, getAnalyticsOverview);

module.exports = router;
