const express = require('express');
const { getScoreSnapshotsByTrip } = require('../controllers/scoreSnapshot.controller');

const router = express.Router();

router.get('/trip/:tripId', getScoreSnapshotsByTrip);

module.exports = router;
