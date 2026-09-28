const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
  {
    driverId: {
      type: String,
      required: [true, 'driverId is required'],
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_TRIP', 'SUSPENDED', 'OFF_DUTY'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', DriverSchema);
