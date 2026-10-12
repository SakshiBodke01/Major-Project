const express = require('express');
const { createDriver, getDrivers, getDriverById } = require('../controllers/driver.controller');
const { optionalAuth } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

const createDriverSchema = {
  body: {
    driverId: { required: true, type: 'string' },
    name: { required: true, type: 'string' },
  },
};

router.post('/', optionalAuth, validate(createDriverSchema), createDriver);
router.get('/', optionalAuth, getDrivers);
router.get('/:id', optionalAuth, getDriverById);

module.exports = router;
