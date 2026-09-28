const express = require('express');
const { createDriver, getDrivers, getDriverById } = require('../controllers/driver.controller');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

const createDriverSchema = {
  body: {
    driverId: { required: true, type: 'string' },
    name: { required: true, type: 'string' },
  },
};

router.post('/', validate(createDriverSchema), createDriver);
router.get('/', getDrivers);
router.get('/:id', getDriverById);

module.exports = router;
