const express = require('express');
const { getAnalyticsOverview } = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/overview', getAnalyticsOverview);

module.exports = router;
